@echo off
REM Script untuk memulai aplikasi dengan Docker Compose

echo ========================================
echo Certificate Storage Management
echo Docker Compose Setup
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [WARNING] File .env tidak ditemukan!
    echo.
    echo Membuat .env dari .env.example...
    copy .env.example .env
    echo.
    echo [PENTING] Silakan edit file .env dan ubah:
    echo   - POSTGRES_PASSWORD
    echo   - JWT_SECRET ^(minimal 32 karakter^)
    echo.
    pause
    notepad .env
    echo.
)

echo [1/4] Menghentikan container yang sedang berjalan...
docker-compose down

echo.
echo [2/4] Building images...
docker-compose build

echo.
echo [3/4] Menjalankan semua services...
docker-compose up -d

echo.
echo [4/4] Menunggu services siap...
timeout /t 10 /nobreak > NUL

echo.
echo ========================================
echo Status Services:
echo ========================================
docker-compose ps

echo.
echo ========================================
echo Aplikasi siap digunakan!
echo ========================================
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:5000
echo OCR:       http://localhost:8000
echo PostgreSQL: localhost:5432
echo ========================================
echo.
echo Untuk melihat logs: docker-compose logs -f
echo Untuk menghentikan: docker-compose stop
echo ========================================
echo.
pause
