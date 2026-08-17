FROM oven/bun:1.3.14-alpine

WORKDIR /app

COPY --chown=bun:bun package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY --chown=bun:bun . .

USER bun
EXPOSE 8080

CMD ["bun", "run", "start"]
