#!/bin/bash
set -euo pipefail
# Sincroniza backups para servidor remoto via rsync + SSH
REMOTE_USER="${BACKUP_REMOTE_USER}"
REMOTE_HOST="${BACKUP_REMOTE_HOST}"
REMOTE_PATH="${BACKUP_REMOTE_PATH:-/backups/integrity}"

rsync -avz --delete \
  --rsh="ssh -i /root/.ssh/backup_key -o StrictHostKeyChecking=no" \
  /backups/ \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

echo "[$(date)] Backup offsite concluído para $REMOTE_HOST"
