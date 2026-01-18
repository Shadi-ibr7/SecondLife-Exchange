# Guide rapide : Installation backup PostgreSQL sur VPS

Guide ultra-simplifié pour installer les backups en 5 minutes.

## Étape 1 : Se connecter au VPS

```bash
ssh root@votre-serveur-ip
# OU
ssh votre-user@votre-serveur-ip
sudo su -  # Devenir root si nécessaire
```

## Étape 2 : Télécharger les scripts depuis GitHub

```bash
# Option 1: Cloner le repo (si pas déjà fait)
cd /root
git clone https://github.com/Shadi-ibr7/SecondLife-Exchange.git
cd SecondLife-Exchange

# Option 2: Télécharger juste les scripts (plus rapide)
cd /root
mkdir -p scripts
cd scripts
curl -O https://raw.githubusercontent.com/Shadi-ibr7/SecondLife-Exchange/main/scripts/backup_db.sh
curl -O https://raw.githubusercontent.com/Shadi-ibr7/SecondLife-Exchange/main/scripts/restore_db.sh
curl -O https://raw.githubusercontent.com/Shadi-ibr7/SecondLife-Exchange/main/scripts/backup_prune.sh
chmod +x *.sh
cd ..
```

## Étape 3 : Installer les dépendances

```bash
# Ubuntu/Debian
apt-get update
apt-get install -y postgresql-client bc

# CentOS/RHEL
yum install -y postgresql bc
```

## Étape 4 : Configurer la sécurité (.pgpass)

**Remplacez `votre_mot_de_passe` par votre vrai mot de passe PostgreSQL** :

```bash
# Créer le fichier .pgpass
cat > /root/.pgpass << 'EOF'
localhost:5432:secondlife_db:postgres:votre_mot_de_passe
localhost:5432:*:postgres:votre_mot_de_passe
EOF

# Sécuriser le fichier (IMPORTANT!)
chmod 600 /root/.pgpass

# Tester la connexion
export PGPASSFILE=/root/.pgpass
psql -h localhost -U postgres -d secondlife_db -c "SELECT 1;"
```

**Si vous utilisez un autre utilisateur PostgreSQL** (par exemple `secondlife_user`), remplacez dans la commande ci-dessus :
- `postgres` → `secondlife_user`
- `secondlife_db` → votre nom de base de données

## Étape 5 : Créer les répertoires

```bash
# Répertoire de backup
mkdir -p /var/backups/secondlife
chmod 750 /var/backups/secondlife

# OU si vous préférez dans /root
mkdir -p /root/backups
chmod 700 /root/backups

# Fichier de log
touch /var/log/secondlife-backup.log
chmod 644 /var/log/secondlife-backup.log
```

## Étape 6 : Tester le backup manuellement

```bash
# Si scripts dans /root/SecondLife-Exchange/scripts/
/root/SecondLife-Exchange/scripts/backup_db.sh

# OU si scripts dans /root/scripts/
/root/scripts/backup_db.sh

# Vérifier le résultat
ls -lh /var/backups/secondlife/
tail -20 /var/log/secondlife-backup.log
```

**Si ça fonctionne**, vous devriez voir un fichier `secondlife_db_YYYY-MM-DD_HHMM.sql.gz`

## Étape 7 : Configurer le cron (backup automatique quotidien)

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne (backup tous les jours à 03:00)
0 3 * * * /root/SecondLife-Exchange/scripts/backup_db.sh >> /var/log/secondlife-backup.log 2>&1

# OU si scripts dans /root/scripts/
0 3 * * * /root/scripts/backup_db.sh >> /var/log/secondlife-backup.log 2>&1
```

**Sauvegarder** (Ctrl+X, puis Y, puis Enter)

**Vérifier** :
```bash
crontab -l
```

## Étape 8 : Vérifier que tout fonctionne

```bash
# Voir les prochains backups programmés
crontab -l

# Vérifier les logs
tail -30 /var/log/secondlife-backup.log

# Lister les backups
ls -lh /var/backups/secondlife/
```

## ✅ C'est terminé !

Les backups s'exécutent automatiquement tous les jours à 03:00.

---

## Commandes utiles après installation

### Voir les backups disponibles
```bash
ls -lh /var/backups/secondlife/
```

### Voir les logs
```bash
tail -50 /var/log/secondlife-backup.log
```

### Restaurer un backup (base de test)
```bash
# Créer une base de test
createdb -U postgres secondlife_test

# Restaurer
/root/SecondLife-Exchange/scripts/restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz secondlife_test
```

### Nettoyer manuellement les anciens backups
```bash
/root/SecondLife-Exchange/scripts/backup_prune.sh
```

---

## Problèmes courants

### Erreur: "pg_dump non trouvé"
```bash
apt-get install -y postgresql-client  # Ubuntu/Debian
```

### Erreur: "Impossible de se connecter"
- Vérifiez le fichier `.pgpass` : `cat /root/.pgpass`
- Vérifiez les permissions : `ls -l /root/.pgpass` (doit être `600`)
- Testez manuellement : `psql -h localhost -U postgres -d secondlife_db -c "SELECT 1;"`

### Le cron ne s'exécute pas
- Vérifiez que cron est actif : `systemctl status cron`
- Vérifiez les logs cron : `grep CRON /var/log/syslog | tail -10`
