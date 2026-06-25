#!/bin/bash
set -euo pipefail
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

docker exec integrity_postgres pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-password \
  | gzip > "$BACKUP_DIR/backup_${DATE}.sql.gz"

# Remove backups antigos
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup PostgreSQL concluído: backup_${DATE}.sql.gz"
