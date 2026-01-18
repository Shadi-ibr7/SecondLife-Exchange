#!/bin/bash
#
# Script de backup PostgreSQL pour SecondLife Exchange
# Production-ready: gestion d'erreurs, logs, compression gzip, vérifications
#
# Utilisation:
#   ./backup_db.sh [DB_NAME] [DB_USER] [DB_HOST] [BACKUP_DIR]
#
# Si non spécifiés, utilise les valeurs par défaut:
#   DB_NAME=secondlife_db
#   DB_USER=secondlife_user (ou postgres)
#   DB_HOST=localhost
#   BACKUP_DIR=/var/backups/secondlife
#

set -euo pipefail  # Mode strict: arrêt sur erreur, variables non définies, pipes

# ============================================
# CONFIGURATION
# ============================================

# Paramètres par défaut
DB_NAME="${1:-secondlife_db}"
DB_USER="${2:-postgres}"
DB_HOST="${3:-localhost}"
DB_PORT="${4:-5432}"
BACKUP_DIR="${5:-/var/backups/secondlife}"
RETENTION_DAYS=7

# Chemins et fichiers
TIMESTAMP=$(date +"%Y-%m-%d_%H%M")
BACKUP_FILENAME="${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
LOG_FILE="/var/log/secondlife-backup.log"
PGPASS_FILE="${HOME}/.pgpass"

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "$@"
}

log_error() {
    log "ERROR" "$@" >&2
}

log_warn() {
    log "WARN" "$@"
}

# Vérifier que pg_dump est disponible
check_pg_dump() {
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump non trouvé. Installez postgresql-client."
        exit 1
    fi
}

# Vérifier que gzip est disponible
check_gzip() {
    if ! command -v gzip &> /dev/null; then
        log_error "gzip non trouvé. Installez gzip."
        exit 1
    fi
}

# Créer le répertoire de backup si nécessaire
setup_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Création du répertoire de backup: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        chmod 750 "$BACKUP_DIR"
    fi
}

# Vérifier la connexion à la base de données
check_db_connection() {
    log_info "Vérification de la connexion à la base de données..."
    
    if [ -f "$PGPASS_FILE" ]; then
        # Utiliser .pgpass si disponible
        export PGPASSFILE="$PGPASS_FILE"
    fi
    
    if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Impossible de se connecter à la base de données."
        log_error "Vérifiez: DB_NAME=$DB_NAME, DB_USER=$DB_USER, DB_HOST=$DB_HOST, DB_PORT=$DB_PORT"
        log_error "Vérifiez aussi votre fichier .pgpass ou variable PGPASSWORD"
        exit 1
    fi
    
    log_info "Connexion à la base de données OK"
}

# Effectuer le backup
perform_backup() {
    log_info "Début du backup: $DB_NAME -> $BACKUP_PATH"
    
    # Utiliser .pgpass si disponible, sinon PGPASSWORD
    if [ -f "$PGPASS_FILE" ]; then
        export PGPASSFILE="$PGPASS_FILE"
        PGPASSWORD_CMD=""
    else
        if [ -z "${PGPASSWORD:-}" ]; then
            log_error "PGPASSWORD non défini et .pgpass introuvable."
            log_error "Configurez PGPASSWORD ou créez $PGPASS_FILE"
            exit 1
        fi
        export PGPASSWORD
        PGPASSWORD_CMD=""
    fi
    
    # Mesurer le temps de backup
    local start_time=$(date +%s)
    
    # Exécuter pg_dump avec compression via pipe vers gzip
    if PGPASSWORD="${PGPASSWORD:-}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-owner \
        --no-acl \
        --format=plain \
        2>> "$LOG_FILE" | gzip > "$BACKUP_PATH"; then
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_info "Backup terminé en ${duration}s: $BACKUP_PATH"
    else
        log_error "Échec du backup de $DB_NAME"
        # Supprimer le fichier partiel s'il existe
        [ -f "$BACKUP_PATH" ] && rm -f "$BACKUP_PATH"
        exit 1
    fi
}

# Vérifier le fichier de backup
verify_backup() {
    log_info "Vérification du backup: $BACKUP_PATH"
    
    # Vérifier que le fichier existe
    if [ ! -f "$BACKUP_PATH" ]; then
        log_error "Le fichier de backup n'existe pas: $BACKUP_PATH"
        exit 1
    fi
    
    # Vérifier que la taille > 0
    local file_size=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null || echo "0")
    if [ "$file_size" -eq 0 ]; then
        log_error "Le fichier de backup est vide (0 bytes): $BACKUP_PATH"
        rm -f "$BACKUP_PATH"
        exit 1
    fi
    
    # Convertir en MB pour le log
    local size_mb=$(echo "scale=2; $file_size / 1024 / 1024" | bc 2>/dev/null || echo "$((file_size / 1024 / 1024))")
    log_info "Taille du backup: ${size_mb} MB (${file_size} bytes)"
    
    # Vérifier que c'est un fichier gzip valide
    if ! gzip -t "$BACKUP_PATH" 2>/dev/null; then
        log_error "Le fichier de backup n'est pas un gzip valide: $BACKUP_PATH"
        exit 1
    fi
    
    log_info "Vérification du backup OK"
}

# Nettoyer les anciens backups (rétention)
prune_old_backups() {
    log_info "Nettoyage des backups de plus de $RETENTION_DAYS jours..."
    
    local deleted_count=0
    local freed_space=0
    
    while IFS= read -r old_backup; do
        if [ -f "$old_backup" ]; then
            local file_size=$(stat -f%z "$old_backup" 2>/dev/null || stat -c%s "$old_backup" 2>/dev/null || echo "0")
            freed_space=$((freed_space + file_size))
            rm -f "$old_backup"
            deleted_count=$((deleted_count + 1))
            log_info "Supprimé: $(basename "$old_backup")"
        fi
    done < <(find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null)
    
    if [ $deleted_count -gt 0 ]; then
        local freed_mb=$(echo "scale=2; $freed_space / 1024 / 1024" | bc 2>/dev/null || echo "$((freed_space / 1024 / 1024))")
        log_info "Nettoyage terminé: $deleted_count fichier(s) supprimé(s), ${freed_mb} MB libéré(s)"
    else
        log_info "Aucun backup à supprimer"
    fi
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================

main() {
    log_info "=== Début du backup PostgreSQL ==="
    log_info "DB_NAME=$DB_NAME, DB_USER=$DB_USER, DB_HOST=$DB_HOST:$DB_PORT"
    log_info "BACKUP_DIR=$BACKUP_DIR, RETENTION=$RETENTION_DAYS jours"
    
    # Vérifications préliminaires
    check_pg_dump
    check_gzip
    setup_backup_dir
    check_db_connection
    
    # Backup
    perform_backup
    verify_backup
    
    # Nettoyage
    prune_old_backups
    
    log_info "=== Backup terminé avec succès ==="
    exit 0
}

# Exécuter le script principal
main "$@"
