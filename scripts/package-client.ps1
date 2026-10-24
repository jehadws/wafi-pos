#Requires -Version 5.1
<#
.SYNOPSIS
    Builds the Subul client distribution package (protected, self-contained).

.DESCRIPTION
    Automated build & packaging pipeline for closed-network client deployments:

      1. Compiles the production frontend bundle        (npm run build)
      2. Stages a clean copy of the project             (no .git, no dev/test files,
                                                           no .env*, no private keys,
                                                           no dev SQLite database)
      3. Installs production PHP dependencies           (composer install --no-dev
                                                           --optimize-autoloader)
      4. Obfuscates the licensing files with YAK Pro - Php Obfuscator (free)
         - operates on STAGING COPIES ONLY; repository sources are never modified
         - files: LicenseVerifierService.php, HwidService.php, LicenseMiddleware.php
      5. Adds client bootstrap files                    (start-pos.bat, .env.production,
                                                           README-DEPLOY.txt)
      6. Emits a production-ready ZIP                   dist/subul-pos-client-<version>.zip

.PARAMETER Version
    Package version label. Default: latest git tag (git describe), else timestamp.

.PARAMETER YakproPath
    Path to yakpro-po.php, or to the folder that contains it.
    Fallback order: -YakproPath / $env:SUBUL_YAKPRO_PATH / <repo>\tools\yakpro-po
    Get the tool (free):  git clone https://github.com/pk-fr/yakpro-po tools/yakpro-po

.PARAMETER PhpBinary
    PHP CLI binary used for the Yakpro-Po obfuscation step (default "php").

.PARAMETER OutputRoot
    Where dist\ output is written. Default: <repo>\dist

.PARAMETER SkipFrontendBuild
    Reuse the existing public/build assets instead of running npm.

.PARAMETER SkipObfuscation
    Force-skip the Yakpro-Po step.

.EXAMPLE
    .\scripts\package-client.ps1
    .\scripts\package-client.ps1 -Version 1.0.0 -YakproPath C:\tools\yakpro-po
#>
[CmdletBinding()]
param(
    [string] $Version              = '',
    [string] $YakproPath           = $env:SUBUL_YAKPRO_PATH,
    [string] $PhpBinary            = 'php',
    [string] $OutputRoot           = '',
    [switch] $SkipFrontendBuild,
    [switch] $SkipObfuscation,
    [switch] $SkipComposerInstall
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

function Write-Step  { param($m) Write-Host "`n== $m" -ForegroundColor Cyan }
function Write-Ok    { param($m) Write-Host "   [ok] $m" -ForegroundColor Green }
function Write-Warn2 { param($m) Write-Host "   [!!] $m" -ForegroundColor Yellow }

function Assert-Command {
    param([string] $Name, [string] $Hint)
    if ($null -eq (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required tool '$Name' was not found in PATH. $Hint"
    }
}

function Copy-TreeFile {
    # Copies $SourceFile into $DestRoot preserving the path relative to $BaseDir.
    param([string] $BaseDir, [string] $SourceFile, [string] $DestRoot)
    $rel = $SourceFile.Substring($BaseDir.Length).TrimStart('\', '/')
    $dest = Join-Path $DestRoot $rel
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Copy-Item -Path $SourceFile -Destination $dest -Force
}

# ─────────────────────────────────────────────────────────────────────────────
# 0. Preflight
# ─────────────────────────────────────────────────────────────────────────────

Write-Step "Subul client packaging — repo: $RepoRoot"

if (-not $Version -or $Version -eq '') {
    $tag = git describe --tags --abbrev=0 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($tag)) {
        $tag = (Get-Date -Format 'yyyyMMdd-HHmm')
    }
    $Version = "$tag".Trim()
}

$DistDir = if ($OutputRoot -ne '') { $OutputRoot } else { Join-Path $RepoRoot 'dist' }
$Staging = Join-Path $DistDir ("subul-pos-client-" + $Version)
$ZipPath = Join-Path $DistDir ("subul-pos-client-" + $Version + ".zip")

if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $Staging -Force | Out-Null
New-Item -ItemType Directory -Path $DistDir  -Force | Out-Null

Assert-Command 'git'      'Install Git for Windows.'
if (-not $SkipFrontendBuild) { Assert-Command 'npm' 'Install Node.js LTS.' }
if (-not $SkipComposerInstall) { Assert-Command 'composer' 'Install Composer.' }

Write-Ok "Package version: $Version"
Write-Ok "Staging folder : $Staging"

# ─────────────────────────────────────────────────────────────────────────────
# 1. Frontend production build
# ─────────────────────────────────────────────────────────────────────────────

if (-not $SkipFrontendBuild) {
    Write-Step "1/6 Frontend production build (npm)"
    Push-Location $RepoRoot
    try {
        if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
            Write-Host "   npm ci (first run, installing dependencies)..."
            cmd /c "npm ci --no-audit --no-fund 2>&1"
            if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }
        }
        cmd /c "npm run build 2>&1"
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed." }
    } finally {
        Pop-Location
    }
    Write-Ok "Frontend bundle compiled to public/build."
} else {
    Write-Warn2 "Skipping frontend build (-SkipFrontendBuild) — reusing existing public/build assets."
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. Stage a clean copy of the project
# ─────────────────────────────────────────────────────────────────────────────

Write-Step "2/6 Staging clean project copy"

$excludeDirs = @(
    '.git', '.github', '.vscode', '.idea', 'node_modules', 'dist',
    'tests', 'scripts', 'docs', '.playwright', '.agents',
    'playwright-report', 'test-results',
    'storage\logs', 'storage\framework\cache', 'storage\framework\sessions',
    'storage\framework\views', 'storage\framework\testing'
)
$excludeFiles = @(
    '.env', '.env.backup', '.env.production', '.env.save',
    '.gitignore', '.gitattributes', '.gitmodules',
    'package-lock.json', 'phpunit.xml', '.phpunit.result.cache',
    '.prettierrc', '.editorconfig',
    '*.pem', '*.key', '*.p12', '*.pfx'
)

$xcArgs = @($RepoRoot.TrimEnd('\'), $Staging.TrimEnd('\'), '/E', '/NFL', '/NDL', '/NJH', '/NJS', '/MT:16')
foreach ($d in $excludeDirs) { $xcArgs += "/XD"; $xcArgs += (Join-Path $RepoRoot $d) }
# /XF takes bare filename patterns only (absolute paths with wildcards are
# rejected by robocopy) — bare names apply at every depth, which is what we want.
$xcArgs += '/XF'
foreach ($f in $excludeFiles) { $xcArgs += $f }

& robocopy @xcArgs | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Robocopy failed with exit code $LASTEXITCODE." }
Write-Ok "Project staged (dev/test/env/key files excluded)."

# Defence in depth: scrub anything sensitive that may have slipped in.
$sensitive = @('.env', '.env.backup', 'database\database.sqlite')
foreach ($s in $sensitive) {
    $p = Join-Path $Staging $s
    if (Test-Path $p) { Remove-Item $p -Force; Write-Warn2 "Removed sensitive file from staging: $s" }
}
# Fresh storage skeleton (create the runtime dirs Laravel requires, clear any
# copied dev data). Without these the staged app cannot even boot a console
# command ("Please provide a valid cache path").
$storageDirs = @(
    'storage\app\public',
    'storage\framework\cache\data',
    'storage\framework\sessions',
    'storage\framework\views',
    'storage\framework\testing',
    'storage\logs'
)
foreach ($d in $storageDirs) {
    $p = Join-Path $Staging $d
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}
foreach ($sub in @('framework\cache\data', 'framework\sessions', 'framework\views', 'framework\testing')) {
    $p = Join-Path $Staging "storage\$sub"
    if (Test-Path $p) {
        Get-ChildItem $p -Force | Where-Object { $_.Name -ne '.gitignore' } | Remove-Item -Recurse -Force
    }
}
Write-Ok "Storage skeleton created (app/public, framework/cache|sessions|views|testing, logs)."

# Vite dev-mode artifacts carry random suffixes — robocopy /XF cannot match
# mid-filename wildcards, so scrub them with PowerShell instead.
Get-ChildItem $Staging -Filter 'vite.config.ts.timestamp*' -File -Recurse -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

# ─────────────────────────────────────────────────────────────────────────────
# 2b. Scrub dev-only providers/tools from the STAGED copy
#     (repo sources untouched — this keeps the production vendor tree bootable,
#      since telescope & friends are require-dev and stripped by --no-dev)
# ─────────────────────────────────────────────────────────────────────────────

Write-Step "2b/6 Dev-only artifacts scrub (staged copy only)"

$devOnlyFiles = @(
    'app\Console\Commands\DevShortCutCommand.php',
    'app\Providers\TelescopeServiceProvider.php',
    'config\telescope.php'
)
foreach ($f in $devOnlyFiles) {
    $p = Join-Path $Staging $f
    if (Test-Path $p) { Remove-Item $p -Force; Write-Ok "Removed dev-only file from package: $f" }
}

# Drop provider registrations that point at removed dev providers.
$devProviderMarkers = @('TelescopeServiceProvider')
$providersPhp = Join-Path $Staging 'bootstrap\providers.php'
if (Test-Path $providersPhp) {
    $markerRegex = ($devProviderMarkers -join '|')
    $lines = Get-Content $providersPhp | Where-Object { $_ -notmatch $markerRegex }
    Set-Content -Path $providersPhp -Value $lines -Encoding ASCII
    Write-Ok "bootstrap/providers.php scrubbed of dev-only provider registrations."
}

# .env.production — offline/LAN-first SQLite template (no cloud services).
# Written early: it seeds the temporary .env used by composer's boot hook.
$envProd = @'
APP_NAME="Subul"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost:8000

APP_LOCALE=en
APP_FALLBACK_LOCALE=en

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=sqlite

SESSION_DRIVER=file
SESSION_LIFETIME=480
CACHE_STORE=file
QUEUE_CONNECTION=sync

MAIL_MAILER=log

BCRYPT_ROUNDS=10
'@
Set-Content -Path (Join-Path $Staging '.env.production') -Value $envProd -Encoding ASCII
Write-Ok ".env.production written (file-based cache/session — no cloud services)."

# ─────────────────────────────────────────────────────────────────────────────
# 3. Production PHP dependencies
# ─────────────────────────────────────────────────────────────────────────────

if (-not $SkipComposerInstall) {
    Write-Step "3/6 Composer production install (--no-dev --optimize-autoloader)"
    # Temporary .env so composer's post-autoload hook (artisan package:discover)
    # can boot the staged app with the file cache store instead of a database
    # cache store (the fresh client database has no cache table yet).
    Copy-Item (Join-Path $Staging '.env.production') (Join-Path $Staging '.env') -Force
    Push-Location $Staging
    try {
        cmd /c "composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist 2>&1"
        if ($LASTEXITCODE -ne 0) { throw "composer install failed." }
    } finally {
        Pop-Location
    }
    # Ship without .env and without any database file — start-pos.bat creates
    # both on the client's first run.
    Remove-Item (Join-Path $Staging '.env') -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $Staging 'database\database.sqlite') -Force -ErrorAction SilentlyContinue
    Write-Ok "Production vendor tree ready (package:discover passed). .env/empty DB stripped from package."
} else {
    Write-Warn2 "Skipping composer install (-SkipComposerInstall) — staging keeps the copied vendor tree."
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. Yakpro-Po obfuscation of licensing files (free tool — staging copies ONLY)
# ─────────────────────────────────────────────────────────────────────────────

Write-Step "4/6 Licensing files protection (YAK Pro - Php Obfuscator)"

$licenseFiles = @(
    'app\Services\LicenseVerifierService.php',
    'app\Services\HwidService.php',
    'app\Http\Middleware\LicenseMiddleware.php'
)

$yakproScript = $null
if (-not $SkipObfuscation) {
    $candidates = @()
    if ($YakproPath -and $YakproPath -ne '') {
        if ((Test-Path $YakproPath -PathType Leaf) -and $YakproPath.EndsWith('.php')) { $candidates += $YakproPath }
        else { $candidates += (Join-Path $YakproPath 'yakpro-po.php') }
    }
    $candidates += (Join-Path $RepoRoot 'tools\yakpro-po\yakpro-po.php')

    foreach ($c in $candidates) {
        if (Test-Path $c) { $yakproScript = (Resolve-Path $c).Path; break }
    }

    if ($null -eq $yakproScript) {
        Write-Warn2 "Yakpro-Po not found. The package will contain PLAIN-TEXT licensing files."
        Write-Warn2 "Install it (free) into tools\yakpro-po and re-run, or set SUBUL_YAKPRO_PATH:"
        Write-Warn2 "  git clone https://github.com/pk-fr/yakpro-po tools/yakpro-po"
    } elseif ($null -eq (Get-Command $PhpBinary -ErrorAction SilentlyContinue)) {
        Write-Warn2 "PHP CLI '$PhpBinary' not found — cannot run Yakpro-Po. Licensing files stay plain-text."
        $yakproScript = $null
    }
}

$obfuscated = 0
if ($yakproScript) {
    $workDir = Join-Path $env:TEMP ("yakpro-subul-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Path $workDir | Out-Null
    try {
        foreach ($rel in $licenseFiles) {
            $repoFile = Join-Path $RepoRoot $rel
            if (-not (Test-Path $repoFile)) { Write-Warn2 "Missing (skipped): $rel"; continue }

            # 1. Copy the ORIGINAL into a temp tree (repository source is never touched).
            $srcRoot = Join-Path $workDir 'src'
            Copy-TreeFile -BaseDir $RepoRoot -SourceFile $repoFile -DestRoot $srcRoot

            # 2. Generate a minimal Yakpro-Po config (source → target).
            $outRoot = Join-Path $workDir 'out'
            $srcFs  = $srcRoot.Replace('\', '/')
            $outFs  = $outRoot.Replace('\', '/')
            $confPath = Join-Path $workDir 'yakpro-po.conf.php'
            Set-Content -Path $confPath -Encoding ASCII -Value @"
<?php
`$conf = new stdClass();
`$conf->source_directory = '$srcFs';
`$conf->target_directory = '$outFs';
"@

            # 3. Obfuscate (uses default yakpro settings: public API preserved).
            $null = & $PhpBinary $yakproScript --config-file $confPath 2>&1

            # 4. Copy the obfuscated file over the STAGED copy.
            $outFile = Join-Path $outRoot $rel
            if ((Test-Path $outFile) -and ((Get-Item $outFile).Length -gt 0)) {
                Copy-TreeFile -BaseDir $outRoot -SourceFile $outFile -DestRoot $Staging
                $obfuscated++
                Write-Ok "Obfuscated: $rel"
            } else {
                Write-Warn2 "Yakpro-Po produced no output for $rel — staged copy left plain-text."
            }
        }
    } finally {
        Remove-Item $workDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    if ($obfuscated -gt 0) {
        Write-Ok "$obfuscated of $($licenseFiles.Count) licensing file(s) obfuscated with Yakpro-Po (free)."
    }
} elseif (-not $SkipObfuscation -and $yakproScript -eq $null) {
    Write-Warn2 "Proceeding WITHOUT source protection for licensing files."
}

# ─────────────────────────────────────────────────────────────────────────────
# 5. Client bootstrap files
# ─────────────────────────────────────────────────────────────────────────────

Write-Step "5/6 Client bootstrap files"

# start-pos.bat — one-click LAN server bootstrap for the client's local server machine.
$bat = @'
@echo off
title Subul - Local Server (LAN)
cd /d "%~dp0"

where php >nul 2>nul
if errorlevel 1 (
    echo [ERROR] PHP was not found in PATH. Install PHP 8.2+ with the sqlite3 extension.
    pause
    exit /b 1
)

if not exist ".env" (
    echo [setup] Creating .env from .env.production ...
    copy /Y ".env.production" ".env" >nul
    php artisan key:generate --force
)

echo [setup] Running database migrations (first run may take a minute) ...
php artisan migrate --force

echo.
echo  ==========================================================
echo   Subul local server is starting.
echo   This machine : http://localhost:8000
echo   Cashier terminals on the same LAN:
echo       http://THIS-SERVER-IP:8000
echo   (share this address with the other cashier PCs)
echo  ==========================================================
echo.
php artisan serve --host=0.0.0.0 --port=8000
pause
'@
# .env.production was already generated in step 2b (it seeds composer's boot
# env) — start-pos.bat copies it to .env on the client's first run.
Set-Content -Path (Join-Path $Staging 'start-pos.bat') -Value $bat -Encoding ASCII

# README-DEPLOY.txt — client deployment instructions.
$readme = @'
SUBUL POS - CLIENT DEPLOYMENT GUIDE (closed network / offline)
=============================================================

WHAT IS IN THIS PACKAGE
-----------------------
- Subul application (Laravel backend + compiled React frontend)
- start-pos.bat : one-click launcher for the machine that acts as the
                  LOCAL SERVER (holds the SQLite database + web server)

LICENSING / SOURCE PROTECTION
-----------------------------
- The licensing core (LicenseVerifierService / HwidService /
  LicenseMiddleware) is protected with YAK Pro - Php Obfuscator.
- Licensing is offline RSA-2048: no license keys are stored in the
  database; activation is verified cryptographically per machine.

FIRST-TIME SETUP (LOCAL SERVER MACHINE)
---------------------------------------
1. Install PHP 8.2+ (CLI) with extensions: sqlite3, pdo_sqlite, mbstring,
   openssl, fileinfo. Make sure "php" is in PATH.
2. Double-click start-pos.bat.
   - It creates .env, generates the app key and runs the migrations.
   - The server listens on http://0.0.0.0:8000 (all LAN interfaces).
3. Open http://localhost:8000 and complete the in-app setup wizard.
4. Activate the license (Command Prompt, in this folder):
       php artisan pos:activate --key="YOUR-SIGNED-LICENSE-KEY"

CONNECT CASHIER TERMINALS (OTHER PCS ON THE LAN)
------------------------------------------------
1. On the local server machine, find its LAN IP
   (Command Prompt:  ipconfig  ->  IPv4 Address, e.g. 192.168.1.10).
2. On each cashier PC, open the browser at:
       http://<SERVER-IP>:8000
   and log in with the cashier account created during setup.
3. For per-terminal receipt and label printing on local thermal printers,
   install the Subul desktop app on each cashier PC instead of using a browser.

PRINTING
--------
- Receipts, barcode labels and the cash-drawer pulse are sent by the Subul
  backend straight to the Windows print spooler — no extra service, port or
  agent to install.
- In this browser-over-LAN layout the backend runs on the server machine, so
  jobs go to the printer configured there. Choose the printer in the POS under
  Settings > Printing; leaving it empty uses that machine's Windows default.

DAILY OPERATION
---------------
- Start the local server machine first (start-pos.bat), then the terminals.
- Data is stored locally in database\database.sqlite on the server machine.
- Copy that file to a USB drive regularly to back up your data.

SECURITY NOTES
--------------
- This package contains no .git, no tests, no developer tooling and no
  private keys. Do NOT redistribute your signed license keys.
- Keep .env private on the server machine.
'@
Set-Content -Path (Join-Path $Staging 'README-DEPLOY.txt') -Value $readme -Encoding ASCII

Write-Ok "start-pos.bat / .env.production / README-DEPLOY.txt written."

# ─────────────────────────────────────────────────────────────────────────────
# 6. ZIP
# ─────────────────────────────────────────────────────────────────────────────

Write-Step "6/6 Creating ZIP package"

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$tarExe = Get-Command 'tar.exe' -ErrorAction SilentlyContinue
if ($tarExe) {
    Push-Location $Staging
    try {
        & tar.exe -a -c -f $ZipPath .
        if ($LASTEXITCODE -ne 0) { throw "tar.exe failed with exit code $LASTEXITCODE." }
    } finally {
        Pop-Location
    }
} else {
    Compress-Archive -Path (Join-Path $Staging '*') -DestinationPath $ZipPath -Force
}

$zipSize = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)

Write-Host ''
Write-Host '========================================================' -ForegroundColor Green
Write-Ok "Package : $ZipPath ($zipSize MB)"
Write-Ok "Staging : $Staging"
if ($obfuscated -gt 0) {
    Write-Ok "Licensing files protected with Yakpro-Po ($obfuscated/$($licenseFiles.Count))."
} else {
    Write-Warn2 "Licensing files are NOT obfuscated in this package (see warnings above)."
}
Write-Host '========================================================' -ForegroundColor Green