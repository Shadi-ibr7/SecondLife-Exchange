/**
 * FICHIER: create-admin.ts
 *
 * DESCRIPTION:
 * Script pour créer ou mettre à jour le compte admin.
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@secondlife.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  console.log('🔐 Création/Mise à jour du compte admin...');
  console.log(`📧 Email: ${adminEmail}`);

  // Vérifier si l'admin existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('👤 Admin existant trouvé, mise à jour du mot de passe...');
    
    // Mettre à jour le mot de passe et le rôle
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash,
        roles: UserRole.ADMIN,
        displayName: existingAdmin.displayName || 'Administrateur',
      },
    });

    console.log('✅ Mot de passe admin mis à jour avec succès !');
    console.log(`👑 Email: ${adminEmail}`);
    console.log(`🔑 Mot de passe: ${adminPassword}`);
  } else {
    console.log('➕ Création d\'un nouvel admin...');
    
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        displayName: 'Administrateur',
        roles: UserRole.ADMIN,
      },
    });

    console.log('✅ Compte admin créé avec succès !');
    console.log(`👑 Email: ${admin.email}`);
    console.log(`🔑 Mot de passe: ${adminPassword}`);
    console.log(`🆔 ID: ${admin.id}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

