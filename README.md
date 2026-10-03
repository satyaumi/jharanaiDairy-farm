# Jharanai Dairy Farm Management Platform

[![Production Architecture](https://img.shields.io/badge/Architecture-Vercel%20%2B%20Render%20%2B%20PostgreSQL-emerald.svg)](#target-production-architecture)
[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.4.3%20(Java%2023)-green.svg)](backend-dairy/)
[![Vite + React](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%20%2B%20TanStack-blue.svg)](frontend-dairy/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Multi--Stage-2496ED.svg)](backend-dairy/Dockerfile)

Enterprise commercial dairy farm management system designed for operational tracking, herd health lifecycle management, real-time milking and feed logistics, tenant auditability, automated Excel/CSV imports, and comprehensive multi-format report exports (CSV, XLSX, PDF).

---

## Table of Contents

- [Target Production Architecture](#target-production-architecture)
- [Monorepo Project Structure](#monorepo-project-structure)
- [Technology Stack](#technology-stack)
- [Single-Farm Production Configuration](#single-farm-production-configuration)
- [Local Development Setup](#local-development-setup)
- [Docker & Containerization](#docker--containerization)
- [Database Migrations & Schema](#database-migrations--schema)
- [Production Deployment Guide](#production-deployment-guide)
  - [Step 1: Render PostgreSQL Database](#step-1-render-postgresql-database)
  - [Step 2: Render Dockerized Backend Web Service](#step-2-render-dockerized-backend-web-service)
  - [Step 3: Vercel Frontend Deployment](#step-3-vercel-frontend-deployment)
  - [Step 4: Resolve Circular URLs & CORS](#step-4-resolve-circular-urls--cors)
- [Environment Variables Reference](#environment-variables-reference)
- [Authentication & Role-Based Access Control](#authentication--role-based-access-control)
- [Data Import & Export Architecture](#data-import--export-architecture)
- [Health Check & Monitoring](#health-check--monitoring)
- [Troubleshooting](#troubleshooting)

---

## Target Production Architecture

```
                                GitHub Repository
                               (satyaumi/jharanaiDairy-farm)
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
             [frontend-dairy]                        [backend-dairy]
                    │                                       │
              Vercel Edge                             Docker Container
        (https://<project>.vercel.app)                      │
                    │                              Render Web Service
                    │                        (https://<project>.onrender.com)
                    │                                       │
                    │   CORS / REST Bearer JWT              │
                    └───────────────────────────────────────┤
                                                            │ JDBC (HikariCP)
                                                            ▼
                                                    Render PostgreSQL
                                                  (External / Internal)
```

- **Frontend**: Single-Page / SSR Application hosted globally on **Vercel**.
- **Backend**: Containerized Spring Boot 3.4.3 Web Service running on **Render**.
- **Database**: Managed **Render PostgreSQL** with Flyway version-controlled migrations.

---

## Monorepo Project Structure

```
jharanaiDairy-farm/
│
├── frontend-dairy/                # Frontend Application (Vite + React + TanStack)
│   ├── src/
│   │   ├── components/            # UI components (auth, dashboard, modules)
│   │   ├── context/               # AuthContext & state providers
│   │   ├── lib/                   # API client (api-config.ts) & utilities
│   │   ├── routes/                # TanStack file-based routes
│   │   └── services/              # API Service boundaries (auth, farm, users, import, export)
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
├── backend-dairy/                 # Backend API (Spring Boot 3.4.3, Java 23)
│   ├── src/
│   │   ├── main/java/com/dairyfarm/app/
│   │   │   ├── common/            # Security, JWT, CORS, Auditing, Multi-tenancy
│   │   │   │   └── config/        # DatabaseConfig, WebConfig, SecurityConfig
│   │   │   └── modules/           # Domain modules (animal, auth, dataimport, farm, feed, health, milk, report, user)
│   │   └── main/resources/
│   │       ├── application.yml    # Dynamic production configuration
│   │       └── db/migration/      # Flyway migrations (V1 to V7)
│   ├── Dockerfile                 # Multi-stage production container build
│   ├── pom.xml
│   └── .env.example
│
├── docker-compose.yml             # Local multi-service development environment
├── .gitignore                     # Strict exclusion of secrets, target, and node_modules
└── README.md
```

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Radix UI, TanStack Router / Start.
- **Backend**: Java 23, Spring Boot 3.4.3, Spring Security, Spring Data JPA, Hibernate, JJWT (0.12.6).
- **Document Processing**: Apache POI (5.3.0) for Excel (.xlsx/.xls), OpenPDF (2.0.3) for PDF reports.
- **Database**: PostgreSQL 16+, Flyway DB migration engine.
- **Container**: Eclipse Temurin 23 JRE Alpine (non-root runner, dynamic `$PORT` binding).

---

## Single-Farm Production Configuration

The application is tuned specifically for **Jharanai Farm**:
- Multi-farm creation and farm-switchers are hidden in the production UI.
- All pre-seeded animals, health, feeding, and milking records are scoped to **Jharanai Farm** (`JHF-01`).
- Initial Farm Owner credentials can be seeded or modified at deployment time using `INITIAL_OWNER_PASSWORD`.

---

## Local Development Setup

### Prerequisites
- Node.js 20+ & npm
- JDK 23
- Apache Maven 3.9+
- PostgreSQL 16+ (or Docker)

### 1. Database Setup
Create a PostgreSQL database named `Dairy-farm`:
```sql
CREATE DATABASE "Dairy-farm";
```

### 2. Backend Setup
```bash
cd backend-dairy
# Copy and configure local environment
cp .env.example .env
# Run database migrations and start server on port 8085
mvn spring-boot:run
```
The backend starts at `http://localhost:8085`. Verify health:
```bash
curl http://localhost:8085/health
# Response: {"status":"ok","service":"dairy-farm-backend"}
```

### 3. Frontend Setup
```bash
cd frontend-dairy
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Docker & Containerization

### Build Backend Image
```bash
cd backend-dairy
docker build -t jharanai-backend:latest .
```

### Run Backend Container
```bash
docker run -d \
  -p 8085:8085 \
  -e PORT=8085 \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://host.docker.internal:5432/Dairy-farm" \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long \
  --name jharanai-backend \
  jharanai-backend:latest
```

### Local Docker Compose
To run PostgreSQL and Backend together:
```bash
docker-compose up -d
```

---

## Database Migrations & Schema

Flyway automates schema initialization upon backend startup.

| Migration | Purpose | Key Tables Created / Modified |
| :--- | :--- | :--- |
| `V1` | Core Tenants & Users | `farms`, `users` |
| `V2` | Animal Herd Lifecycle | `animals`, `pens`, `lactation_records`, `treatments` |
| `V3` | Historical Audit Trail | `animal_history` |
| `V4` | System Audit Logging | `audit_logs` |
| `V5` | Seed Baseline Herd | Seeds initial Jharanai Farm data & animals |
| `V6` | Operational & Team Metadata | Adds `employee_id`, `department`, `shift`, rebrands to Jharanai Farm |
| `V7` | Milking, Feed & Import Batches | `milk_records`, `feed_records`, `import_batches` |

---

## Production Deployment Guide

### Step 1: Render PostgreSQL Database
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **PostgreSQL**.
3. Name: `jharanai-postgres`
4. Database: `jharanai_db`
5. User: `jharanai_user`
6. Region: Select closest region (e.g. `Oregon` or `Frankfurt`).
7. Tier: Free or Starter.
8. Once provisioned, copy the **Internal Database URL** (for Render services in the same region) or **External Database URL**.

---

### Step 2: Render Dockerized Backend Web Service
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/satyaumi/jharanaiDairy-farm.git`.
3. Configure the service:
   - **Name**: `jharanai-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend-dairy`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (or `backend-dairy/Dockerfile` if Root Directory is blank)
4. Set Environment Variables in Render:
   - `DATABASE_URL`: Your Render PostgreSQL connection string (`postgres://...`). The backend automatically converts this to JDBC format with `sslmode=require`.
   - `PORT`: (Provided by Render automatically, or set to `8085`).
   - `JWT_SECRET`: A secure random string (minimum 32 characters).
   - `JWT_EXPIRATION_MS`: `86400000` (24 hours).
   - `INITIAL_OWNER_PASSWORD`: Choose a secure password for the initial Farm Owner (`priya`).
   - `FRONTEND_URL`: Leave blank or set to a placeholder until Vercel URL is generated.
   - `CORS_ORIGINS`: Leave blank or set to a placeholder.
5. Click **Create Web Service**.
6. When deployment finishes, copy your Render URL: `https://<your-backend-subdomain>.onrender.com`.
7. Verify backend health:
   ```bash
   curl https://<your-backend-subdomain>.onrender.com/health
   # Response: {"status":"ok","service":"dairy-farm-backend"}
   ```

---

### Step 3: Vercel Frontend Deployment
1. Go to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import `satyaumi/jharanaiDairy-farm`.
4. Configure Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: Click *Edit* and select `frontend-dairy`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.output/public`
5. Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: `https://<your-backend-subdomain>.onrender.com`
6. Click **Deploy**.
7. Once deployed, copy your production Vercel URL (e.g. `https://jharanai-dairy.vercel.app`).

---

### Step 4: Resolve Circular URLs & CORS
1. Return to [Render Dashboard](https://dashboard.render.com) → `jharanai-backend` → **Environment**.
2. Update:
   - `FRONTEND_URL`: `https://<your-vercel-domain>.vercel.app`
   - `CORS_ORIGINS`: `https://<your-vercel-domain>.vercel.app`
3. Click **Save Changes** (triggers an instant rolling redeploy).
4. Both services are now connected securely!

---

## Environment Variables Reference

### Backend (Render)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Render PostgreSQL Connection URI | `postgres://user:pass@dpg-xxx.render.com/jharanai_db` |
| `PORT` | Web server port provided by Render | Render dynamic port (default: `8085`) |
| `JWT_SECRET` | 256-bit+ HMAC secret key | Random 32+ character string |
| `JWT_EXPIRATION_MS` | JWT expiration duration in milliseconds | `86400000` (24h) |
| `FRONTEND_URL` | Production Vercel URL for CORS | `https://jharanai-dairy.vercel.app` |
| `CORS_ORIGINS` | Comma-delimited permitted CORS origins | `https://jharanai-dairy.vercel.app` |
| `INITIAL_OWNER_PASSWORD`| Initial Farm Owner production password | Strong private passphrase |

### Frontend (Vercel)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Public Render backend root URL | `https://jharanai-backend.onrender.com` |

---

## Authentication & Role-Based Access Control

The platform enforces strict Spring Security method-level and route-level authorization:

- **Farm Owner (`OWNER`)**: Full administrative access across all records, finances, team management, and settings.
- **Operations Manager (`MANAGER`)**: Herd records, animal medical logs, feed logistics, imports, and exports.
- **Milking & Field Worker (`WORKER`)**: Daily milk logs, cow checkups, and task execution. Restricted from financial reports, team invitations, and tenant settings.
- **Platform Admin (`ADMIN`)**: System-wide tenant infrastructure.

---

## Data Import & Export Architecture

### In-Memory Streaming File Import
- **CSV & Excel (.xlsx, .xls)** parsing performed dynamically in memory using Apache POI.
- Column auto-detection, schema verification, previewing, and transactional bulk upsert into PostgreSQL.
- Ephemeral container filesystem is never used for file persistence.

### Multi-Format Report Export
- Real-time generation of CSV, Excel spreadsheets, and high-resolution PDF documents.
- Includes Jharanai Farm letterhead, metrics, and audit timestamps.
- Browser download triggered directly via `Content-Disposition` attachments with CORS exposed headers.

---

## Health Check & Monitoring

- **Public Health Endpoint**: `GET /health` and `GET /api/health`
  ```json
  {
    "status": "ok",
    "service": "dairy-farm-backend"
  }
  ```
- **Spring Actuator**: `GET /actuator/health`
- **Swagger OpenAPI Documentation**: `GET /swagger-ui.html`

---

## Troubleshooting

1. **CORS Blocked in Browser Console**:
   - Ensure Render environment variable `FRONTEND_URL` exactly matches the Vercel URL (including `https://` without a trailing slash).
2. **Database Connection Refused**:
   - Check if you are using Render's **Internal Database URL** for services located in the same Render region, or **External Database URL** if connecting from outside.
   - The backend's `DatabaseConfig` automatically enforces `sslmode=require` for non-localhost hosts.
3. **Report Export File Name Missing in Browser**:
   - `WebConfig.java` explicitly exposes the `Content-Disposition` header in CORS responses. Ensure your client uses `response.headers.get("Content-Disposition")`.
