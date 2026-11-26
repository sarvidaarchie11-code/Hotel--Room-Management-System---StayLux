import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { Booking, HotelSettings, Report } from '@/types';
import { day, label, money, stamp } from './format';

const esc = (v: string | number | null | undefined) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const STYLE = `<style>
 body{font-family:Helvetica,Arial,sans-serif;color:#1B2747;padding:36px;}
 h1{font-family:Georgia,serif;letter-spacing:6px;margin:0;font-size:26px} .sub{color:#B8775C;margin:2px 0 22px}
 .bar{height:3px;background:#B8775C;margin:12px 0 22px}
 table{width:100%;border-collapse:collapse} td,th{padding:8px 4px;border-bottom:1px solid #E3E5EE;text-align:left;font-size:14px}
 td.r,th.r{text-align:right} .tot td{font-weight:700;font-size:16px;border-bottom:none}
 .muted{color:#667089;font-size:12px;margin-top:26px}
</style>`;

export async function printHtml(html: string) {
  await Print.printAsync({ html }); // opens the system print dialog (any printer, or "Save as PDF")
}

async function sharePdf(html: string, title: string) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
  else await Print.printAsync({ uri });
}

export function bookingReceiptHtml(b: Booking, s: HotelSettings | null): string {
  const rows = (pairs: [string, string][]) => pairs.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="r">${esc(v)}</td></tr>`).join('');
  const subtotal = b.totalAmount + b.discountAmount;
  const html = `<html><head>${STYLE}</head><body>
  <h1>${esc((s?.name ?? 'StayLux').toUpperCase())}</h1><div class="sub">${esc(s?.tagline ?? '')}</div><div class="bar"></div>
  <h2 style="margin:0 0 4px">Booking receipt</h2><div>${esc(b.reference)} · ${esc(label(b.status))}</div><br/>
  <table>${rows([
    ['Guest', b.user.fullName], ['Room', `${b.room.name} (Room ${b.room.roomNumber})`],
    ['Check-in', `${day(b.checkIn, 'EEE, MMM d, yyyy')}${s ? ` · ${s.checkInTime}` : ''}`],
    ['Check-out', `${day(b.checkOut, 'EEE, MMM d, yyyy')}${s ? ` · ${s.checkOutTime}` : ''}`],
    ['Guests', String(b.guests)], ['Nights', String(b.nights)], ['Rate per night', money(b.pricePerNight)], ['Subtotal', money(subtotal)],
    ...(b.discountAmount > 0 ? ([[`Discount${b.offerTitle ? ` (${b.offerTitle}, ${b.discountPercent}%)` : ''}`, `-${money(b.discountAmount)}`]] as [string, string][]) : []),
  ])}
  <tr class="tot"><td>Total</td><td class="r">${money(b.totalAmount)}</td></tr></table>
  <h3 style="margin-top:24px">Payments</h3>
  <table><tr><th>Date</th><th>Method</th><th>Status</th><th class="r">Amount</th></tr>${b.payments.map((p) => `<tr><td>${esc(stamp(p.paidAt))}</td><td>${esc(label(p.method))}</td><td>${esc(p.status)}</td><td class="r">${money(p.amount)}</td></tr>`).join('') || '<tr><td colspan="4">No payments recorded</td></tr>'}
  <tr class="tot"><td colspan="3">Verified paid</td><td class="r">${money(b.paidAmount)}</td></tr>
  <tr class="tot"><td colspan="3">Balance due</td><td class="r">${money(b.balance)}</td></tr></table>
  <div class="muted">${esc(s?.address ?? '')} ${esc(s?.phone ?? '')}<br/>Generated ${esc(stamp(new Date().toISOString()))}. This is a booking summary, not a tax invoice.</div></body></html>`;
  return html;
}

export const shareBookingReceipt = (b: Booking, s: HotelSettings | null) => sharePdf(bookingReceiptHtml(b, s), `Receipt ${b.reference}`);
export const printBookingReceipt = (b: Booking, s: HotelSettings | null) => printHtml(bookingReceiptHtml(b, s));

export function reportHtml(r: Report, range: string, hotel: string): string {
  const list = (items: { label: string; value: number }[], money_ = false) => items.map((i) => `<tr><td>${esc(label(i.label))}</td><td class="r">${money_ ? money(i.value) : i.value}</td></tr>`).join('') || '<tr><td colspan="2">None</td></tr>';
  const html = `<html><head>${STYLE}</head><body><h1>${esc(hotel.toUpperCase())}</h1><div class="sub">Report · ${esc(range)}</div><div class="bar"></div>
  <table>${`<tr><td>Collected (verified payments)</td><td class="r">${money(r.totalCollected)}</td></tr><tr><td>Booking requests</td><td class="r">${r.totalBookings}</td></tr><tr><td>Nights booked</td><td class="r">${r.nightsBooked}</td></tr><tr><td>Value of accepted bookings</td><td class="r">${money(r.bookedValue)}</td></tr>`}</table>
  <h3>Bookings by status</h3><table>${list(r.byStatus)}</table>
  <h3>Collected by method</h3><table>${list(r.byMethod, true)}</table>
  <h3>Top rooms</h3><table>${r.topRooms.map((t) => `<tr><td>Room ${esc(t.roomNumber)} · ${esc(t.name)} (${t.nights} nights)</td><td class="r">${money(t.booked)}</td></tr>`).join('') || '<tr><td colspan="2">None</td></tr>'}</table></body></html>`;
  return html;
}

export const shareReportPdf = (r: Report, range: string, hotel: string) => sharePdf(reportHtml(r, range, hotel), 'Hotel report');
export const printReport = (r: Report, range: string, hotel: string) => printHtml(reportHtml(r, range, hotel));

/** CSV is handed to the system share sheet as text (save to Notes/Drive, email it, paste into Excel). */
export async function shareReportCsv(r: Report, range: string) {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ['Section', 'Item', 'Value'],
    ['Summary', 'Period', range], ['Summary', 'Collected', r.totalCollected], ['Summary', 'Booking requests', r.totalBookings],
    ['Summary', 'Nights booked', r.nightsBooked], ['Summary', 'Accepted booking value', r.bookedValue],
    ...r.byStatus.map((i) => ['Status', label(i.label), i.value]), ...r.byMethod.map((i) => ['Method', label(i.label), i.value]),
    ...r.topRooms.map((t) => ['Top room', `Room ${t.roomNumber} ${t.name}`, t.booked]),
  ];
  await Share.share({ title: 'Hotel report (CSV)', message: lines.map((l) => l.map(q).join(',')).join('\n') });
}
