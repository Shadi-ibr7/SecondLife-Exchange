/**
 * Script pour appliquer la migration actorRole manuellement
 * Usage: node scripts/apply-actor-role-migration.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔧 Application de la migration actorRole pour AdminLog');
  console.log('======================================================\n');

  try {
    // Vérifier si la colonne existe déjà
    const columnExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'admin_logs' AND column_name = 'actorRole';
    `;

    if (Number(columnExists[0].count) > 0) {
      console.log('✅ La colonne actorRole existe déjà');

      // Vérifier si elle est NOT NULL
      const isNullable = await prisma.$queryRaw`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = 'admin_logs' AND column_name = 'actorRole';
      `;

      if (isNullable[0].is_nullable === 'NO') {
        console.log('✅ La colonne est déjà NOT NULL');
        console.log('✅ Migration déjà appliquée !\n');
        return;
      }
    }

    console.log('📝 Application de la migration...\n');

    // Ajouter la colonne si elle n'existe pas (syntaxe DO pour PostgreSQL)
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'admin_logs' AND column_name = 'actorRole'
        ) THEN
          ALTER TABLE admin_logs ADD COLUMN "actorRole" "UserRole";
        END IF;
      END $$;
    `;
    console.log('✅ Colonne actorRole ajoutée (si elle n\'existait pas)');

    // Mettre à jour les logs existants avec ADMIN
    const updateResult = await prisma.$executeRaw`
      UPDATE admin_logs
      SET "actorRole" = 'ADMIN'
      WHERE "actorRole" IS NULL;
    `;
    console.log(`✅ Logs existants mis à jour avec ADMIN`);

    // Rendre la colonne NOT NULL avec valeur par défaut
    await prisma.$executeRaw`
      ALTER TABLE admin_logs
      ALTER COLUMN "actorRole" SET NOT NULL;
    `;
    await prisma.$executeRaw`
      ALTER TABLE admin_logs
      ALTER COLUMN "actorRole" SET DEFAULT 'ADMIN';
    `;
    console.log('✅ Colonne configurée comme NOT NULL avec valeur par défaut');

    // Créer l'index si n'existe pas
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS admin_logs_actorRole_idx
      ON admin_logs("actorRole");
    `;
    console.log('✅ Index créé (si il n\'existait pas)');

    // Vérification
    console.log('\n📊 Vérification...');
    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_logs,
        COUNT(DISTINCT "actorRole") as distinct_roles,
        COUNT(*) FILTER (WHERE "actorRole" = 'ADMIN') as admin_actions
      FROM admin_logs;
    `;

    console.log(`
📈 Statistiques:
  - Total logs: ${stats[0].total_logs}
  - Rôles distincts: ${stats[0].distinct_roles}
  - Actions ADMIN: ${stats[0].admin_actions}
    `);

    console.log('✅ Migration terminée avec succès !\n');
  } catch (error) {
    console.error('\n❌ ERREUR lors de l\'application de la migration:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
