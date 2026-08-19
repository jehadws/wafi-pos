@echo off
title JGREM POS Print Agent
cd /d "%~dp0"

echo ====================================================
echo   Starting JGREM POS Windows Print Agent...
echo ====================================================

:: Check if port 8189 is already in use and free it if needed
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8189" ^| findstr "LISTENING"') do (
    echo Port 8189 is in use by PID %%a. Terminating previous instance...
    taskkill /F /PID %%a >nul 2>&1
)

node server.js
pause
