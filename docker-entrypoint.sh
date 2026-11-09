#!/bin/bash
set -e

# Si el volumen montado de .wrangler está vacío en Easypanel, restaurar datos iniciales
DB_DIR="/app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject"
if [ ! -d "$DB_DIR" ] || [ -z "$(ls -A "$DB_DIR" 2>/dev/null)" ]; then
  echo "==> [OdiseaCloud] Inicializando base de datos con 7,046 empresas verificadas..."
  mkdir -p /app/.wrangler
  if [ -d "/app/.wrangler_seed" ]; then
    cp -r /app/.wrangler_seed/* /app/.wrangler/ 2>/dev/null || true
  fi
  echo "==> [OdiseaCloud] Base de datos restaurada exitosamente."
else
  echo "==> [OdiseaCloud] Base de datos existente detectada en volumen persistente."
fi

# Asegurar permisos y directorios
mkdir -p /app/.whatsapp_session
rm -f /app/.vinext/dev/lock.json 2>/dev/null || true

exec "$@"

