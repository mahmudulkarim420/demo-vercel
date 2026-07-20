import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

const SEED_PASSWORD = 'password123';

// Delete all application data in reverse dependency order to avoid FK errors.
async function cleanDatabase() {
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('Cleaning existing application data...');
  await cleanDatabase();

  console.log('Inserting fresh seed data...');
  const password = await bcrypt.hash(SEED_PASSWORD, 10);

  const adminData = {
    name: 'Admin',
    password,
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
  };
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: adminData,
    create: { email: 'admin@gmail.com', ...adminData },
  });

  const customerData = {
    name: 'Customer',
    password,
    role: 'CUSTOMER' as const,
    status: 'ACTIVE' as const,
  };
  await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: customerData,
    create: { email: 'customer@gmail.com', ...customerData },
  });

  const technicianData = {
    name: 'Technician',
    password,
    role: 'TECHNICIAN' as const,
    status: 'ACTIVE' as const,
  };
  const technician = await prisma.user.upsert({
    where: { email: 'technician@gmail.com' },
    update: technicianData,
    create: { email: 'technician@gmail.com', ...technicianData },
  });

  const profileData = {
    bio: 'Certified technician for general home repairs.',
    skills: ['Plumbing', 'Electrical', 'Cleaning'],
    experience: 5,
    hourlyRate: 40.0,
    location: 'Dhaka, Bangladesh',
    totalReviews: 0,
    averageRating: 0,
    availability: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    isVerified: true,
  };
  const technicianProfile = await prisma.technicianProfile.upsert({
    where: { userId: technician.id },
    update: profileData,
    create: { userId: technician.id, ...profileData },
  });

  const categoryData = {
    description: 'General home repair and maintenance services.',
  };
  const category = await prisma.category.upsert({
    where: { name: 'Home Repair' },
    update: categoryData,
    create: { name: 'Home Repair', ...categoryData },
  });

  // Service has no natural unique key; safe to create because the table was wiped above.
  await prisma.service.create({
    data: {
      title: 'General Home Repair Service',
      description:
        'A general-purpose home repair service covering plumbing, electrical, and cleaning tasks.',
      price: 120.0,
      categoryId: category.id,
      technicianProfileId: technicianProfile.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Login password for all users: ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
