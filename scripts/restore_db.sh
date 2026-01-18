#!/bin/bash
#
# Script de restauration PostgreSQL pour SecondLife Exchange
# IMPORTANT: Ce script RESTAURE UN BACKUP et ÉCRASE les données existantes
#
# Utilisation:
#   ./restore_db.sh <backup_file.sql.gz> [TARGET_DB_NAME] [TARGET_DB_USER] [TARGET_DB_HOST]
#
# Exemples:
#   # Restaurer dans la base de production (DANGEREUX)
#   ./restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz
#
#   # Restaurer dans une base de test
#   ./restore_db.sh /var/backups/secondlife/secondlife_db_2024-01-15_0300.sql.gz secondlife_test
#

set -euo pipefail  # Mode strict

# ============================================
# CONFIGURATION
# ============================================

# Paramètres
BACKUP_FILE="${1:-}"
TARGET_DB_NAME="${2:-secondlife_db}"
TARGET_DB_USER="${3:-postgres}"
TARGET_DB_HOST="${4:-localhost}"
TARGET_DB_PORT="${5:-5432}"

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

# Vérifier que le fichier de backup existe
check_backup_file() {
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Usage: $0 <backup_file.sql.gz> [TARGET_DB_NAME] [TARGET_DB_USER] [TARGET_DB_HOST]"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Le fichier de backup n'existe pas: $BACKUP_FILE"
        exit 1
    fi
    
    # Vérifier que c'est un gzip valide
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log_error "Le fichier n'est pas un gzip valide: $BACKUP_FILE"
        exit 1
    fi
    
    log_info "Fichier de backup OK: $BACKUP_FILE"
    local file_size=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
    local size_mb=$(echo "scale=2; $file_size / 1024 / 1024" | bc 2>/dev/null || echo "$((file_size / 1024 / 1024))")
    log_info "Taille: ${size_mb} MB"
}

# Vérifier la connexion à la base de données
check_db_connection() {
    log_info "Vérification de la connexion à la base de données..."
    
    if [ -f "$PGPASS_FILE" ]; then
        export PGPASSFILE="$PGPASS_FILE"
    fi
    
    if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Impossible de se connecter au serveur PostgreSQL."
        log_error "Vérifiez: TARGET_DB_USER=$TARGET_DB_USER, TARGET_DB_HOST=$TARGET_DB_HOST, TARGET_DB_PORT=$TARGET_DB_PORT"
        exit 1
    fi
    
    log_info "Connexion au serveur PostgreSQL OK"
}

# Confirmation avant restauration (sauf si mode non-interactif)
confirm_restore() {
    if [ "${NON_INTERACTIVE:-}" = "1" ]; then
        log_warn "Mode non-interactif: restauration automatique"
        return 0
    fi
    
    echo ""
    echo "⚠️  ATTENTION: Cette opération va ÉCRASER toutes les données de la base '$TARGET_DB_NAME'"
    echo "   avec les données du backup: $(basename "$BACKUP_FILE")"
    echo ""
    echo "   Serveur: $TARGET_DB_HOST:$TARGET_DB_PORT"
    echo "   Base de données: $TARGET_DB_NAME"
    echo "   Utilisateur: $TARGET_DB_USER"
    echo ""
    read -p "Êtes-vous sûr de vouloir continuer? (tapez 'RESTORE' en majuscules): " confirmation
    
    if [ "$confirmation" != "RESTORE" ]; then
        log_info "Restauration annulée par l'utilisateur"
        exit 0
    fi
}

# Créer la base de données si elle n'existe pas
create_database_if_not_exists() {
    log_info "Vérification de l'existence de la base de données: $TARGET_DB_NAME"
    
    # Vérifier si la base existe
    local db_exists=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB_NAME'" 2>/dev/null || echo "0")
    
    if [ "$db_exists" = "1" ]; then
        log_info "La base de données existe déjà: $TARGET_DB_NAME"
    else
        log_warn "La base de données n'existe pas. Création..."
        if PGPASSWORD="${PGPASSWORD:-}" psql -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d postgres -c "CREATE DATABASE \"$TARGET_DB_NAME\";" 2>> "$LOG_FILE"; then
            log_info "Base de données créée: $TARGET_DB_NAME"
        else
            log_error "Impossible de créer la base de données: $TARGET_DB_NAME"
            exit 1
        fi
    fi
}

# Fermer les connexions actives à la base de données
close_active_connections() {
    log_info "Fermeture des connexions actives à la base de données..."
    
    PGPASSWORD="${PGPASSWORD:-}" psql -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$TARGET_DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
    
    log_info "Connexions fermées (ou aucune connexion active)"
}

# Restaurer le backup
perform_restore() {
    log_info "Début de la restauration: $BACKUP_FILE -> $TARGET_DB_NAME"
    log_info "Cette opération peut prendre plusieurs minutes..."
    
    # Mesurer le temps de restauration
    local start_time=$(date +%s)
    
    # Décompresser et restaurer
    if gzip -dc "$BACKUP_FILE" | PGPASSWORD="${PGPASSWORD:-}" psql \
        -h "$TARGET_DB_HOST" \
        -p "$TARGET_DB_PORT" \
        -U "$TARGET_DB_USER" \
        -d "$TARGET_DB_NAME" \
        --quiet \
        2>> "$LOG_FILE"; then
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_info "Restauration terminée avec succès en ${duration}s"
    else
        log_error "Échec de la restauration de $TARGET_DB_NAME"
        exit 1
    fi
}

# Vérifier la restauration
verify_restore() {
    log_info "Vérification de la restauration..."
    
    # Vérifier que la base contient des tables
    local table_count=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    if [ "$table_count" -gt 0 ]; then
        log_info "Vérification OK: $table_count table(s) trouvée(s) dans la base de données"
    else
        log_warn "Aucune table trouvée dans la base de données. La restauration peut avoir échoué."
    fi
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================

main() {
    log_info "=== Début de la restauration PostgreSQL ==="
    log_info "BACKUP_FILE=$BACKUP_FILE"
    log_info "TARGET_DB_NAME=$TARGET_DB_NAME, TARGET_DB_USER=$TARGET_DB_USER, TARGET_DB_HOST=$TARGET_DB_HOST:$TARGET_DB_PORT"
    
    # Vérifications préliminaires
    check_backup_file
    check_db_connection
    
    # Confirmation (sauf mode non-interactif)
    confirm_restore
    
    # Préparation
    create_database_if_not_exists
    close_active_connections
    
    # Restauration
    perform_restore
    verify_restore
    
    log_info "=== Restauration terminée avec succès ==="
    log_warn "Pensez à vérifier les données et mettre à jour les schémas si nécessaire"
    exit 0
}

# Exécuter le script principal
main "$@"
