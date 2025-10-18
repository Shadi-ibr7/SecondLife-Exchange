import { PrismaClient, UserRole, ExchangeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Créer 2 utilisateurs de test
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      displayName: 'Alice Martin',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      roles: UserRole.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      displayName: 'Bob Dupont',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      roles: UserRole.USER,
    },
  });

  // Créer les profils utilisateur
  await prisma.userProfile.create({
    data: {
      userId: user1.id,
      bio: "Passionnée de lecture et d'échanges culturels",
      location: 'Paris, France',
      preferencesJson: {
        notifications: true,
        theme: 'light',
        language: 'fr',
      },
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: user2.id,
      bio: 'Collectionneur de livres anciens et passionné de technologie',
      location: 'Lyon, France',
      preferencesJson: {
        notifications: false,
        theme: 'dark',
        language: 'fr',
      },
    },
  });

  // Créer des échanges d'exemple
  await prisma.exchange.create({
    data: {
      requesterId: user1.id,
      responderId: user2.id,
      requestedItemTitle: 'iPhone 13 Pro',
      offeredItemTitle: 'MacBook Air M1',
      status: ExchangeStatus.PENDING,
    },
  });

  await prisma.exchange.create({
    data: {
      requesterId: user2.id,
      responderId: user1.id,
      requestedItemTitle: 'Collection de livres de science-fiction',
      offeredItemTitle: 'Tablette iPad Pro',
      status: ExchangeStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(
    `👤 Created users: ${user1.displayName} (${user1.email}), ${user2.displayName} (${user2.email})`,
  );
  console.log('📚 Created sample exchanges');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
