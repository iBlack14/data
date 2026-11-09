# Imagen base oficial de Node.js 22 LTS
FROM node:22-bookworm-slim

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código fuente del proyecto
COPY . .

# Guardar una copia semilla de la base de datos para inicializar volúmenes vacíos
RUN if [ -d ".wrangler" ]; then cp -r .wrangler /app/.wrangler_seed; fi

# Configurar permisos para el script de entrada
RUN chmod +x /app/docker-entrypoint.sh

# Exponer el puerto principal del CRM
EXPOSE 5173

# Variables de entorno
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173
ENV VINEXT_NO_DEV_LOCK=1
ENV NODE_OPTIONS="--max-old-space-size=512"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
