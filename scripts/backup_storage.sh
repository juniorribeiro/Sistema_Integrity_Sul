#!/bin/bash
set -euo pipefail
BACKUP_DIR="/backups/storage"
DATE=$(date +%Y%m%d)
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

# Copia dados do volume Garage para o diretório de backup
docker run --rm \
  -v integrity_garage_data:/source:ro \
  -v /backups/storage:/backup \
  alpine \
  tar czf "/backup/garage_${DATE}.tar.gz" -C /source .

# Remove backups antigos
find "$BACKUP_DIR" -name "garage_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup Garage concluído: garage_${DATE}.tar.gz"
