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
      instances: 2, // Nombre d'instances (2 pour production, peut être augmenté)
      exec_mode: 'cluster', // Mode cluster pour plusieurs instances
      watch: false, // Ne pas surveiller les fichiers en production
      max_memory_restart: '500M', // Redémarrer si la mémoire dépasse 500MB
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
        // Les variables d'environnement sont chargées depuis .env
        // PM2 charge automatiquement .env si présent dans le répertoire de travail
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
        // Les variables d'environnement sont chargées depuis .env
        // PM2 charge automatiquement .env si présent dans le répertoire de travail
      },
      // Configuration des logs avec rotation
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Rotation des logs (PM2 gère automatiquement avec pm2-logrotate)
      // Installer: pm2 install pm2-logrotate
      // Configurer: pm2 set pm2-logrotate:max_size 10M
      //             pm2 set pm2-logrotate:retain 30
      // Configuration du redémarrage automatique
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Configuration du monitoring
      pmx: true,
      // Health check PM2 (optionnel)
      // PM2 peut surveiller un endpoint pour redémarrer si l'app ne répond plus
      // Installez pm2-http-health pour utiliser cette fonctionnalité
      // health_check_url: 'http://localhost:4000/health',
      // health_check_grace_period: 3000,
      // Health check grace period (délai avant de commencer les health checks)
      health_check_grace_period: 3000,
      // Health check interval (intervalle entre les vérifications)
      health_check_interval: 30000,
      // Variables d'environnement supplémentaires (optionnel)
      // PM2 charge automatiquement .env depuis le répertoire de travail
      // Si vous avez besoin de spécifier un chemin différent:
      // env_file: '/path/to/.env',
    },
  ],
};
