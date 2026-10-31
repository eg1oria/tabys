#!/usr/bin/env bash
# Резервная копия: дамп базы и архив загрузок (фото каталога, вложения заявок).
# Запускать из корня репозитория на сервере; по cron, например ежесуточно:
#   15 3 * * * cd /srv/tabys && ./deploy/backup.sh >> backups/backup.log 2>&1
# Хранит последние KEEP копий (по умолчанию 14). Копии лежат на том же
# сервере — выносите их куда-нибудь ещё (rclone, scp), иначе это не бэкап.
set -euo pipefail

KEEP="${KEEP:-14}"
DIR="backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DIR"

docker compose exec -T db pg_dump -U tabys -d tabys --format=custom \
  > "$DIR/db-$STAMP.dump"

# Том uploads читаем через контейнер бэкенда: путь тома на хосте знать не нужно.
docker compose exec -T backend tar -C /app/uploads -czf - . \
  > "$DIR/uploads-$STAMP.tar.gz"

ls -1t "$DIR"/db-*.dump | tail -n +"$((KEEP + 1))" | xargs -r rm --
ls -1t "$DIR"/uploads-*.tar.gz | tail -n +"$((KEEP + 1))" | xargs -r rm --

echo "$(date "+%Y-%m-%dT%H:%M:%S%z") готово: $DIR/db-$STAMP.dump, $DIR/uploads-$STAMP.tar.gz"
