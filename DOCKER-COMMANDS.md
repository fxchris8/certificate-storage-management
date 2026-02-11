# Certificate Storage Management - Docker Commands Reference

## Quick Commands

### Production Mode

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose stop

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Remove all containers
docker-compose down

# Remove containers and volumes (⚠️ deletes database)
docker-compose down -v
```

### Development Mode

```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Build and start dev mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop dev mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### Individual Services

```bash
# Start only database
docker-compose up -d postgres

# Start backend only (requires database)
docker-compose up -d postgres backend

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d certificate_db

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma Client
docker-compose exec backend npx prisma generate

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Backup database
docker-compose exec postgres pg_dump -U postgres certificate_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -T postgres psql -U postgres certificate_db < backup.sql

# Reset database (⚠️ deletes all data)
docker-compose exec backend npx prisma migrate reset
```

### Logs & Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f ocr

# View last 100 lines
docker-compose logs --tail=100 backend

# Check container status
docker-compose ps

# Check resource usage
docker stats
```

### Troubleshooting

```bash
# Restart all services
docker-compose restart

# Rebuild without cache
docker-compose build --no-cache

# Prune unused Docker resources
docker system prune -a

# Check container health
docker-compose ps
docker inspect certificate-backend | grep -A 10 Health

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec ocr bash

# View container environment variables
docker-compose exec backend env
```

### Cleaning Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# Clean up Docker system
docker system prune -a --volumes
```

### Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run backend tests in CI mode
docker-compose exec backend npm run test:ci

# Run linting
docker-compose exec backend npm run lint
```

### Port Mapping Reference

| Service    | Container Port | Host Port (default) | URL                       |
|------------|----------------|---------------------|---------------------------|
| Frontend   | 80 (prod)      | 3000                | http://localhost:3000     |
| Frontend   | 5173 (dev)     | 5173                | http://localhost:5173     |
| Backend    | 5000           | 5000                | http://localhost:5000     |
| OCR        | 8000           | 8000                | http://localhost:8000     |
| PostgreSQL | 5432           | 5432                | localhost:5432            |

### Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Required variables:
- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret (min 32 characters)
- `WHITE_LIST_URLS` - CORS whitelist

### Health Checks

```bash
# Backend
curl http://localhost:5000/heartbeat

# Frontend
curl http://localhost:3000

# OCR
curl http://localhost:8000/health

# Database
docker-compose exec postgres pg_isready -U postgres
```

### Windows-Specific Commands

```batch
REM Use start.bat script
start.bat

REM Or use docker-compose directly
docker-compose up -d

REM View logs in PowerShell
docker-compose logs -f
```

### Performance Tuning

```bash
# Limit container resources (add to docker-compose.yml)
# Example:
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           cpus: '0.5'
#           memory: 512M

# Monitor resource usage
docker stats

# Check disk usage
docker system df
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/Mac

# Change port in .env file
BACKEND_PORT=5001
```

### Database Connection Failed
```bash
# Check if database is ready
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Check database health
docker-compose exec postgres pg_isready
```

### Build Failed
```bash
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Container Keeps Restarting
```bash
# Check logs for errors
docker-compose logs backend

# Check health status
docker-compose ps
```
