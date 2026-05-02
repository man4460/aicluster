# syntax=docker/dockerfile:1
# Next.js + Prisma + MySQL — รันคู่กับ docker-compose (service db)
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY scripts ./scripts
# prisma generate (postinstall) โหลด prisma.config.ts — ต้องมี DATABASE_URL เป็นค่าหลอก (ไม่ต่อ DB จริงตอน generate)
ENV DATABASE_URL="mysql://root:build@127.0.0.1:3306/placeholder"
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="mysql://root:build@127.0.0.1:3306/placeholder"
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

COPY --chown=nextjs:nodejs docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
