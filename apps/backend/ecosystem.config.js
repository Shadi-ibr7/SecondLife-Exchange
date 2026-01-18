/**
 * FICHIER: ecosystem.config.js
 *
 * DESCRIPTION:
 * Configuration PM2 pour le déploiement en production.
 * PM2 charge automatiquement les variables d'environnement depuis .env
 * si le fichier est présent dans le répertoire de travail.
 *
 * UTILISATION:
 * - Développement: pm2 start ecosystem.config.js --env development
 * - Production: pm2 start ecosystem.config.js --env production
 * - Redémarrer: pm2 restart secondlife-backend
 * - Arrêter: pm2 stop secondlife-backend
 * - Logs: pm2 logs secondlife-backend
 * - Status: pm2 status
 */

module.exports = {
  apps: [
    {
      name: 'secondlife-backend',
      script: 'dist/main.js',
      instances: 1, // Nombre d'instances (1 pour commencer, peut être augmenté)
      exec_mode: 'fork', // Mode fork (cluster pour plusieurs instances)
      watch: false, // Ne pas surveiller les fichiers en production
      max_memory_restart: '500M', // Redémarrer si la mémoire dépasse 500MB
      env: {
        NODE_ENV: 'development',
        // Les variables d'environnement sont chargées depuis .env
        // PM2 charge automatiquement .env si présent dans le répertoire de travail
      },
      env_production: {
        NODE_ENV: 'production',
        // Les variables d'environnement sont chargées depuis .env
        // PM2 charge automatiquement .env si présent dans le répertoire de travail
      },
      // Configuration des logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Configuration du redémarrage automatique
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Configuration du monitoring
      pmx: true,
      // Variables d'environnement supplémentaires (optionnel)
      // PM2 charge automatiquement .env depuis le répertoire de travail
      // Si vous avez besoin de spécifier un chemin différent:
      // env_file: '/path/to/.env',
    },
  ],
};
