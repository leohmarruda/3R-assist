@echo off
cd /d "%~dp0frontend"

if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        pause
        exit /b 1
    )
)

echo Starting frontend dev server...
call npm run dev
