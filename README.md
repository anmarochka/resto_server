<p align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

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

## Description

**Hanna API** is a backend service built with **NestJS** for a restaurant table booking platform.

The system provides:
- REST API for a Telegram Mini App and admin panel
- Authentication via **Telegram WebApp initData**
- Role-based access control (user / admin)
- Real-time analytics via **Redis + WebSockets**
- Persistent storage in **PostgreSQL** using **Prisma ORM**
- Fully containerized deployment with **Docker Compose**

---

## Architecture Overview

- **NestJS** — modular backend architecture (controllers, services, repositories)
- **PostgreSQL** — main data storage (restaurants, halls, tables, reservations)
- **Prisma ORM** — type-safe database access
- **Redis** — real-time metrics aggregation
- **Socket.IO** — live analytics updates for admin dashboard
- **Swagger (OpenAPI)** — API documentation
- **Docker** — production-like local environment

---

## Project Setup

### Requirements
- Node.js **22+**
- Docker & Docker Compose (recommended)

---

## Environment Configuration

1. Copy environment template:
```bash
cp .env.example .env


Required variables:

DATABASE_URL

JWT_SECRET

TELEGRAM_BOT_TOKEN

REDIS_URL

See .env.example for details.

Running with Docker (Recommended)

Starts PostgreSQL + Redis + API:

docker compose up -d --build


Logs:

docker compose logs -f api


Stop:

docker compose down

Check:

Health: http://localhost:3000/health

Swagger: http://localhost:3000/api/docs

Local Development (without Docker)
Install dependencies
npm ci

Generate Prisma client
npm run prisma:generate

Run application
# development
npm run start:dev

# production
npm run build
npm run start:prod


Server runs on http://localhost:3000.

API Documentation (Swagger)

Swagger UI:

GET /api/docs


Initialized in:

src/main.ts

Authentication

Telegram WebApp authentication (initData)

Signature verification via HMAC-SHA256

JWT access tokens

Role-based authorization (user, admin)

Real-Time Analytics

Redis for in-memory aggregation

Event-driven analytics pipeline

WebSocket namespace: /analytics

Admin-only access

Live updates:

reservation events

daily/hourly statistics

hall popularity

live event feed

Server implementation:

AnalyticsGateway

AnalyticsProcessor

AnalyticsSyncService

Testing
Unit tests
npm run test

Test coverage
npm run test:cov

E2E tests
npm run test:e2e


E2E tests use a minimal module to avoid external resource locks.

Useful Endpoints

GET /health — service health check

POST /auth/telegram — Telegram login

GET /restaurants — list restaurants

GET /halls?restaurantId=...

POST /reservations

PATCH /reservations/:id/cancel

GET /analytics/summary

Deployment Notes

Multi-stage Docker build

Prisma client generated inside container

Ready for cloud or VPS deployment

Horizontal scaling requires Redis Pub/Sub (future improvement)

License

This project is licensed under the MIT License.

Author

Developed as part of an academic project
Backend Architecture & Implementation — NestJS / PostgreSQL / Redis
