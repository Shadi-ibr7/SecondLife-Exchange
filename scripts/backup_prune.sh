#!/bin/bash
#
# Script de nettoyage des anciens backups PostgreSQL
# Supprime les backups de plus de N jours
#
# Utilisation:
#   ./backup_prune.sh [BACKUP_DIR] [RETENTION_DAYS] [DB_NAME]
#
# Si non spécifiés, utilise les valeurs par défaut:
#   BACKUP_DIR=/var/backups/secondlife
#   RETENTION_DAYS=7
#   DB_NAME=secondlife_db
#

set -euo pipefail  # Mode strict

# ============================================
# CONFIGURATION
# ============================================

BACKUP_DIR="${1:-/var/backups/secondlife}"
RETENTION_DAYS="${2:-7}"
DB_NAME="${3:-secondlife_db}"
LOG_FILE="/var/log/secondlife-backup.log"

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

# Vérifier que le répertoire de backup existe
check_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Le répertoire de backup n'existe pas: $BACKUP_DIR"
        exit 1
    fi
}

# Nettoyer les anciens backups
prune_backups() {
    log_info "=== Nettoyage des backups ==="
    log_info "BACKUP_DIR=$BACKUP_DIR, RETENTION=$RETENTION_DAYS jours, DB_NAME=$DB_NAME"
    
    local deleted_count=0
    local freed_space=0
    local total_size=0
    
    # Compter les fichiers avant suppression
    while IFS= read -r backup_file; do
        if [ -f "$backup_file" ]; then
            local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
            total_size=$((total_size + file_size))
        fi
    done < <(find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null)
    
    # Supprimer les fichiers
    while IFS= read -r old_backup; do
        if [ -f "$old_backup" ]; then
            local file_size=$(stat -f%z "$old_backup" 2>/dev/null || stat -c%s "$old_backup" 2>/dev/null || echo "0")
            local filename=$(basename "$old_backup")
            freed_space=$((freed_space + file_size))
            rm -f "$old_backup"
            deleted_count=$((deleted_count + 1))
            log_info "Supprimé: $filename (${file_size} bytes)"
        fi
    done < <(find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null)
    
    # Afficher le résumé
    if [ $deleted_count -gt 0 ]; then
        local freed_mb=$(echo "scale=2; $freed_space / 1024 / 1024" | bc 2>/dev/null || echo "$((freed_space / 1024 / 1024))")
        log_info "Nettoyage terminé: $deleted_count fichier(s) supprimé(s), ${freed_mb} MB libéré(s)"
    else
        log_info "Aucun backup à supprimer (rétention: $RETENTION_DAYS jours)"
    fi
    
    # Afficher les backups restants
    local remaining_count=$(find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -type f | wc -l | tr -d ' ')
    log_info "Backups restants: $remaining_count fichier(s)"
    
    # Lister les backups restants (avec dates)
    if [ $remaining_count -gt 0 ]; then
        log_info "Backups disponibles:"
        find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -type f -exec ls -lh {} \; | awk '{print "  - " $9 " (" $5 ")"}' | tee -a "$LOG_FILE"
    fi
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================

main() {
    check_backup_dir
    prune_backups
    log_info "=== Nettoyage terminé ==="
    exit 0
}

# Exécuter le script principal
main "$@"
