/**
 * Seeds REFERENCE data only: the initial administrator, room categories, amenities
 * and hotel settings. No fake rooms, bookings or users are created.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  'Standard Room', 'Deluxe Room', 'Superior Room', 'Executive Room',
  'Family Room', 'Suite Room', 'Presidential Suite',
];
const AMENITIES = [
  'Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Mini Bar', 'Breakfast Included',
  'Private Bathroom', 'Hot Shower', 'Balcony', 'Sea View', 'In-room Safe', 'Coffee Maker', 'Free Parking',
];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@hotel.local').toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const generated = !process.env.ADMIN_PASSWORD;
    const password = process.env.ADMIN_PASSWORD ?? randomBytes(9).toString('base64url') + 'A1!';
    await prisma.user.create({
      data: {
        fullName: process.env.ADMIN_FULL_NAME ?? 'Hotel Administrator',
        email,
        phone: '0000000000',
        passwordHash: await bcrypt.hash(password, 12),
        role: 'ADMIN',
        mustChangePassword: true,
      },
    });
    console.log(`\nAdmin created: ${email}`);
    if (generated) console.log(`Generated one-time password: ${password}`);
    console.log('The admin must change this password on first login.\n');
  } else {
    console.log(`Admin ${email} already exists - left unchanged.`);
  }

  for (const name of CATEGORIES) await prisma.roomCategory.upsert({ where: { name }, update: {}, create: { name } });
  for (const name of AMENITIES) await prisma.amenity.upsert({ where: { name }, update: {}, create: { name } });
  await prisma.hotelSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  console.log('Reference data ready.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
