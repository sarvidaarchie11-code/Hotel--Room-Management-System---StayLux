import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import { prisma } from '../config/db';
import { bookingInclude } from '../repositories/bookingRepository';
import { serializeBooking } from './bookingService';

const monthKeys = (n: number) => {
  const start = startOfMonth(subMonths(new Date(), n - 1));
  return Array.from({ length: n }, (_, i) => {
    const d = addMonths(start, i);
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM') };
  });
};

export async function getDashboard() {
  const months = monthKeys(6);
  const since = startOfMonth(subMonths(new Date(), 5));

  const [roomsByStatus, totalRooms, pending, pendingPayments, totalUsers, revenue, recent, payments, bookings, byBookingStatus] = await Promise.all([
    prisma.room.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.room.count(),
    prisma.booking.count({ where: { status: 'Pending' } }),
    prisma.payment.count({ where: { status: 'Submitted' } }),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.payment.aggregate({ where: { status: 'Verified' }, _sum: { amount: true } }),
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: bookingInclude }),
    prisma.payment.findMany({ where: { status: 'Verified', paidAt: { gte: since } }, select: { amount: true, paidAt: true } }),
    prisma.booking.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const count = (s: string) => roomsByStatus.find((r) => r.status === s)?._count._all ?? 0;
  const revenueByMonth = Object.fromEntries(months.map((m) => [m.key, 0]));
  payments.forEach((p) => { const k = format(p.paidAt, 'yyyy-MM'); if (k in revenueByMonth) revenueByMonth[k] += p.amount; });
  const trendByMonth = Object.fromEntries(months.map((m) => [m.key, 0]));
  bookings.forEach((b) => { const k = format(b.createdAt, 'yyyy-MM'); if (k in trendByMonth) trendByMonth[k] += 1; });

  return {
    totals: {
      totalRooms,
      availableRooms: count('Available'),
      occupiedRooms: count('Occupied'),
      reservedRooms: count('Reserved'),
      pendingReservations: pending,
      pendingPayments,
      totalUsers,
      totalRevenue: revenue._sum.amount ?? 0,
    },
    recentBookings: recent.map(serializeBooking),
    charts: {
      monthlyRevenue: months.map((m) => ({ label: m.label, value: Math.round(revenueByMonth[m.key] * 100) / 100 })),
      reservationTrends: months.map((m) => ({ label: m.label, value: trendByMonth[m.key] })),
      bookingStats: byBookingStatus.map((b) => ({ label: b.status, value: b._count._all })),
      roomOccupancy: roomsByStatus.map((r) => ({ label: r.status, value: r._count._all })),
    },
  };
}

export async function getReport(from: Date, to: Date) {
  const [payments, bookings] = await Promise.all([
    prisma.payment.findMany({ where: { status: 'Verified', paidAt: { gte: from, lte: to } } }),
    prisma.booking.findMany({ where: { createdAt: { gte: from, lte: to } }, include: bookingInclude }),
  ]);
  const byMethod: Record<string, number> = {};
  payments.forEach((p) => { byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount; });
  const byStatus: Record<string, number> = {};
  bookings.forEach((b) => { byStatus[b.status] = (byStatus[b.status] ?? 0) + 1; });
  const earning = bookings.filter((b) => ['Confirmed', 'CheckedIn', 'CheckedOut', 'Completed'].includes(b.status));
  const roomMap = new Map<number, { name: string; roomNumber: string; nights: number; booked: number }>();
  earning.forEach((b) => {
    const cur = roomMap.get(b.roomId) ?? { name: b.room.name, roomNumber: b.room.roomNumber, nights: 0, booked: 0 };
    cur.nights += b.nights; cur.booked += b.totalAmount;
    roomMap.set(b.roomId, cur);
  });
  return {
    from, to,
    totalCollected: payments.reduce((s, p) => s + p.amount, 0),
    paymentCount: payments.length,
    totalBookings: bookings.length,
    nightsBooked: earning.reduce((s, b) => s + b.nights, 0),
    bookedValue: earning.reduce((s, b) => s + b.totalAmount, 0),
    byMethod: Object.entries(byMethod).map(([label, value]) => ({ label, value })),
    byStatus: Object.entries(byStatus).map(([label, value]) => ({ label, value })),
    topRooms: [...roomMap.values()].sort((a, b) => b.booked - a.booked).slice(0, 5),
  };
}
