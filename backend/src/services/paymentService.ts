import { prisma } from '../config/db';
import { loadBooking, maybeComplete, serializeBooking } from './bookingService';
import { notifyAdmins, notifyUser } from './notificationService';
import { emitChange } from '../socket';
import { conflict, notFound } from '../utils/errors';
import { makeRef } from '../utils/helpers';

const PAYABLE = ['Confirmed', 'CheckedIn', 'CheckedOut']; // payments open once the hotel has approved the booking

export const paymentInclude = {
  booking: { select: { id: true, reference: true, totalAmount: true, status: true, user: { select: { id: true, fullName: true, email: true } }, room: { select: { name: true, roomNumber: true } } } },
  verifiedBy: { select: { id: true, fullName: true } },
};

/**
 * Guest submits a payment record. It stays "Submitted" until an admin manually verifies it
 * (no payment gateway is configured, so nothing is ever auto-marked as paid).
 * Admin-recorded payments (e.g. cash at the front desk) are verified by that admin immediately.
 */
export async function createPayment(
  bookingId: number,
  input: { amount: number; method: string; transactionRef?: string; note?: string; proofPath?: string },
  actor: { id: number; role: string },
) {
  const booking = await loadBooking(bookingId);
  if (booking.status === 'Pending') throw conflict('Payments open after the hotel approves your request');
  if (!PAYABLE.includes(booking.status)) throw conflict(`Payments cannot be added to a ${booking.status} booking`);
  const { balance } = serializeBooking(booking);
  if (input.amount > balance + 0.001) throw conflict(`Amount exceeds the remaining balance of ${balance.toFixed(2)}`);
  if (input.method !== 'Cash' && !input.transactionRef) throw conflict('Enter the transaction / reference number of your payment');

  const byAdmin = actor.role === 'ADMIN';
  const payment = await prisma.payment.create({
    data: {
      reference: makeRef('PAY'),
      bookingId,
      amount: input.amount,
      method: input.method,
      transactionRef: input.transactionRef || null,
      note: input.note || null,
      proofPath: input.proofPath ?? null,
      status: byAdmin ? 'Verified' : 'Submitted',
      verifiedById: byAdmin ? actor.id : null,
      verifiedAt: byAdmin ? new Date() : null,
    },
    include: paymentInclude,
  });

  if (byAdmin) {
    await notifyUser(booking.userId, 'PAYMENT_VERIFIED', 'Payment recorded', `${payment.amount.toFixed(2)} (${payment.method}) was recorded for ${booking.reference}.`, { bookingId });
    await maybeComplete(bookingId);
  } else {
    await notifyUser(booking.userId, 'PAYMENT_SUBMITTED', 'Payment sent - waiting for verification', `We received your ${payment.method} payment details for ${booking.reference}. The hotel will verify it shortly and you will be notified.`, { bookingId, paymentId: payment.id });
    await notifyAdmins('PAYMENT_SUBMITTED', 'Payment submitted', `${booking.user.fullName} submitted ${payment.amount.toFixed(2)} via ${payment.method} for ${booking.reference}. Please verify.`, { bookingId, paymentId: payment.id });
  }
  emitChange('payment', payment.id);
  emitChange('booking', bookingId);
  return payment;
}

export async function reviewPayment(paymentId: number, verdict: 'Verified' | 'Rejected', adminId: number) {
  const p = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
  if (!p) throw notFound('Payment not found');
  if (p.status !== 'Submitted') throw conflict(`Payment is already ${p.status}`);
  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: verdict, verifiedById: adminId, verifiedAt: new Date() },
    include: paymentInclude,
  });
  if (verdict === 'Verified') {
    await notifyUser(p.booking.userId, 'PAYMENT_VERIFIED', 'Payment verified', `Your payment ${p.reference} of ${p.amount.toFixed(2)} was verified.`, { bookingId: p.bookingId });
    await maybeComplete(p.bookingId);
  } else {
    await notifyUser(p.booking.userId, 'PAYMENT_REJECTED', 'Payment could not be verified', `Payment ${p.reference} was rejected. Please check the reference number and submit again.`, { bookingId: p.bookingId });
  }
  emitChange('payment', paymentId);
  emitChange('booking', p.bookingId);
  return updated;
}
