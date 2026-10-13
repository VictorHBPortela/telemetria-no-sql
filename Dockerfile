# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

FROM base AS development-dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS production-dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS development
ENV NODE_ENV=development \
    PORT=8080
COPY --from=development-dependencies /app/node_modules ./node_modules
COPY --chown=bun:bun . .
USER bun
EXPOSE 8080
CMD ["bun", "run", "start"]

FROM base AS runtime
ARG BUILD_SHA=development
ENV NODE_ENV=production \
    PORT=8080 \
    APP_VERSION=${BUILD_SHA}
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=bun:bun package.json bun.lock ./
COPY --chown=bun:bun src ./src
USER bun
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD bun -e "const r=await fetch('http://127.0.0.1:8080/health');process.exit(r.ok?0:1)"
CMD ["bun", "run", "start"]
