# ============ Deps stage ============
FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# ============ Build stage ============
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Arguments (Next.js public env required at build time)
ARG NEXT_PUBLIC_BACKEND_API=https://api.minhkhoatravel.vn
ENV NEXT_PUBLIC_BACKEND_API=$NEXT_PUBLIC_BACKEND_API
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ============ Runtime stage ============
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --spider -q http://localhost:3000 || exit 1

CMD ["node", "server.js"]