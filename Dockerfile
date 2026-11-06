# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Alat untuk menyiapkan database dan akun pertama.
# Tahap ini dijalankan terpisah dari website.
FROM dependencies AS admin-tools
COPY --chown=node:node . .
RUN chown node:node /app
ENV NODE_ENV=production
USER node
CMD ["node", "--import", "tsx", "scripts/create-super-admin.ts", "--check"]

FROM dependencies AS builder
COPY . .
ENV NODE_ENV=production

# Alamat sementara tanpa kredensial produksi.
# Build tidak boleh bergantung pada database yang sedang aktif.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:1/build npm run build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    MEDIA_UPLOAD_DIR=/data/media \
    DOKUMEN_UPLOAD_DIR=/data/dokumen

# Dibutuhkan untuk membuat gambar preview PDF.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        poppler-utils \
        curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/.next /data/media /data/dokumen \
    && chown -R node:node /app/.next /data \
    && chmod 700 /data/media /data/dokumen

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
