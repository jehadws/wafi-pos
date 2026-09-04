@echo off
setlocal
echo =======================================================
echo   Subul Print Agent - Windows Startup Installer
echo =======================================================
echo.

set AGENT_DIR=%~dp0
set SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\POS_Print_Agent.lnk
set VBS_TARGET=%AGENT_DIR%start-hidden.vbs

echo Creating startup shortcut at:
echo %SHORTCUT_PATH%
echo.

powershell -NoProfile -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = 'wscript.exe'; $Shortcut.Arguments = '\"%VBS_TARGET%\"'; $Shortcut.WorkingDirectory = '%AGENT_DIR%'; $Shortcut.Description = 'Subul Print Agent'; $Shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] POS Print Agent is now configured to start automatically with Windows!
    echo.
    echo Starting Print Agent now in background...
    wscript "%VBS_TARGET%"
    echo Print Agent is running on http://127.0.0.1:8189
) else (
    echo [ERROR] Failed to create startup shortcut.
)

echo.
pause
