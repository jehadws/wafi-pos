@echo off
echo ====================================================
echo   Stopping JGREM POS Windows Print Agent...
echo ====================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8189" ^| findstr "LISTENING"') do (
    echo Terminating Print Agent PID %%a on port 8189...
    taskkill /F /PID %%a >nul 2>&1
)

echo POS Print Agent stopped.
echo.
pause
