import { Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { prisma } from '../config/db';
import { bookingInclude, findOverlap } from '../repositories/bookingRepository';
import { recomputeRoomStatus } from './roomService';
import { notifyAdmins, notifyUser } from './notificationService';
import { emitChange } from '../socket';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors';
import { makeRef, nightsBetween, parseDay, todayString } from '../utils/helpers';
import { computePrice } from './pricingService';

type BookingFull = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

export type PaymentLabel = 'Awaiting approval' | 'Unpaid' | 'Partly paid' | 'Deposit paid' | 'Fully paid';

/** One clear label for how much of a booking has been paid (verified payments only). */
export function paymentLabel(total: number, paid: number, deposit: number): PaymentLabel {
  if (paid >= total - 0.005) return 'Fully paid';
  if (paid <= 0) return 'Unpaid';
  if (deposit > 0 && paid >= deposit - 0.005) return 'Deposit paid';
  return 'Partly paid';
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const peso = (n: number) => `PHP ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export const serializeBooking = (b: BookingFull) => {
  const paidAmount = round2(b.payments.filter((p) => p.status === 'Verified').reduce((s, p) => s + p.amount, 0));
  return {
    ...b,
    room: { ...b.room, primaryImage: b.room.images[0]?.path ?? null },
    paidAmount,
    balance: Math.max(0, round2(b.totalAmount - paidAmount)),
    depositRemaining: Math.max(0, round2(b.depositAmount - paidAmount)),
    // before the hotel approves, no payment is expected yet
    paymentStatus: (b.status === 'Pending' ? 'Awaiting approval' : paymentLabel(b.totalAmount, paidAmount, b.depositAmount)) as PaymentLabel,
  };
};

export const loadBooking = async (id: number) => {
  const b = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!b) throw notFound('Booking not found');
  return b;
};

const fmt = (d: Date) => format(new Date(d.getTime() + d.getTimezoneOffset() * 60000), 'MMM d, yyyy');

export async function createBooking(
  userId: number,
  input: { roomId: number; checkIn: string; checkOut: string; guests: number; specialRequests?: string },
) {
  if (input.checkIn < todayString()) throw badRequest('Check-in date cannot be in the past');
  const checkIn = parseDay(input.checkIn);
  const checkOut = parseDay(input.checkOut);
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw badRequest('Check-out must be after check-in');
  if (nights > 60) throw badRequest('Maximum stay is 60 nights');

  const booking = await prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { id: input.roomId } });
    if (!room) throw notFound('Room not found');
    if (room.status === 'Maintenance' || room.status === 'Unavailable') throw conflict('This room is not available for booking');
    if (input.guests > room.maxGuests) throw badRequest(`This room allows up to ${room.maxGuests} guests`);
    if (await findOverlap(room.id, checkIn, checkOut, undefined, tx)) throw conflict('Room is not available for the selected dates');
    const price = await computePrice(room.pricePerNight, nights, checkIn);
    return tx.booking.create({
      data: {
        reference: makeRef('BK'),
        userId,
        roomId: room.id,
        checkIn,
        checkOut,
        guests: input.guests,
        nights,
        pricePerNight: room.pricePerNight,
        totalAmount: price.total,
        discountPercent: price.discountPercent,
        discountAmount: price.discountAmount,
        offerTitle: price.offerTitle,
        specialRequests: input.specialRequests || null,
      },
      include: bookingInclude,
    });
  });

  await notifyUser(userId, 'BOOKING_SUBMITTED', 'Request sent - waiting for approval', `Your request ${booking.reference} for ${booking.room.name} (${fmt(booking.checkIn)} to ${fmt(booking.checkOut)}) is waiting for the hotel's approval. We'll notify you as soon as it is decided. No payment is needed yet.`, { bookingId: booking.id });
  await notifyAdmins('BOOKING_REQUEST', 'New booking request', `${booking.user.fullName} requested ${booking.room.name} (${fmt(booking.checkIn)} - ${fmt(booking.checkOut)}).`, { bookingId: booking.id });
  emitChange('booking', booking.id);
  return booking;
}

async function setStatus(id: number, from: string[], to: string, extra: Prisma.BookingUpdateInput = {}) {
  const current = await loadBooking(id);
  if (!from.includes(current.status)) throw conflict(`A ${current.status} booking cannot be changed to ${to}`);
  await prisma.booking.update({ where: { id }, data: { status: to, ...extra } });
  await recomputeRoomStatus(current.roomId);
  emitChange('booking', id);
  emitChange('room', current.roomId);
  return loadBooking(id);
}

export async function approveBooking(id: number) {
  const current = await loadBooking(id);
  if (current.status !== 'Pending') throw conflict('Only pending bookings can be approved');
  // Re-check the conflict at approval time (another booking may have been approved meanwhile)
  const clash = await findOverlap(current.roomId, current.checkIn, current.checkOut, id);
  if (clash) throw conflict(`Dates overlap with confirmed booking ${clash.reference}`);
  // Deposit rule from Hotel Settings: percent of the total, due within N hours of approval
  const cfg = await prisma.hotelSettings.findUnique({ where: { id: 1 } });
  const percent = cfg?.depositPercent ?? 50;
  const hours = cfg?.depositHours ?? 24;
  const depositAmount = percent > 0 ? round2((current.totalAmount * percent) / 100) : 0;
  const depositDueAt = depositAmount > 0 ? new Date(Date.now() + hours * 3_600_000) : null;
  const b = await setStatus(id, ['Pending'], 'Confirmed', { depositAmount, depositDueAt });
  const depositNote = depositAmount > 0 ? ` Please pay the ${percent}% deposit (${peso(depositAmount)}) within ${hours} hours to keep your reservation.` : '';
  await notifyUser(b.userId, 'BOOKING_APPROVED', 'Booking approved', `${b.reference} is confirmed for ${fmt(b.checkIn)}.${depositNote}`, { bookingId: id });
  return b;
}

export async function rejectBooking(id: number, reason: string) {
  const b = await setStatus(id, ['Pending'], 'Rejected', { rejectionReason: reason });
  await notifyUser(b.userId, 'BOOKING_REJECTED', 'Request declined', `${b.reference} could not be accepted. Reason: ${reason}. You can choose other dates or another room.`, { bookingId: id });
  return b;
}

export async function cancelBooking(id: number, actor: { id: number; role: string }) {
  const current = await loadBooking(id);
  if (actor.role !== 'ADMIN' && current.userId !== actor.id) throw forbidden();
  if (current.status === 'Pending') {
    // always cancellable
  } else if (current.status === 'Confirmed') {
    const hoursLeft = (current.checkIn.getTime() - Date.now()) / 3_600_000;
    if (actor.role !== 'ADMIN' && hoursLeft < 24) throw conflict('Confirmed bookings can only be cancelled at least 24 hours before check-in');
  } else {
    throw conflict(`A ${current.status} booking cannot be cancelled`);
  }
  const b = await setStatus(id, ['Pending', 'Confirmed'], 'Cancelled');
  await notifyAdmins('BOOKING_CANCELLED', 'Booking cancelled', `${b.user.fullName} cancelled ${b.reference}.`, { bookingId: id });
  await notifyUser(b.userId, 'BOOKING_CANCELLED_USER', 'Reservation cancelled', `${b.reference} has been cancelled.`, { bookingId: id });
  return b;
}

export async function checkInBooking(id: number) {
  const current = await loadBooking(id);
  if (current.status !== 'Confirmed') throw conflict('Only confirmed bookings can be checked in');
  if (current.checkIn.toISOString().slice(0, 10) > todayString())
    throw conflict('Guests can only be checked in on or after the check-in date');
  const b = await setStatus(id, ['Confirmed'], 'CheckedIn', { checkedInAt: new Date() });
  await notifyUser(b.userId, 'CHECKED_IN', 'Welcome!', `You are checked in to ${b.room.name}. Enjoy your stay.`, { bookingId: id });
  return b;
}

export async function checkOutBooking(id: number) {
  const b = await setStatus(id, ['CheckedIn'], 'CheckedOut', { checkedOutAt: new Date() });
  await notifyUser(b.userId, 'CHECKED_OUT', 'Thank you for staying', `You are checked out of ${b.room.name}. We hope to see you again.`, { bookingId: id });
  return maybeComplete(id);
}

/** A checked-out booking becomes Completed once it is fully paid (verified payments). */
export async function maybeComplete(id: number) {
  const b = await loadBooking(id);
  if (b.status === 'CheckedOut' && serializeBooking(b).balance <= 0) {
    await prisma.booking.update({ where: { id }, data: { status: 'Completed' } });
    emitChange('booking', id);
    return loadBooking(id);
  }
  return b;
}

export async function completeBooking(id: number) {
  const b = await loadBooking(id);
  if (b.status !== 'CheckedOut') throw conflict('Only checked-out bookings can be completed');
  if (serializeBooking(b).balance > 0) throw conflict('There is still an unpaid balance. Verify or record the remaining payment first.');
  return maybeComplete(id);
}

export async function sendUpcomingCheckInReminders() {
  const soon = new Date(Date.now() + 24 * 3_600_000);
  const due = await prisma.booking.findMany({
    where: { status: 'Confirmed', reminderSent: false, checkIn: { lte: soon, gte: parseDay(todayString()) } },
    include: bookingInclude,
  });
  for (const b of due) {
    await notifyUser(b.userId, 'UPCOMING_CHECKIN', 'Check-in coming up', `Your stay in ${b.room.name} begins ${fmt(b.checkIn)}.`, { bookingId: b.id });
    await prisma.booking.update({ where: { id: b.id }, data: { reminderSent: true } });
  }
}

/**
 * Cancels confirmed bookings whose deposit deadline passed without a verified deposit.
 * A payment that is still waiting for the admin to verify protects the booking.
 */
export async function cancelUnpaidDeposits() {
  const due = await prisma.booking.findMany({
    where: { status: 'Confirmed', depositAmount: { gt: 0 }, depositDueAt: { lt: new Date() } },
    include: bookingInclude,
  });
  for (const b of due) {
    const s = serializeBooking(b);
    if (s.paidAmount >= b.depositAmount - 0.005 || b.payments.some((p) => p.status === 'Submitted')) continue;
    await prisma.booking.update({ where: { id: b.id }, data: { status: 'Cancelled', rejectionReason: 'Deposit was not received before the deadline' } });
    await recomputeRoomStatus(b.roomId);
    await notifyUser(b.userId, 'BOOKING_CANCELLED_USER', 'Reservation cancelled', `${b.reference} was cancelled because the deposit was not received in time. You can book again anytime.`, { bookingId: b.id });
    await notifyAdmins('BOOKING_CANCELLED', 'Booking auto-cancelled', `${b.reference} (${b.user.fullName}) was cancelled: no deposit received by the deadline.`, { bookingId: b.id });
    emitChange('booking', b.id);
    emitChange('room', b.roomId);
  }
}
