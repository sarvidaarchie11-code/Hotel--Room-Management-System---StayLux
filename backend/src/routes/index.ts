import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { imageUpload } from '../middleware/upload';
import * as v from '../validators';
import * as auth from '../controllers/auth.controller';
import * as rooms from '../controllers/rooms.controller';
import * as bookings from '../controllers/bookings.controller';
import * as payments from '../controllers/payments.controller';
import * as admin from '../controllers/admin.controller';
import * as notifs from '../controllers/notifications.controller';
import * as social from '../controllers/social.controller';
import * as activity from '../controllers/activity.controller';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Try again later.' } });

// ---------- Public ----------
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.post('/auth/register', authLimiter, validate(v.registerSchema), auth.register); // always creates role USER
router.post('/auth/login', authLimiter, validate(v.loginSchema), auth.login);
router.post('/auth/forgot-password', authLimiter, validate(v.forgotPasswordSchema), auth.forgotPassword);

// ---------- Any authenticated user ----------
router.use(requireAuth);
router.get('/auth/me', auth.me);
router.put('/auth/profile', validate(v.profileSchema), auth.updateProfile);
router.post('/auth/change-password', validate(v.changePasswordSchema), auth.changePassword);
router.post('/auth/push-token', validate(v.pushTokenSchema), auth.savePushToken);
router.post('/auth/avatar', imageUpload.single('avatar'), auth.uploadAvatar);

router.get('/rooms', rooms.listRooms);
router.get('/rooms/:id', rooms.getRoom);
router.get('/rooms/:id/availability', rooms.checkAvailability);
router.get('/rooms/:id/reviews', social.listReviews);
router.get('/categories', rooms.listCategories);
router.get('/amenities', rooms.listAmenities);
router.get('/offers', admin.listOffers);
router.get('/settings', admin.getSettings);

router.get('/activity', activity.myActivity); // private: always the caller's own history
router.get('/notifications', notifs.list);
router.post('/notifications/read-all', notifs.markAllRead);
router.patch('/notifications/:id/read', notifs.markRead);

router.get('/bookings/:id', bookings.getOne); // owner or admin (checked in controller)

// ---------- Guests only (role checked per route so it can never shadow /admin) ----------
const onlyUser = requireRole('USER');
router.post('/bookings', onlyUser, validate(v.bookingSchema), bookings.create);
router.get('/bookings', onlyUser, bookings.mine);
router.post('/bookings/:id/cancel', onlyUser, bookings.cancel);
router.get('/payments', onlyUser, payments.mine);
router.post('/bookings/:id/payments', onlyUser, imageUpload.single('proof'), validate(v.paymentSchema), payments.submit);
router.get('/bookings/:id/review', onlyUser, social.myReview);
router.post('/bookings/:id/review', onlyUser, validate(v.reviewSchema), social.createReview);
router.get('/favorites', onlyUser, social.listFavorites);
router.post('/favorites/:roomId', onlyUser, social.toggleFavorite);

// ---------- Admin only ----------
const adm = Router();
adm.use(requireRole('ADMIN'));
adm.get('/dashboard', admin.dashboard);
adm.get('/reports', admin.report);

adm.get('/rooms/next-number', rooms.nextRoomNumber);
adm.get('/calendar', admin.calendar);
adm.post('/rooms', validate(v.roomSchema), rooms.createRoom);
adm.put('/rooms/:id', validate(v.roomSchema), rooms.updateRoom);
adm.patch('/rooms/:id/status', validate(v.roomStatusSchema), rooms.setRoomStatus);
adm.delete('/rooms/:id', rooms.deleteRoom);
adm.post('/rooms/:id/images', imageUpload.array('images', 10), rooms.uploadImages);
adm.put('/rooms/:id/images/:imageId', imageUpload.single('image'), rooms.replaceImage);
adm.patch('/rooms/:id/images/:imageId/primary', rooms.setPrimaryImage);
adm.delete('/rooms/:id/images/:imageId', rooms.deleteImage);

adm.post('/categories', validate(v.categorySchema), rooms.createCategory);
adm.put('/categories/:id', validate(v.categorySchema), rooms.updateCategory);
adm.delete('/categories/:id', rooms.deleteCategory);
adm.post('/amenities', validate(v.amenitySchema), rooms.createAmenity);
adm.delete('/amenities/:id', rooms.deleteAmenity);

adm.get('/bookings', bookings.adminList);
adm.post('/bookings/:id/approve', bookings.approve);
adm.post('/bookings/:id/reject', validate(v.rejectSchema), bookings.reject);
adm.post('/bookings/:id/check-in', bookings.checkIn);
adm.post('/bookings/:id/check-out', bookings.checkOut);
adm.post('/bookings/:id/complete', bookings.complete);
adm.post('/bookings/:id/cancel-by-admin', bookings.cancel);

adm.get('/payments', payments.adminList);
adm.post('/bookings/:id/payments', imageUpload.single('proof'), validate(v.paymentSchema), payments.submit); // admin-recorded (e.g. cash)
adm.post('/payments/:id/verify', payments.verify);
adm.post('/payments/:id/reject', payments.rejectPayment);

adm.get('/users', admin.listUsers);
adm.patch('/users/:id/active', admin.setUserActive);
adm.post('/users/:id/reset-password', admin.resetUserPassword);

adm.get('/offers', admin.listOffers);
adm.post('/offers', validate(v.offerSchema), admin.createOffer);
adm.put('/offers/:id', validate(v.offerSchema), admin.updateOffer);
adm.delete('/offers/:id', admin.deleteOffer);
adm.put('/settings', validate(v.settingsSchema), admin.updateSettings);
router.use('/admin', adm);

export default router;
