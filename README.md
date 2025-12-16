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
