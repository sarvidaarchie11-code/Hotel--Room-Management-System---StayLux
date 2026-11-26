# StayLux Hotel Room Management System

React Native (Expo SDK 58) + TypeScript mobile app, with an Express + Prisma + SQLite REST API.
Two roles: **ADMIN** (seeded, no public registration) and **USER** (guest, self-registers).

```
hotel-room-management/
  backend/   Express, Prisma, SQLite, JWT, Multer, Socket.IO
  mobile/    Expo Router app (admin + guest)
```

## Welcome and login
Every app launch starts on an animated **Welcome** screen (`mobile/app/(auth)/welcome.tsx`: logo pop, name and tagline fade up, actions slide in),
then **Login**. The welcome screen shows once per launch (`mobile/constants/session.ts`). Backgrounds use periwinkle / blush / aqua glows,
a faint hotel-arch watermark and a soft bottom fade (`Backdrop` in `mobile/components/ui.tsx`).

## Navigation bar
The bar is the standard Expo Router tab bar styled as a floating glass capsule (`mobile/components/glassTabs.tsx`); the selected tab is an
indigo pill. Using the standard bar keeps it working across Expo Router versions. Edit the look in that one file.

## Activity (guest) and animations
Guests have an **Activity** tab: *Updates* (live notifications) and *History* (their own private log of bookings, stays, payments and
account changes). `GET /api/activity` always returns only the caller's entries (the user id comes from the JWT). Run
`npx prisma migrate dev --name activity` in `backend` once if you have not yet. Flip cards: guest room cards (tap the info button) and
admin dashboard stat cards (tap a card). Name fields accept letters only and number fields accept digits only, with a short message.

## Look and feel (glass)
Midnight Indigo / Rose Gold / Pearl palette with frosted-glass surfaces, a glass navigation bar (selected tab is a glossy indigo capsule),
one type scale and one spacing scale. Everything is driven by `mobile/constants/theme.ts` (`colors`, `glass`, `type`, `space`) and
`mobile/components/ui.tsx`, so a colour or size change is made in one place.

## Payments: deposit and payment labels
After the admin approves a booking, the guest owes a deposit (Hotel Settings: default 50%) within N hours (default 24). Each booking shows
a label - Unpaid, Partly paid, Deposit paid, Fully paid - with Total / Paid / Balance. Unpaid deposits are auto-cancelled by a timer job
(checked every 10 minutes; a payment still waiting for admin verification protects the booking). Set the deposit to 0% to turn it off.
Admin > Bookings has a payment filter. After updating, run `npx prisma migrate dev --name deposits` inside `backend` once.

## Login behaviour
The login screen is shown every time the app is opened or scanned (`REQUIRE_LOGIN_ON_START = true` in `mobile/constants/config.ts`).
Set it to `false` to keep users signed in between launches (persistent session via secure storage).

## Upgrade notes (v3: UI polish)
New Deep Teal / Copper / Linen palette, floating 3D navigation bar (raised copper bubble on the active tab), softer shadowed cards,
cleaner chips, inputs and buttons, icon stat cards on the dashboard, and working **Print** (system print dialog) plus **Share PDF** on
booking receipts and reports. To change the colours later, edit only `mobile/constants/theme.ts`.
If printing fails, run `npx expo install expo-print expo-sharing`.

## Upgrade notes (v2)
Added: forgot-password (admin issues a temporary password), receipt-photo upload on payments, profile pictures, special offers that
apply to the booking price automatically, occupancy calendar (Admin > More), pagination + sorting on long lists, guest reviews and
ratings, favourites / saved rooms, PDF booking receipts, report export (PDF, and CSV via the share sheet), hotel map, room-number
auto-suggest, instant tab switching (preloaded tabs, cached images and screens) and a new Onyx / Brass / Alabaster / Emerald palette.

To upgrade an existing install: unzip `staylux-upgrade-patch.zip` over your project, then
```powershell
cd backend
npx prisma migrate dev --name upgrades   # adds the new tables/columns, keeps your data
npm run dev
cd ../mobile
npx expo install expo-image expo-print expo-sharing react-native-maps
npm run start:clear
```
Forgot password has no email service: the guest taps "Forgot password?", admins get a notification, then use **More > Users > Reset Password**
to issue a one-time temporary password. Offers: the best active offer whose dates cover the check-in date is applied automatically.

## Read this first (honest status)

This code was written without network access, so **`npm install` was never run and nothing was executed or tested**.
Source files were only syntax-checked. Expect to fix a few small errors on first run (typos, a version mismatch).
Work through the test checklist at the bottom and fix anything that fails.

Other things to know:
- **Expo Go + SDK 58:** SDK 58 was released 15 Oct 2026. The App Store / Play Store Expo Go is moving to SDK 58 only
  "within a few weeks" of release. If your store Expo Go is still SDK 57, update it first (or use a development build).
  Since SDK 57, Expo Go also requires you to be logged in to the **same Expo account** in the terminal (`npx expo login`)
  and in the Expo Go app.
- **Notifications:** every notification is stored in SQLite (history screen) and pushed live over Socket.IO. While the app is
  open, a local device notification is shown via Expo Notifications. True remote push (app closed) is **not** configured; it needs an EAS
  project and does not work in Expo Go on Android.
- **Prisma migrations:** the `prisma/migrations` folder is created on your machine by `npm run db:setup`
  (it could not be generated offline). Prisma is pinned to v6.
- **bcryptjs** is used instead of native `bcrypt` (same algorithm, no Windows build tools needed).
- **Payments:** there is no payment gateway. Guests submit a payment record (GCash/Bank ref no.); an admin verifies it manually.
  Nothing is ever auto-marked as paid.
- **Admin tabs:** bottom tabs are Dashboard, Rooms, Reservations, Payments, More. Users, Reports, Profile and Settings
  live under **More** (eight bottom tabs do not fit on a phone).
- Special offers are informational (shown on the guest home screen); they do not auto-discount a booking.
- No fake data is seeded: only the admin, 7 room categories, 12 amenities and hotel settings. **You add rooms and photos.**

## Quick start (Windows, two terminals)
Install **Node.js 22 LTS** first (https://nodejs.org). Then open two terminals in VS Code:

**Terminal 1 - backend** (first time only: `npm install`, `copy .env.example .env`, edit `JWT_SECRET`, `npm run db:setup`)
```powershell
cd backend
npm run dev
```
**Terminal 2 - mobile** (first time only: `npm run setup`)
```powershell
cd mobile
npm run start:clear
```
Scan the QR code with **Expo Go** (SDK 58). PC and phone must be on the same Wi-Fi.
Admin login: `admin@hotel.local` / `ChangeMe#2026` (you must change it on first login).
The app finds the API automatically at `<the PC address Expo shows>:4000`, so no IP needs to be typed; `mobile/.env`
(`EXPO_PUBLIC_API_URL`) is only a fallback. Allow port 4000 in Windows Firewall once (see Troubleshooting).

## 1. Requirements (Windows)
- Node.js 20+ (22 LTS recommended), VS Code, phone with Expo Go on the **same Wi-Fi** as your PC.

## 2. Backend
```powershell
cd backend
npm install
copy .env.example .env
```
Edit `.env`: set a long random `JWT_SECRET`, and `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Then:
```powershell
npm run db:setup     # prisma generate + migrate (creates dev.db) + seed (admin, categories, amenities)
npm run dev          # API on http://0.0.0.0:4000
```
The server prints your LAN addresses on start, e.g. `http://192.168.1.23:4000`.
Allow Node.js through Windows Firewall (private networks) when prompted.

## 3. Mobile
```powershell
cd mobile
npm run setup        # npm install + `expo install` (picks the exact SDK 58 versions)
copy .env.example .env
```
## 4. Point the phone at your PC (not localhost)
Find your PC's IPv4 address (`ipconfig` -> Wi-Fi adapter, or use the address the backend printed).
Put it in `mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.23:4000
```
Phone browser test: open `http://192.168.1.23:4000/api/health` -> `{"status":"ok"}`. If it fails, it is the firewall or a different network.

## 5. Run in Expo Go
```powershell
npx expo login
npm run start:clear
```
Scan the QR code (Android: Expo Go app; iPhone: Camera app). After changing `.env`, restart with `npm run start:clear`.

## 6. First use
1. Log in with the admin from `.env` -> you must set a new password.
2. **More > Room types & amenities** (optional edits) -> **Rooms > Add Room**, fill the form, choose photos from the gallery,
   star one as primary, **Create Room**. Photos are stored in `backend/uploads/rooms/` and their paths in SQLite.
3. **More > Hotel settings**: add GCash / bank details shown to guests.
4. On another phone/account: Register as a guest, browse, reserve. Admin gets a live notification; approve/reject.

## Event-driven programming map
| Concept | Where |
|---|---|
| onPress | buttons everywhere (`components/ui.tsx`, all screens) |
| onChangeText | every `Input`; search, filters, forms |
| onSubmitEditing | login/register field chaining, Home + Explore search (`home.tsx`, `explore.tsx`) |
| onFocus / onBlur | `Input` focus ring (`components/ui.tsx`) |
| onScroll | Explore "back to top" button (`explore.tsx`), image carousel (`ImageCarousel.tsx`) |
| onRefresh | pull-to-refresh via `useLoad` on all lists |
| useState / useEffect / useCallback | all screens; `hooks/useLoad.ts` |
| useMemo | `AuthContext`, `NotificationContext`, `explore.tsx` |
| useContext | `useAuth()`, `useNotifications()` |
| useReducer | `contexts/NotificationContext.tsx` |
| Context API | `AuthContext`, `NotificationContext` |
| Real-time events | Socket.IO: `notification` and `data:changed` (`backend/src/socket.ts`, `mobile/services/socket.ts`, `hooks/useLiveRefresh.ts`) |

App events (13): login, registration, room selection, image upload, room creation, room update, booking submission,
booking approval, booking cancellation, payment verification, notification, profile update, logout. Search the code for the
upper-case comments (e.g. `// LOGIN event`, `// ROOM CREATION / ROOM UPDATE event`).

## API overview (all under /api)
Public: `POST /auth/register` (always role USER), `POST /auth/login`, `GET /health`.
Authenticated: `/auth/me`, `/rooms`, `/rooms/:id`, `/rooms/:id/availability`, `/categories`, `/amenities`, `/offers`, `/settings`, `/notifications`.
Guest only: `/bookings` (create/list), `/bookings/:id/cancel`, `/bookings/:id/payments`, `/payments`.
Admin only (`/api/admin/*`, role-checked): dashboard, reports, rooms CRUD + images, categories, amenities, bookings
(approve/reject/check-in/check-out/complete), payments (verify/reject), users, offers, settings.

Booking rules: a room cannot have overlapping **Confirmed / Checked-in** bookings (checked at request time and again at
approval, inside a DB transaction). Check-out day is free for the next guest. Guests can cancel Pending bookings anytime and
Confirmed bookings up to 24 h before check-in. Room status follows operations: approve -> Reserved, check-in -> Occupied,
check-out/cancel -> Available (Maintenance/Unavailable are never overridden). Check-in is only allowed on/after the check-in date.

## Test checklist (please run these)
1 Admin login + forced password change - 2 Guest registration (try duplicate email, weak password) - 3 Guest login - 4 Wrong password
- 5 Kill and reopen app (session persists) - 6 Create room - 7 Upload several photos, set primary, replace, remove - 8 Edit room
- 9 Delete room (blocked if it has bookings) - 10 Guest browse/search/filter - 11 Availability on room page/booking screen
- 12 Submit reservation - 13 Admin approves (guest gets notification) - 14 Admin rejects with reason - 15 Guest submits GCash payment, admin verifies
- 16 Notifications arrive live - 17 Booking history - 18 Edit profile - 19 Logout - 20 Guest cannot call `/api/admin/*`
(e.g. with the guest's token: `GET /api/admin/users` must return 403).

## Troubleshooting
- "Cannot reach the server": wrong IP in `mobile/.env`, firewall, phone on mobile data, or you did not restart Expo with `-c`.
- `npx expo-doctor` reports version mismatches: run `npx expo install --fix`.
- Images not showing: open `http://<ip>:4000/uploads/rooms/<file>` in the phone browser.
- Reset the database: `npm run db:reset` then `npm run db:seed` (inside `backend`).
