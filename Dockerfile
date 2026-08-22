# ============ Deps stage ============
# Node.js 22 LTS là bản được Next.js 16.3 (mới nhất) khuyến nghị chính thức
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ============ Build stage ============
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Giới hạn RAM cho chính quá trình build Next.js (webpack build rất dễ spike RAM,
# đặc biệt nguy hiểm nếu build trực tiếp trên VPS 4GB — xem ghi chú bên dưới)
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============ Runtime stage ============
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# BẮT BUỘC: next.config.js phải có `output: 'standalone'`
# để .next/standalone chứa server.js gọn nhẹ, không cần copy node_modules đầy đủ
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