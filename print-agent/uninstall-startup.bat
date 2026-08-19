@echo off
set SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\POS_Print_Agent.lnk

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%"
    echo [SUCCESS] Removed POS Print Agent from Windows Startup.
) else (
    echo POS Print Agent shortcut not found in startup.
)
pause
