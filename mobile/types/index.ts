export type Role = 'ADMIN' | 'USER';
export type RoomStatus = 'Available' | 'Reserved' | 'Occupied' | 'Maintenance' | 'Unavailable';
export type BookingStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'CheckedIn' | 'CheckedOut' | 'Completed';
export type PaymentLabel = 'Awaiting approval' | 'Unpaid' | 'Partly paid' | 'Deposit paid' | 'Fully paid';
export type PaymentMethod = 'Cash' | 'GCash' | 'BankTransfer';

export interface User {
  id: number; fullName: string; email: string; phone: string; role: Role; mustChangePassword: boolean; createdAt: string; avatarPath?: string | null;
}
export interface Category { id: number; name: string; description?: string | null; _count?: { rooms: number } }
export interface Amenity { id: number; name: string }
export interface RoomImage { id: number; roomId: number; path: string; isPrimary: boolean; sortOrder: number }
export interface Room {
  id: number; roomNumber: string; name: string; categoryId: number; category: Category; description: string;
  pricePerNight: number; maxGuests: number; bedType: string; numberOfBeds: number; size: string; floor: number;
  status: RoomStatus; featured: boolean; images: RoomImage[]; primaryImage: string | null; amenities: Amenity[];
  avgRating?: number | null; reviewCount?: number;
}
export interface Payment {
  id: number; reference: string; bookingId: number; amount: number; method: PaymentMethod;
  status: 'Submitted' | 'Verified' | 'Rejected'; transactionRef?: string | null; note?: string | null; proofPath?: string | null;
  paidAt: string; verifiedAt?: string | null;
  booking?: { id: number; reference: string; totalAmount: number; status: BookingStatus; user: { id: number; fullName: string; email: string }; room: { name: string; roomNumber: string } };
  verifiedBy?: { id: number; fullName: string } | null;
}
export interface Booking {
  id: number; reference: string; userId: number; roomId: number; checkIn: string; checkOut: string; guests: number;
  nights: number; pricePerNight: number; totalAmount: number; discountPercent: number; discountAmount: number; offerTitle?: string | null; depositAmount: number; depositDueAt?: string | null; status: BookingStatus; specialRequests?: string | null;
  rejectionReason?: string | null; checkedInAt?: string | null; checkedOutAt?: string | null; createdAt: string; room: Room; user: { id: number; fullName: string; email: string; phone: string };
  payments: Payment[]; paidAmount: number; balance: number; depositRemaining: number; paymentStatus: PaymentLabel;
}
export interface AppNotification {
  id: number; type: string; title: string; body: string; data?: string | null; read: boolean; createdAt: string;
}
export interface Offer { id: number; title: string; description: string; discountPercent: number; validFrom: string; validUntil: string; active: boolean }
export interface HotelSettings {
  name: string; tagline: string; address: string; phone: string; email: string; checkInTime: string; checkOutTime: string;
  gcashNumber: string; gcashName: string; bankDetails: string; latitude?: number | null; longitude?: number | null; depositPercent?: number; depositHours?: number;
}
export interface Point { label: string; value: number }
export interface Dashboard {
  totals: { totalRooms: number; availableRooms: number; occupiedRooms: number; reservedRooms: number; pendingReservations: number; pendingPayments?: number; totalUsers: number; totalRevenue: number };
  recentBookings: Booking[];
  charts: { monthlyRevenue: Point[]; reservationTrends: Point[]; bookingStats: Point[]; roomOccupancy: Point[] };
}
export interface Report {
  totalCollected: number; paymentCount: number; totalBookings: number; nightsBooked: number; bookedValue: number;
  byMethod: Point[]; byStatus: Point[]; topRooms: { name: string; roomNumber: string; nights: number; booked: number }[];
}
export interface Review { id: number; rating: number; comment?: string | null; createdAt: string; user: { fullName: string; avatarPath?: string | null } }
export interface CalendarData {
  month: string;
  rooms: { id: number; roomNumber: string; name: string; status: string }[];
  bookings: { id: number; roomId: number; status: string; reference: string; guest: string; checkIn: string; checkOut: string }[];
}
export interface ActivityItem { id: number; kind: 'booking' | 'stay' | 'payment' | 'account' | 'review'; title: string; detail?: string | null; refId?: number | null; createdAt: string }
