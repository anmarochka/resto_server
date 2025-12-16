<p align="center">
  <a href="https://nestjs.com" target="_blank" rel="noopener noreferrer">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

<h1 align="center">Hanna API</h1>

<p align="center">
  Backend API for a <strong>restaurant table booking system</strong> with
  <strong>Telegram WebApp authentication</strong> and
  <strong>real-time analytics</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10.x-red" alt="NestJS"/>
  <img src="https://img.shields.io/badge/Node.js-22+-green" alt="Node.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-Real--Time-critical" alt="Redis"/>
  <img src="https://img.shields.io/badge/Docker-ready-blue" alt="Docker"/>
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" alt="License"/>
</p>

---

## Overview

**Hanna API** is a NestJS backend for a restaurant table booking platform.

It provides:
- REST API for Telegram Mini App + admin panel
- Authentication via **Telegram WebApp `initData`** (HMAC verification) → **JWT**
- Role-based authorization (**user / admin**)
- **Real-time analytics** via **Redis + WebSocket (Socket.IO)**
- Persistent storage in **PostgreSQL** using **Prisma ORM**
- Production-like local deployment with **Docker Compose**

---

## Tech Stack

- **NestJS** (controllers / services / repositories, DI)
- **PostgreSQL** (main storage)
- **Prisma ORM** (type-safe DB access) — schema: [`prisma/schema.prisma`](prisma/schema.prisma)
- **Redis** (in-memory aggregation for real-time analytics)
- **Socket.IO** (WebSocket updates)
- **Swagger/OpenAPI** (API docs)
- **Docker / Docker Compose** (deployment)

---

## Requirements

### For Docker (recommended)
- Docker Desktop
- Docker Compose

### For local development
- Node.js **22+**
- npm **9+**
- PostgreSQL + Redis (or run them via Docker)

---

## Environment Variables

1) Copy the template:
```bash
cp .env.example .env
```

2) Fill required variables (see `.env.example` for examples):
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`

> Secrets must not be committed. Keep `.env` local.

---

## Run with Docker (Recommended)

Start PostgreSQL + Redis + API:
```bash
docker compose up -d --build
```

Follow logs:
```bash
docker compose logs -f api
```

Stop:
```bash
docker compose down
```

### Verify
- Health: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/api/docs`

---

## Local Development (without Docker)

Install dependencies:
```bash
npm ci
```

Generate Prisma client:
```bash
npm run prisma:generate
```

Start in dev mode:
```bash
npm run start:dev
```

Build + start production:
```bash
npm run build
npm run start:prod
```

Server runs on: `http://localhost:3000`

---

## API Documentation (Swagger)

Swagger UI is available at:
- `http://localhost:3000/api/docs`

Initialized in:
- [`src/main.ts`](src/main.ts)

---

## Authentication

### Telegram WebApp login
Endpoint:
- `POST /auth/telegram`

What happens:
- Server verifies Telegram WebApp `initData` signature via HMAC-SHA256
- Issues a JWT access token
- Token is used for protected endpoints and WebSocket connection

---

## Real-Time Analytics (Admin)

### WebSocket
- Namespace: `/analytics`
- Access: **admin only** + restaurant isolation by `restaurantId`

Events (server → client):
- `analytics:update`
- `analytics:live_event`
- `analytics:chart_update`

Server implementation:
- [`AnalyticsGateway`](src/modules/analytics/analytics.gateway.ts)
- [`AnalyticsProcessor`](src/modules/analytics/analytics.processor.ts)
- [`AnalyticsSyncService`](src/modules/analytics/analytics.sync.service.ts)

---

## Testing

Unit tests:
```bash
npm run test
```

Test coverage:
```bash
npm run test:cov
```

E2E tests:
```bash
npm run test:e2e
```

> E2E tests use a minimal module to avoid external resource locks.

---

## Useful Endpoints

- `GET /health` — health check
- `POST /auth/telegram` — Telegram login
- `GET /restaurants` — list restaurants
- `GET /halls?restaurantId=...` — halls by restaurant
- `POST /reservations` — create reservation
- `PATCH /reservations/:id/cancel` — cancel reservation
- `GET /analytics/summary?restaurantId=...&date=YYYY-MM-DD` — analytics summary

Full list is available in Swagger.

---

## Deployment Notes

- Multi-stage Docker build
- Prisma client is generated inside the container
- Ready for VPS/cloud deployment
- Horizontal scaling for the real-time pipeline can be upgraded by introducing Redis Pub/Sub/Streams (future improvement)

---

## License

MIT

---

## Author

Developed as part of an academic project (Backend: NestJS / PostgreSQL / Redis).
