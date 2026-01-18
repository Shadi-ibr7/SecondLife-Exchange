# Installation du système de backup PostgreSQL sur VPS

Guide d'installation pas à pas pour configurer les backups PostgreSQL automatiques sur un VPS.

## Table des matières

1. [Prérequis](#prérequis)
2. [Installation des dépendances](#installation-des-dépendances)
3. [Configuration de la sécurité](#configuration-de-la-sécurité)
4. [Installation des scripts](#installation-des-scripts)
5. [Configuration du cron job](#configuration-du-cron-job)
6. [Test et vérification](#test-et-vérification)
7. [Commandes utiles](#commandes-utiles)

---

## Prérequis

- VPS avec PostgreSQL installé et configuré
- Accès root ou sudo
- Base de données : `secondlife_db` (ou votre nom de base)
- Utilisateur PostgreSQL : `postgres` ou `secondlife_user`

**Vérifier PostgreSQL** :
```bash
sudo systemctl status postgresql
psql --version
```

---

## Installation des dépendances

### 1. Installer le client PostgreSQL (si nécessaire)

**Ubuntu/Debian** :
```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

**CentOS/RHEL** :
```bash
sudo yum install -y postgresql
```

**Vérifier l'installation** :
```bash
pg_dump --version
gzip --version
```

### 2. Installer `bc` (pour les calculs de taille)

**Ubuntu/Debian** :
```bash
sudo apt-get install -y bc
```

**CentOS/RHEL** :
```bash
sudo yum install -y bc
```

---

## Configuration de la sécurité

### 1. Créer le répertoire de backup

```bash
# Créer le répertoire (option 1: système)
sudo mkdir -p /var/backups/secondlife
sudo chown root:root /var/backups/secondlife
sudo chmod 750 /var/backups/secondlife

# OU créer le répertoire (option 2: utilisateur root)
sudo mkdir -p /root/backups
sudo chmod 700 /root/backups
```

**Note** : Utilisez `/var/backups/secondlife` pour les backups système ou `/root/backups` pour les backups utilisateur root.

### 2. Configurer le fichier `.pgpass`

Le fichier `.pgpass` permet de stocker les mots de passe PostgreSQL de manière sécurisée.

**En tant que root** :
```bash
# Créer le fichier
sudo touch /root/.pgpass
sudo chmod 600 /root/.pgpass
```

**Format du fichier `.pgpass`** (une ligne par configuration) :
```
hostname:port:database:username:password
```

**Exemple pour `localhost`** :
```bash
sudo tee /root/.pgpass > /dev/null <<EOF
localhost:5432:secondlife_db:postgres:votre_mot_de_passe_ici
localhost:5432:*:postgres:votre_mot_de_passe_ici
EOF
```

**Exemple pour `secondlife_user`** :
```bash
sudo tee /root/.pgpass > /dev/null <<EOF
localhost:5432:secondlife_db:secondlife_user:votre_mot_de_passe_ici
EOF
```

**Vérifier les permissions** :
```bash
ls -l /root/.pgpass
# Doit afficher: -rw------- (600)
```

**Tester la connexion** :
```bash
# Tester avec .pgpass (sans mot de passe)
export PGPASSFILE=/root/.pgpass
psql -h localhost -U postgres -d secondlife_db -c "SELECT 1;"
```

**Si la connexion échoue** :
- Vérifiez le format du fichier `.pgpass` (exactement : `host:port:db:user:password`)
- Vérifiez les permissions (doit être `600`)
- Vérifiez le mot de passe PostgreSQL

### 3. Créer le fichier de log

```bash
sudo touch /var/log/secondlife-backup.log
sudo chmod 644 /var/log/secondlife-backup.log
```

---

## Installation des scripts

### 1. Copier les scripts sur le VPS

**Option 1 : Depuis le projet local** (si vous avez accès au repo)

```bash
# Depuis votre machine locale, copier vers le VPS
scp scripts/backup_db.sh root@votre-vps:/root/scripts/
scp scripts/restore_db.sh root@votre-vps:/root/scripts/
scp scripts/backup_prune.sh root@votre-vps:/root/scripts/
```

**Option 2 : Créer les scripts directement sur le VPS**

```bash
# Sur le VPS, créer le répertoire
sudo mkdir -p /root/scripts

# Créer les scripts (copier-coller le contenu depuis le repo)
sudo nano /root/scripts/backup_db.sh
sudo nano /root/scripts/restore_db.sh
sudo nano /root/scripts/backup_prune.sh
```

### 2. Rendre les scripts exécutables

```bash
sudo chmod +x /root/scripts/backup_db.sh
sudo chmod +x /root/scripts/restore_db.sh
sudo chmod +x /root/scripts/backup_prune.sh
```

### 3. Adapter les paramètres par défaut (si nécessaire)

**Si votre configuration diffère des valeurs par défaut** :

Modifiez les lignes de configuration dans `backup_db.sh` :
```bash
sudo nano /root/scripts/backup_db.sh
```

Lignes à modifier (environ ligne 20) :
```bash
DB_NAME="${1:-secondlife_db}"      # Votre nom de base
DB_USER="${2:-postgres}"            # Votre utilisateur PostgreSQL
DB_HOST="${3:-localhost}"           # Votre host (localhost par défaut)
DB_PORT="${4:-5432}"                # Votre port (5432 par défaut)
BACKUP_DIR="${5:-/var/backups/secondlife}"  # Votre répertoire de backup
RETENTION_DAYS=7                    # Nombre de jours de rétention
```

---

## Configuration du cron job

### 1. Éditer le crontab de root

```bash
sudo crontab -e
```

### 2. Ajouter la ligne de cron pour le backup quotidien

**Backup quotidien à 03:00** :
```cron
# Backup PostgreSQL SecondLife - Tous les jours à 03:00
0 3 * * * /root/scripts/backup_db.sh >> /var/log/secondlife-backup.log 2>&1
```

**Si vous devez spécifier des paramètres personnalisés** :
```cron
# Backup avec paramètres personnalisés
0 3 * * * /root/scripts/backup_db.sh secondlife_db postgres localhost 5432 /var/backups/secondlife >> /var/log/secondlife-backup.log 2>&1
```

**Si vous utilisez `/root/backups` comme répertoire** :
```cron
0 3 * * * /root/scripts/backup_db.sh secondlife_db postgres localhost 5432 /root/backups >> /var/log/secondlife-backup.log 2>&1
```

### 3. Vérifier le cron job

```bash
sudo crontab -l
```

Vous devriez voir la ligne du backup.

### 4. Tester le cron job manuellement

**Test immédiat** :
```bash
# Exécuter le script manuellement pour tester
sudo /root/scripts/backup_db.sh

# Vérifier les logs
sudo tail -20 /var/log/secondlife-backup.log

# Vérifier le fichier de backup
sudo ls -lh /var/backups/secondlife/  # ou /root/backups/
```

**Test avec cron** (exécuter dans 1 minute) :
```bash
# Ajouter temporairement une ligne de test
sudo crontab -e
# Ajouter: * * * * * /root/scripts/backup_db.sh >> /var/log/secondlife-backup.log 2>&1
# Attendre 1 minute, puis vérifier les logs
sudo tail -20 /var/log/secondlife-backup.log
# Retirer la ligne de test après vérification
```

---

## Test et vérification

### 1. Test manuel du backup

```bash
# Exécuter le backup manuellement
sudo /root/scripts/backup_db.sh

# Vérifier le résultat
sudo ls -lh /var/backups/secondlife/
sudo tail -30 /var/log/secondlife-backup.log
```

**Vérifications** :
- Le fichier de backup existe (`secondlife_db_YYYY-MM-DD_HHMM.sql.gz`)
- La taille du fichier > 0
- Aucune erreur dans les logs

### 2. Test de la restauration (base de test)

**Créer une base de test** :
```bash
sudo -u postgres psql -c "CREATE DATABASE secondlife_test;"
```

**Restaurer dans la base de test** :
```bash
# Trouver le dernier backup
LAST_BACKUP=$(sudo ls -t /var/backups/secondlife/secondlife_db_*.sql.gz | head -1)

# Restaurer
sudo NON_INTERACTIVE=1 /root/scripts/restore_db.sh "$LAST_BACKUP" secondlife_test
```

**Vérifier la restauration** :
```bash
# Lister les tables
sudo -u postgres psql -d secondlife_test -c "\dt"

# Vérifier quelques données
sudo -u postgres psql -d secondlife_test -c "SELECT COUNT(*) FROM users;"
```

**Nettoyer (supprimer la base de test)** :
```bash
sudo -u postgres psql -c "DROP DATABASE secondlife_test;"
```

### 3. Vérifier le cron job

**Attendre l'heure du backup (03:00) ou utiliser un test immédiat** :

```bash
# Vérifier que cron est actif
sudo systemctl status cron   # Ubuntu/Debian
sudo systemctl status crond  # CentOS/RHEL

# Vérifier les logs cron
sudo grep CRON /var/log/syslog | tail -10    # Ubuntu/Debian
sudo grep CRON /var/log/cron | tail -10      # CentOS/RHEL

# Vérifier les logs de backup
sudo tail -50 /var/log/secondlife-backup.log
```

---

## Commandes utiles

### Vérifier les backups

```bash
# Lister les backups
sudo ls -lh /var/backups/secondlife/

# Voir le dernier backup
sudo ls -lht /var/backups/secondlife/ | head -1

# Voir la taille totale des backups
sudo du -sh /var/backups/secondlife/
```

### Voir les logs

```bash
# Dernières 50 lignes
sudo tail -50 /var/log/secondlife-backup.log

# Rechercher les erreurs
sudo grep ERROR /var/log/secondlife-backup.log

# Voir les backups réussis
sudo grep "Backup terminé" /var/log/secondlife-backup.log
```

### Nettoyage manuel

```bash
# Nettoyer les backups de plus de 7 jours
sudo /root/scripts/backup_prune.sh

# Nettoyer avec rétention personnalisée (ex: 30 jours)
sudo /root/scripts/backup_prune.sh /var/backups/secondlife 30 secondlife_db
```

### Restauration

```bash
# Lister les backups disponibles
sudo ls -lh /var/backups/secondlife/

# Restaurer un backup spécifique (base de production)
sudo /root/scripts/restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz

# Restaurer dans une base de test
sudo /root/scripts/restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz secondlife_test
```

---

## Résumé de l'installation

### Checklist

- [ ] PostgreSQL installé et configuré
- [ ] Client PostgreSQL (`pg_dump`) installé
- [ ] Répertoire de backup créé (`/var/backups/secondlife` ou `/root/backups`)
- [ ] Fichier `.pgpass` configuré avec permissions `600`
- [ ] Scripts copiés dans `/root/scripts/` et exécutables
- [ ] Fichier de log créé (`/var/log/secondlife-backup.log`)
- [ ] Cron job configuré (backup quotidien à 03:00)
- [ ] Test manuel réussi
- [ ] Test de restauration réussi (base de test)

### Configuration finale

**Répertoires** :
- Scripts : `/root/scripts/`
- Backups : `/var/backups/secondlife/` (ou `/root/backups/`)
- Logs : `/var/log/secondlife-backup.log`
- `.pgpass` : `/root/.pgpass`

**Cron job** :
```
0 3 * * * /root/scripts/backup_db.sh >> /var/log/secondlife-backup.log 2>&1
```

**Rétention** : 7 jours (modifiable dans `backup_db.sh`)

---

## Support

Pour toute question ou problème :
- Consultez `apps/backend/docs/README_ops.md` (section Backups PostgreSQL)
- Vérifiez les logs : `/var/log/secondlife-backup.log`
- Vérifiez les logs cron : `/var/log/syslog` (Ubuntu/Debian) ou `/var/log/cron` (CentOS/RHEL)
