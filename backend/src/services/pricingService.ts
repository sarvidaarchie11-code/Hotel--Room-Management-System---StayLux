import { prisma } from '../config/db';

/** Applies the best active special offer whose validity window covers the check-in date. */
export async function computePrice(pricePerNight: number, nights: number, checkIn: Date) {
  const subtotal = Math.round(pricePerNight * nights * 100) / 100;
  const offer = await prisma.specialOffer.findFirst({
    where: { active: true, discountPercent: { gt: 0 }, validFrom: { lte: checkIn }, validUntil: { gte: checkIn } },
    orderBy: { discountPercent: 'desc' },
  });
  const discountPercent = offer?.discountPercent ?? 0;
  const discountAmount = Math.round(subtotal * discountPercent) / 100;
  return {
    subtotal,
    discountPercent,
    discountAmount,
    offerTitle: offer?.title ?? null,
    total: Math.round((subtotal - discountAmount) * 100) / 100,
  };
}
