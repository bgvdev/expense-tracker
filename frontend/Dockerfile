FROM node:20-alpine AS development

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --prefer-offline || npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Production build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline
COPY . .

# The production stage copies /app/public unconditionally; ensure it exists even
# when the project ships no static assets (Docker COPY cannot be conditional).
RUN mkdir -p public

# BACKEND_URL is baked into the /api/* rewrite by next.config.ts at build time,
# so it must be a build arg — setting it at runtime has no effect on the rewrite.
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# next.config.ts output: "standalone" copies only what's needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
