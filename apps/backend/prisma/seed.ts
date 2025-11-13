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

  // Créer des articles éco-éducatifs (blog)
  const now = new Date();
  await prisma.ecoContent.createMany({
    data: [
      {
        kind: 'ARTICLE',
        title:
          'Réduire ses déchets au quotidien: 10 gestes simples et efficaces',
        url: 'https://secondlife.exchange/blog/reduire-dechets-quotidien',
        locale: 'fr',
        tags: ['zéro déchet', 'maison', 'écologie'],
        source: 'SecondLife Exchange',
        publishedAt: now,
        summary:
          "Adopter une routine zéro déchet n'est pas compliqué. Voici 10 gestes concrets applicables dès aujourd'hui pour réduire vos déchets à la maison.",
      } as any,
      {
        kind: 'ARTICLE',
        title:
          'Réparer au lieu de jeter: le guide pratique pour débuter facilement',
        url: 'https://secondlife.exchange/blog/reparer-au-lieu-de-jeter',
        locale: 'fr',
        tags: ['réparation', 'bricolage', 'durabilité'],
        source: 'SecondLife Exchange',
        publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
        summary:
          'Réparer ses objets prolonge leur durée de vie et économise des ressources. Découvrez les bases, les outils essentiels et où trouver de l’aide.',
      } as any,
      {
        kind: 'ARTICLE',
        title:
          'Donner une seconde vie à ses objets: astuces pour échanger intelligemment',
        url: 'https://secondlife.exchange/blog/seconde-vie-astuces-echanges',
        locale: 'fr',
        tags: ['échange', 'seconde main', 'astuces'],
        source: 'SecondLife Exchange',
        publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
        summary:
          "Bien décrire son objet, prendre de bonnes photos et fixer les bonnes attentes: les clés d'un échange réussi et satisfaisant.",
      } as any,
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed completed successfully!');
  console.log(
    `👤 Created users: ${user1.displayName} (${user1.email}), ${user2.displayName} (${user2.email})`,
  );
  console.log('📚 Created sample exchanges');
  console.log('📰 Created eco-educational blog articles');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
