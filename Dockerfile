# ---- deps/build stage ----
FROM node:22.17.1-slim AS builder

WORKDIR /app

# Prisma config требует DATABASE_URL даже для `prisma generate`.
# Это не секрет: для генерации клиента достаточно валидной строки формата URL.
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

# 1) редко меняется — зависимости
COPY package.json package-lock.json ./
RUN npm ci

# 2) часто меняется — исходники
COPY tsconfig*.json nest-cli.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

RUN npm run build
RUN npm prune --omit=dev

# ---- runtime stage ----
FROM node:22.17.1-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app
USER node

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "const http=require('http');http.get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/health'},res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1));"

CMD ["node", "dist/main.js"]