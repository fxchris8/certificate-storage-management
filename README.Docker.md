# Docker Setup Guide

Panduan untuk menjalankan aplikasi Certificate Storage Management menggunakan Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) atau Docker Engine (Linux)
- Docker Compose v2.0+

## Quick Start

### 1. Setup Environment Variables

Copy file `.env.example` menjadi `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

**Penting:** Ubah nilai berikut di file `.env`:
- `POSTGRES_PASSWORD`: Password PostgreSQL yang aman
- `JWT_SECRET`: Secret key minimal 32 karakter untuk JWT

### 2. Build dan Jalankan Semua Services

```bash
docker-compose up -d
```

Perintah ini akan:
- Build image untuk backend, frontend, dan OCR service
- Download PostgreSQL image
- Membuat network dan volume
- Menjalankan semua container

### 3. Cek Status Container

```bash
docker-compose ps
```

### 4. Lihat Logs

```bash
# Semua services
docker-compose logs -f

# Service tertentu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f ocr
```

## Akses Aplikasi

Setelah semua container berjalan:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **OCR Service**: http://localhost:8000
- **PostgreSQL**: localhost:5432

## Commands

### Stop Semua Services
```bash
docker-compose stop
```

### Start Semua Services
```bash
docker-compose start
```

### Restart Service Tertentu
```bash
docker-compose restart backend
```

### Rebuild Service Tertentu
```bash
docker-compose up -d --build backend
```

### Hapus Semua Container (data PostgreSQL tetap ada)
```bash
docker-compose down
```

### Hapus Semua Container dan Volume (data PostgreSQL hilang)
```bash
docker-compose down -v
```

## Database Management

### Jalankan Prisma Migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Prisma Studio
```bash
docker-compose exec backend npx prisma studio
```

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U postgres -d certificate_db
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U postgres certificate_db > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U postgres certificate_db < backup.sql
```

## Development Mode

Untuk development dengan hot reload, gunakan `docker-compose.dev.yml`:

```bash
# Jalankan dalam development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Atau build ulang dengan dev config
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Development mode features:
- ✅ Hot reload untuk backend (nodemon)
- ✅ Hot reload untuk frontend (Vite HMR)
- ✅ Hot reload untuk OCR service (uvicorn reload)
- ✅ Source code di-mount sebagai volume
- ✅ Perubahan code langsung terlihat tanpa rebuild

**Note:** Frontend akan berjalan di port 5173 (Vite default) dalam dev mode.

## Troubleshooting

### Container tidak bisa start
```bash
# Cek logs
docker-compose logs backend

# Restart semua
docker-compose restart
```

### Port sudah digunakan
Edit `.env` dan ubah port yang conflict:
```env
BACKEND_PORT=5001
FRONTEND_PORT=3001
```

### Database connection error
Pastikan PostgreSQL sudah ready:
```bash
docker-compose logs postgres
```

### Clear cache dan rebuild
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Production Notes

Untuk production deployment:

1. Gunakan `.env` yang terpisah untuk production
2. Set `NODE_ENV=production`
3. Gunakan secrets management (bukan `.env` file)
4. Set resource limits di `docker-compose.yml`
5. Enable SSL/TLS untuk komunikasi
6. Setup backup otomatis untuk database
7. Gunakan Docker Swarm atau Kubernetes untuk orchestration

## Architecture

```
┌─────────────┐
│   Frontend  │ :3000 (Nginx)
│  (React)    │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
┌──────▼──────┐  ┌───▼────────┐
│   Backend   │  │    OCR     │
│  (Express)  │  │  (FastAPI) │
│     :5000   │  │    :8000   │
└──────┬──────┘  └────────────┘
       │
┌──────▼──────┐
│  PostgreSQL │
│    :5432    │
└─────────────┘
```

## Health Checks

Semua services memiliki health checks:

```bash
# Cek health status
docker-compose ps

# Atau akses health endpoints
curl http://localhost:5000/heartbeat  # Backend
curl http://localhost:3000            # Frontend
curl http://localhost:8000/health     # OCR
```

## Support

Untuk issue atau pertanyaan, silakan buka issue di repository ini.
