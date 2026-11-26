import { z } from 'zod';

export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Rejected', 'Cancelled', 'CheckedIn', 'CheckedOut', 'Completed'] as const;
export const ROOM_STATUSES = ['Available', 'Reserved', 'Occupied', 'Maintenance', 'Unavailable'] as const;
export const PAYMENT_METHODS = ['Cash', 'GCash', 'BankTransfer'] as const;

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number');

const phone = z.string().trim().regex(/^[+0-9\s-]{7,20}$/, 'Enter a valid phone number');
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format yyyy-MM-dd');

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required').max(80).regex(/^[\p{L}][\p{L}\s.'-]*$/u, 'Letters only - numbers are not allowed in a name'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    phone,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(80).regex(/^[\p{L}][\p{L}\s.'-]*$/u, 'Letters only - numbers are not allowed in a name'),
  phone,
});

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, 'Current password is required'), newPassword: password, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ['newPassword'], message: 'New password must be different' });

export const pushTokenSchema = z.object({ token: z.string().min(10) });

export const roomSchema = z.object({
  roomNumber: z.string().trim().min(1, 'Room number is required').max(10),
  name: z.string().trim().min(2, 'Room name is required').max(80),
  categoryId: z.coerce.number().int().positive('Select a room type'),
  description: z.string().trim().min(10, 'Add a short description (10+ characters)'),
  pricePerNight: z.coerce.number().positive('Price must be greater than 0'),
  maxGuests: z.coerce.number().int().min(1).max(20),
  bedType: z.string().trim().min(2, 'Bed type is required'),
  numberOfBeds: z.coerce.number().int().min(1).max(10),
  size: z.string().trim().min(1, 'Room size is required'),
  floor: z.coerce.number().int().min(0).max(200),
  status: z.enum(ROOM_STATUSES).default('Available'),
  featured: z.boolean().default(false),
  amenityIds: z.array(z.number().int()).default([]),
});

export const roomStatusSchema = z.object({ status: z.enum(ROOM_STATUSES) });

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(60),
  description: z.string().trim().max(300).optional(),
});
export const amenitySchema = z.object({ name: z.string().trim().min(2, 'Name is required').max(40) });

export const bookingSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  checkIn: day,
  checkOut: day,
  guests: z.coerce.number().int().min(1, 'At least 1 guest'),
  specialRequests: z.string().trim().max(500).optional(),
});

export const rejectSchema = z.object({ reason: z.string().trim().min(3, 'Give the guest a reason').max(300) });

export const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.enum(PAYMENT_METHODS),
  transactionRef: z.string().trim().max(60).optional(),
  note: z.string().trim().max(300).optional(),
});

export const offerSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(80),
  description: z.string().trim().min(5, 'Description is required').max(300),
  discountPercent: z.coerce.number().int().min(0).max(100),
  validFrom: day,
  validUntil: day,
  active: z.boolean().default(true),
});

const optCoord = (max: number) =>
  z.preprocess((v) => (v === '' || v === null || v === undefined ? null : Number(v)), z.number().min(-max).max(max).nullable());

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Choose a rating').max(5),
  comment: z.string().trim().max(500).optional(),
});
export const forgotPasswordSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address') });

export const settingsSchema = z.object({
  latitude: optCoord(90).default(null),
  longitude: optCoord(180).default(null),
  name: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(100).default(''),
  address: z.string().trim().max(200).default(''),
  phone: z.string().trim().max(30).default(''),
  email: z.string().trim().max(80).default(''),
  checkInTime: z.string().trim().max(10).default('14:00'),
  checkOutTime: z.string().trim().max(10).default('12:00'),
  gcashNumber: z.string().trim().max(30).default(''),
  gcashName: z.string().trim().max(60).default(''),
  bankDetails: z.string().trim().max(300).default(''),
  depositPercent: z.coerce.number().int().min(0, 'Use 0 to 100').max(100, 'Use 0 to 100').default(50),
  depositHours: z.coerce.number().int().min(1, 'At least 1 hour').max(168, 'Up to 168 hours (7 days)').default(24),
});
