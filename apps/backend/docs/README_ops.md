# Documentation Opérationnelle - SecondLife Exchange Backend

Ce document contient les procédures opérationnelles pour le monitoring, les logs, et le déploiement du backend en production.

## Table des matières

1. [Logging et Observabilité](#logging-et-observabilité)
2. [Monitoring avec PM2](#monitoring-avec-pm2)
3. [Health Checks](#health-checks)
4. [Alertes de Base](#alertes-de-base)
5. [Commandes Utiles](#commandes-utiles)
6. [Troubleshooting](#troubleshooting)

---

## Logging et Observabilité

### Logs Structurés

Le backend utilise un système de logging structuré qui produit des logs JSON en production pour faciliter le parsing et l'analyse.

#### Format des Logs

**En développement** : Format lisible pour faciliter le débogage
```
[HealthService] INFO: Database health check failed: Connection timeout
```

**En production** : Format JSON structuré
```json
{
  "timestamp": "2024-01-18T15:30:45.123Z",
  "level": "error",
  "context": "HealthService",
  "message": "Database health check failed: Connection timeout",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### RequestId

Chaque requête HTTP reçoit un identifiant unique (`requestId`) qui permet de tracer toutes les opérations liées à une même requête dans les logs.

- **Génération** : UUID v4 si le header `X-Request-Id` est absent
- **Propagation** : Le `requestId` est inclus dans tous les logs liés à la requête
- **Header de réponse** : Le header `X-Request-Id` est ajouté à chaque réponse HTTP

#### Niveaux de Log

- **debug** : Informations détaillées pour le débogage
- **info** : Informations générales (requêtes réussies 2xx, 3xx)
- **warn** : Avertissements (requêtes client 4xx)
- **error** : Erreurs (erreurs serveur 5xx, exceptions)

#### Données Sensibles

Le système de logging **ne logue jamais** :
- Mots de passe
- Tokens (access_token, refresh_token)
- Cookies
- Clés API
- Secrets

Les paramètres sensibles sont automatiquement filtrés des URLs et des données loguées.

---

## Monitoring avec PM2

### Installation et Configuration

PM2 est un gestionnaire de processus pour Node.js qui permet de maintenir l'application en ligne 24/7.

#### Installation PM2

```bash
npm install -g pm2
```

#### Configuration

Le fichier `ecosystem.config.js` contient la configuration PM2 pour le backend.

#### Commandes PM2

**Démarrer l'application**
```bash
cd apps/backend
pm2 start ecosystem.config.js --env production
```

**Redémarrer l'application**
```bash
pm2 restart secondlife-backend
```

**Arrêter l'application**
```bash
pm2 stop secondlife-backend
```

**Voir les logs en temps réel**
```bash
pm2 logs secondlife-backend
```

**Voir les logs des 100 dernières lignes**
```bash
pm2 logs secondlife-backend --lines 100
```

**Voir le statut de l'application**
```bash
pm2 status
```

**Voir les détails d'une application**
```bash
pm2 show secondlife-backend
```

**Monitoring en temps réel (CPU, mémoire)**
```bash
pm2 monit
```

**Sauvegarder la configuration PM2**
```bash
pm2 save
```

**Configurer PM2 pour démarrer au boot**
```bash
pm2 startup
# Suivre les instructions affichées
```

### Rotation des Logs

**Installer pm2-logrotate**
```bash
pm2 install pm2-logrotate
```

**Configurer la rotation**
```bash
# Taille maximale d'un fichier de log (10M)
pm2 set pm2-logrotate:max_size 10M

# Nombre de fichiers de log à conserver (30)
pm2 set pm2-logrotate:retain 30

# Compresser les anciens logs
pm2 set pm2-logrotate:compress true
```

### Logs PM2

Les logs PM2 sont stockés dans `apps/backend/logs/` :
- `pm2-error.log` : Logs d'erreur
- `pm2-out.log` : Logs de sortie standard

**Voir uniquement les erreurs**
```bash
pm2 logs secondlife-backend --err
```

**Voir uniquement la sortie standard**
```bash
pm2 logs secondlife-backend --out
```

---

## Health Checks

### Endpoints de Health Check

Le backend expose deux endpoints pour vérifier l'état de l'application :

#### GET /health

**Description** : Vérifie que le processus tourne (liveness check)

**Accès** : Sans authentification, sans préfixe `/api/v1`

**Exemple de requête**
```bash
curl http://localhost:4000/health
```

**Réponse 200 (OK)**
```json
{
  "status": "ok",
  "uptime": 3600,
  "version": "1.0.0",
  "timestamp": "2024-01-18T15:30:45.123Z"
}
```

**Utilisation** :
- PM2 health check
- Load balancers (vérification basique)
- Monitoring simple

#### GET /health/ready

**Description** : Vérifie que l'application est prête à recevoir du trafic (readiness check)

**Accès** : Sans authentification, sans préfixe `/api/v1`

**Exemple de requête**
```bash
curl http://localhost:4000/health/ready
```

**Réponse 200 (Ready)**
```json
{
  "status": "ready",
  "timestamp": "2024-01-18T15:30:45.123Z",
  "checks": {
    "database": {
      "status": "ok"
    },
    "redis": {
      "status": "ok"
    },
    "cloudinary": {
      "status": "ok"
    }
  }
}
```

**Réponse 503 (Not Ready)**
```json
{
  "status": "not_ready",
  "timestamp": "2024-01-18T15:30:45.123Z",
  "checks": {
    "database": {
      "status": "error",
      "message": "Database connection failed: Connection timeout"
    },
    "redis": {
      "status": "error",
      "message": "Redis connection failed: ECONNREFUSED"
    }
  }
}
```

**Vérifications effectuées** :
- **Database** (requis) : Connexion à PostgreSQL via Prisma
- **Redis** (optionnel) : Connexion à Redis pour le cache
- **Cloudinary** (optionnel) : Configuration Cloudinary pour les images

**Utilisation** :
- Kubernetes readiness probe
- Docker healthcheck
- Load balancers (vérification complète)
- Détection de déploiement réussi

### Configuration Nginx (Exemple)

```nginx
location /health {
    access_log off;
    proxy_pass http://localhost:4000/health;
    proxy_set_header Host $host;
}

location /health/ready {
    access_log off;
    proxy_pass http://localhost:4000/health/ready;
    proxy_set_header Host $host;
}
```

---

## Alertes de Base

### Checklist d'Alertes

#### 1. Uptime Monitoring

**Service recommandé** : UptimeRobot, Pingdom, ou équivalent

**Configuration** :
- **URL** : `https://votre-domaine.com/health`
- **Intervalle** : 5 minutes
- **Timeout** : 10 secondes
- **Alerte si** : Code de statut ≠ 200 ou timeout

#### 2. Erreurs 5xx

**Monitoring** : Analyse des logs PM2

**Commandes** :
```bash
# Compter les erreurs 5xx dans les dernières 100 lignes
pm2 logs secondlife-backend --lines 100 | grep -i "statusCode.*5[0-9][0-9]"

# Surveiller les erreurs en temps réel
pm2 logs secondlife-backend | grep -i "error\|5[0-9][0-9]"
```

**Script d'alerte simple** :
```bash
#!/bin/bash
# scripts/check-errors.sh

ERROR_COUNT=$(pm2 logs secondlife-backend --lines 100 --nostream | grep -c "level.*error")

if [ "$ERROR_COUNT" -gt 10 ]; then
    echo "ALERT: $ERROR_COUNT errors found in last 100 log lines"
    # Envoyer une notification (email, Slack, etc.)
fi
```

#### 3. Uptime de l'Application

**Monitoring PM2** :
```bash
# Voir l'uptime de l'application
pm2 show secondlife-backend | grep "uptime"

# Vérifier que l'application tourne depuis au moins X minutes
pm2 jlist | jq '.[0].pm2_env.status'  # Doit être "online"
```

#### 4. Utilisation Mémoire

**Monitoring PM2** :
```bash
# Voir l'utilisation mémoire en temps réel
pm2 monit

# Voir les stats mémoire
pm2 show secondlife-backend | grep "memory"

# Script d'alerte si mémoire > 400MB
#!/bin/bash
MEMORY_USAGE=$(pm2 jlist | jq '.[0].monit.memory' | awk '{print $1/1024/1024}')
if (( $(echo "$MEMORY_USAGE > 400" | bc -l) )); then
    echo "ALERT: Memory usage is ${MEMORY_USAGE}MB"
fi
```

#### 5. Readiness Check

**Monitoring** : Surveiller `/health/ready` avec un service externe

**Configuration** :
- **URL** : `https://votre-domaine.com/health/ready`
- **Intervalle** : 2 minutes
- **Alerte si** : Code de statut = 503

---

## Commandes Utiles

### Logs

```bash
# Voir les logs en temps réel
pm2 logs secondlife-backend

# Voir les 50 dernières lignes
pm2 logs secondlife-backend --lines 50

# Voir uniquement les erreurs
pm2 logs secondlife-backend --err

# Chercher un requestId spécifique dans les logs
pm2 logs secondlife-backend | grep "550e8400-e29b-41d4-a716-446655440000"

# Exporter les logs vers un fichier
pm2 logs secondlife-backend --lines 1000 > logs/export-$(date +%Y%m%d).log
```

### Health Checks

```bash
# Vérifier la santé de l'application
curl http://localhost:4000/health

# Vérifier la readiness
curl http://localhost:4000/health/ready

# Vérifier avec verbose pour voir les détails
curl -v http://localhost:4000/health/ready
```

### Monitoring

```bash
# Monitoring en temps réel (CPU, mémoire, logs)
pm2 monit

# Statut de l'application
pm2 status

# Détails de l'application
pm2 show secondlife-backend

# Métriques de l'application
pm2 describe secondlife-backend
```

### Maintenance

```bash
# Redémarrer l'application
pm2 restart secondlife-backend

# Redémarrer avec zéro downtime (si plusieurs instances)
pm2 reload secondlife-backend

# Arrêter l'application
pm2 stop secondlife-backend

# Supprimer l'application de PM2
pm2 delete secondlife-backend

# Flush les logs (vider les logs)
pm2 flush
```

---

## Troubleshooting

### L'application ne démarre pas

**Vérifier les logs d'erreur**
```bash
pm2 logs secondlife-backend --err --lines 100
```

**Vérifier les variables d'environnement**
```bash
pm2 show secondlife-backend | grep "env:"
```

**Vérifier que le port est disponible**
```bash
lsof -i :4000
```

### L'application redémarre en boucle

**Vérifier les logs**
```bash
pm2 logs secondlife-backend --err --lines 50
```

**Vérifier la mémoire**
```bash
pm2 monit
```

**Vérifier la configuration PM2**
```bash
pm2 show secondlife-backend
```

### Les logs sont trop volumineux

**Installer et configurer pm2-logrotate**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

**Flush les logs manuellement**
```bash
pm2 flush
```

### Le health check échoue

**Vérifier manuellement**
```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/ready
```

**Vérifier les logs de l'application**
```bash
pm2 logs secondlife-backend | grep -i "health"
```

**Vérifier la connexion à la base de données**
```bash
# Se connecter à la base de données et tester
psql -h localhost -U votre_user -d votre_db -c "SELECT 1;"
```

### Performance

**Voir l'utilisation CPU et mémoire**
```bash
pm2 monit
```

**Analyser les logs pour les requêtes lentes**
```bash
pm2 logs secondlife-backend | grep "duration" | awk '{print $NF}' | sort -n
```

**Vérifier le nombre de requêtes par seconde**
```bash
pm2 logs secondlife-backend --lines 1000 | grep "http_request_end" | wc -l
```

---

## Liens Utiles

- [Documentation PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Log Rotation](https://github.com/keymetrics/pm2-logrotate)
- [Documentation NestJS Logging](https://docs.nestjs.com/techniques/logger)

---

## Backups PostgreSQL

### Vue d'ensemble

Le système de backup PostgreSQL est configuré pour effectuer des sauvegardes quotidiennes automatiques avec compression gzip et gestion de la rétention.

**Caractéristiques** :
- Backup quotidien automatique à 03:00 (cron)
- Compression gzip
- Rétention : 7 jours par défaut
- Nommage : `secondlife_db_YYYY-MM-DD_HHMM.sql.gz`
- Logs : `/var/log/secondlife-backup.log`
- Sécurité : utilisation de `.pgpass` (pas de mot de passe en clair)

### Scripts disponibles

#### `scripts/backup_db.sh`

Script principal de backup PostgreSQL.

**Utilisation** :
```bash
# Backup avec paramètres par défaut
./scripts/backup_db.sh

# Backup avec paramètres personnalisés
./scripts/backup_db.sh <DB_NAME> <DB_USER> <DB_HOST> <DB_PORT> <BACKUP_DIR>

# Exemples
./scripts/backup_db.sh secondlife_db postgres localhost 5432 /var/backups/secondlife
./scripts/backup_db.sh secondlife_db secondlife_user localhost 5432 /root/backups
```

**Ce que fait le script** :
1. Vérifie les prérequis (pg_dump, gzip)
2. Vérifie la connexion à la base de données
3. Crée le répertoire de backup si nécessaire
4. Effectue le backup avec compression gzip
5. Vérifie le fichier de backup (existence, taille, validité gzip)
6. Nettoie les anciens backups (rétention 7 jours)
7. Log toutes les opérations

**Fichier de backup** :
- Nom : `secondlife_db_2024-01-15_0300.sql.gz`
- Emplacement : `/var/backups/secondlife/` (par défaut)
- Format : SQL plain compressé en gzip

#### `scripts/restore_db.sh`

Script de restauration PostgreSQL. **⚠️ ATTENTION** : Ce script écrase toutes les données existantes.

**Utilisation** :
```bash
# Restaurer dans la base de production (DANGEREUX - demande confirmation)
./scripts/restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz

# Restaurer dans une base de test
./scripts/restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz secondlife_test

# Mode non-interactif (pour scripts automatisés)
NON_INTERACTIVE=1 ./scripts/restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz secondlife_test
```

**Ce que fait le script** :
1. Vérifie le fichier de backup
2. Vérifie la connexion au serveur PostgreSQL
3. Demande confirmation (sauf mode non-interactif)
4. Crée la base de données si elle n'existe pas
5. Ferme les connexions actives
6. Restaure le backup
7. Vérifie la restauration (compte les tables)

**Procédure de restauration recommandée** :

1. **Créer une base de test** :
```bash
createdb -U postgres secondlife_test
```

2. **Restaurer dans la base de test** :
```bash
./scripts/restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz secondlife_test
```

3. **Vérifier les données dans la base de test** :
```bash
psql -U postgres -d secondlife_test -c "\dt"  # Lister les tables
psql -U postgres -d secondlife_test -c "SELECT COUNT(*) FROM users;"  # Vérifier des données
```

4. **Si tout est OK, restaurer en production** (après backup de sécurité) :
```bash
# Faire un backup de sécurité d'abord !
./scripts/backup_db.sh

# Puis restaurer
./scripts/restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz
```

#### `scripts/backup_prune.sh`

Script de nettoyage manuel des anciens backups (utile si exécuté séparément du backup).

**Utilisation** :
```bash
# Nettoyage avec paramètres par défaut (7 jours)
./scripts/backup_prune.sh

# Nettoyage avec paramètres personnalisés
./scripts/backup_prune.sh <BACKUP_DIR> <RETENTION_DAYS> <DB_NAME>

# Exemples
./scripts/backup_prune.sh /var/backups/secondlife 7 secondlife_db
./scripts/backup_prune.sh /root/backups 30 secondlife_db  # Garder 30 jours
```

### Configuration `.pgpass`

Pour éviter de stocker le mot de passe en clair dans les scripts, utilisez un fichier `.pgpass` :

**Créer le fichier `.pgpass`** :
```bash
# En tant que root (ou l'utilisateur qui exécute le backup)
touch ~/.pgpass
chmod 600 ~/.pgpass
```

**Format du fichier `.pgpass`** (une ligne par base de données) :
```
hostname:port:database:username:password
```

**Exemple** :
```
localhost:5432:secondlife_db:postgres:mon_mot_de_passe
localhost:5432:*:postgres:mon_mot_de_passe  # Pour toutes les bases
```

**Important** :
- Le fichier doit être accessible uniquement par le propriétaire (`chmod 600`)
- PostgreSQL lit automatiquement `~/.pgpass` si `PGPASSFILE` n'est pas défini

### Vérification des backups

#### Lister les backups disponibles

```bash
ls -lh /var/backups/secondlife/
```

#### Vérifier le dernier backup

```bash
# Voir les dernières lignes du log
tail -20 /var/log/secondlife-backup.log

# Vérifier la date du dernier backup
ls -lht /var/backups/secondlife/ | head -5

# Vérifier la taille du dernier backup
ls -lh /var/backups/secondlife/secondlife_db_*.sql.gz | tail -1
```

#### Tester un backup

```bash
# Décompresser et examiner un backup (sans restaurer)
gzip -dc /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz | head -50

# Vérifier que c'est un gzip valide
gzip -t /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz && echo "OK" || echo "ERREUR"
```

### Logs

Les logs des backups sont écrits dans `/var/log/secondlife-backup.log` :

```bash
# Voir les dernières entrées
tail -50 /var/log/secondlife-backup.log

# Chercher les erreurs
grep ERROR /var/log/secondlife-backup.log

# Voir les backups des 7 derniers jours
grep "INFO.*Backup terminé" /var/log/secondlife-backup.log | tail -7
```

### Cron job (backup automatique)

Le cron job est configuré pour exécuter le backup quotidiennement à 03:00.

**Vérifier le cron job** :
```bash
crontab -l | grep backup_db
```

**Format** :
```
0 3 * * * /chemin/vers/scripts/backup_db.sh >> /var/log/secondlife-backup.log 2>&1
```

Voir la section [Installation sur VPS](#installation-sur-vps) pour les instructions complètes de configuration.

### Troubleshooting backups

#### Le backup échoue avec "pg_dump non trouvé"

**Solution** : Installez le client PostgreSQL :
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y postgresql-client

# CentOS/RHEL
sudo yum install -y postgresql
```

#### Le backup échoue avec "Impossible de se connecter à la base de données"

**Vérifications** :
1. Vérifiez que PostgreSQL est démarré :
```bash
sudo systemctl status postgresql
```

2. Vérifiez la connexion manuellement :
```bash
psql -h localhost -U postgres -d secondlife_db -c "SELECT 1;"
```

3. Vérifiez le fichier `.pgpass` :
```bash
cat ~/.pgpass  # Vérifier le contenu
ls -l ~/.pgpass  # Vérifier les permissions (doit être 600)
```

4. Vérifiez les variables d'environnement :
```bash
echo $PGPASSWORD  # Doit être vide si .pgpass est utilisé
```

#### Le fichier de backup est vide (0 bytes)

**Causes possibles** :
- Échec silencieux de `pg_dump`
- Problème de compression

**Solution** : Vérifiez les logs :
```bash
tail -100 /var/log/secondlife-backup.log | grep -i error
```

#### Le cron job ne s'exécute pas

**Vérifications** :
1. Vérifiez que cron est actif :
```bash
sudo systemctl status cron  # Ubuntu/Debian
sudo systemctl status crond  # CentOS/RHEL
```

2. Vérifiez les logs cron :
```bash
# Ubuntu/Debian
grep CRON /var/log/syslog | tail -20

# CentOS/RHEL
grep CRON /var/log/cron | tail -20
```

3. Vérifiez le chemin absolu dans le cron job :
```bash
crontab -l
```

Le chemin doit être absolu, pas relatif.

---

## Support

Pour toute question ou problème, consultez :
- `ADMIN_TROUBLESHOOTING.md` : Guide de dépannage détaillé
- Logs PM2 : `pm2 logs secondlife-backend`
- Health checks : `/health` et `/health/ready`
- Logs de backup : `/var/log/secondlife-backup.log`