#Requires -Version 5.1
<#
.SYNOPSIS
    Turn a fresh clone of this repository into a running Subul POS.

.DESCRIPTION
    One pass over everything a new machine needs: toolchain check, .env, PHP
    dependencies, application key, SQLite schema, the application install
    itself, the Vite bundle and the storage link.

    Each step is skipped when its result is already in place, so the script also
    works as a repair pass over a half-finished setup. Re-running it against an
    installed application never touches existing data.

.PARAMETER StoreName
    Value stored as the shop name during the automatic install.

.PARAMETER AdminUsername / AdminEmail / AdminPassword
    The single administrator created by the automatic install. These are only
    used when the database has no application installed yet.

.PARAMETER Language
    Installation language: en, ar, fr, es, de, it, km, pt, sq, tr.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\bootstrap.ps1

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\bootstrap.ps1 -Language ar
#>
[CmdletBinding()]
param(
    [string] $StoreName     = 'Subul Dev Store',
    [string] $AdminUsername = 'subuldev',
    [string] $AdminEmail    = 'dev@subul.local',
    [string] $AdminPassword = 'subul-dev-password',
    [string] $Language      = 'en'
)

$ErrorActionPreference = 'Stop'
$App = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Url = 'http://127.0.0.1:8000'

function Write-Step { param($m) Write-Host "`n== $m" -ForegroundColor Cyan }
function Write-Ok   { param($m) Write-Host "   [ok]   $m" -ForegroundColor Green }
function Write-Skip { param($m) Write-Host "   [skip] $m" -ForegroundColor DarkGray }
function Write-Warn { param($m) Write-Host "   [warn] $m" -ForegroundColor Yellow }

function Require-Tool {
    param([string] $Name, [string] $Hint)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required tool '$Name' was not found in PATH. $Hint"
    }
}

function Invoke-Step {
    param([string[]] $Command, [string] $Label)
    $exe = $Command[0]
    $args_ = @()
    if ($Command.Count -gt 1) { $args_ = $Command[1..($Command.Count - 1)] }
    & $exe @args_
    if ($LASTEXITCODE -ne 0) { throw "$Label failed (exit code $LASTEXITCODE)." }
}

Push-Location $App
try {
    # ── 1. Toolchain ───────────────────────────────────────────────────────────
    Write-Step '1/8 Toolchain'
    Require-Tool 'php'      'Install PHP 8.2 or newer (XAMPP, Laragon, or https://windows.php.net/download) and add it to PATH.'
    Require-Tool 'composer' 'Install Composer from https://getcomposer.org.'
    Require-Tool 'npm'      'Install the Node.js LTS from https://nodejs.org.'

    $phpVersion = ((& php -r 'echo PHP_VERSION;') | Out-String).Trim()
    if ([version]$phpVersion -lt [version]'8.2.0') {
        throw "PHP $phpVersion is too old — Subul requires 8.2 or newer."
    }

    # No package declares pdo_sqlite, so Composer's platform check stays quiet
    # while the default database driver is missing.
    $loadedExtensions = & php -m
    if (-not ($loadedExtensions | Where-Object { $_ -match '^pdo_sqlite$' })) {
        throw 'The PHP extension pdo_sqlite is not enabled. Uncomment extension=pdo_sqlite in your php.ini.'
    }

    $nodeVersion = ((& node -p 'process.versions.node') | Out-String).Trim()
    $nodeMajor = [int]($nodeVersion.Split('.')[0])
    if ($nodeMajor -lt 18) {
        throw "Node.js $nodeVersion is too old — Vite needs 18 or newer."
    }

    Write-Host '   checking declared PHP requirements...'
    Invoke-Step @('composer', 'check-platform-reqs') 'composer check-platform-reqs'
    Write-Ok "PHP $phpVersion, Node $nodeMajor.x, Composer and all required extensions present"

    # ── 2. Environment file ────────────────────────────────────────────────────
    Write-Step '2/8 Environment'
    if (-not (Test-Path (Join-Path $App '.env'))) {
        Copy-Item (Join-Path $App '.env.example') (Join-Path $App '.env')
        Write-Ok '.env created from .env.example'
    } else {
        Write-Skip '.env already present'
    }

    # -match is not line-anchored against a raw file, so each key is looked up
    # line by line.
    $envLines = @( Get-Content (Join-Path $App '.env') )

    if ($envLines | Where-Object { $_ -match '^\s*APP_ENV\s*=\s*production' }) {
        throw 'This .env is APP_ENV=production — bootstrap is for local development only. The desktop package installs itself.'
    }

    # ── 3. PHP dependencies ────────────────────────────────────────────────────
    Write-Step '3/8 PHP dependencies'
    if (Test-Path (Join-Path $App 'vendor\composer\ClassLoader.php')) {
        Write-Skip 'vendor/ already installed'
    } else {
        Invoke-Step @('composer', 'install', '--no-interaction') 'composer install'
        Write-Ok 'vendor/ installed'
    }

    # ── 4. Application key ─────────────────────────────────────────────────────
    # After the Composer step: every artisan call needs the autoloader.
    Write-Step '4/8 Application key'
    if ($envLines | Where-Object { $_ -match '^\s*APP_KEY\s*=\s*\S' }) {
        Write-Skip 'application key already set'
    } else {
        Invoke-Step @('php', 'artisan', 'key:generate', '--force') 'php artisan key:generate'
        Write-Ok 'application key generated'
    }

    # ── 5. Database ────────────────────────────────────────────────────────────
    Write-Step '5/8 Database'
    Invoke-Step @('php', 'artisan', 'migrate', '--force') 'php artisan migrate'
    Write-Ok 'framework tables up to date (sessions, cache, jobs, migrations)'

    # ── 6. Application install ─────────────────────────────────────────────────
    Write-Step '6/8 Application'
    $probe = & php artisan tinker --execute="echo App\Services\Helper::installed() ? 'YES' : 'NO';" 2>&1 | Out-String
    if ($probe -match 'YES') {
        Write-Skip 'Subul is already installed — existing data left untouched'
    } else {
        Invoke-Step @(
            'php', 'artisan', 'ns:setup',
            "--store_name=$StoreName",
            "--admin_username=$AdminUsername",
            "--admin_email=$AdminEmail",
            "--admin_password=$AdminPassword",
            "--language=$Language"
        ) 'php artisan ns:setup'
        Write-Ok "installed as $AdminEmail"
    }

    # ── 7. Frontend bundle ─────────────────────────────────────────────────────
    Write-Step '7/8 Frontend'
    Invoke-Step @('npm', 'install', '--no-audit', '--no-fund') 'npm install'
    Write-Ok 'node_modules up to date'
    Invoke-Step @('npm', 'run', 'build') 'npm run build'
    Write-Ok 'public/build regenerated (the manifest is not tracked by Git)'

    # ── 8. Uploads link ────────────────────────────────────────────────────────
    Write-Step '8/8 Storage link'
    if (Test-Path (Join-Path $App 'public\storage')) {
        # storage:link reports an ERROR and still exits 0 when the link exists,
        # so the check stays here to keep an existing install's output clean.
        Write-Skip 'public/storage already linked'
    } else {
        & php artisan storage:link --force
        if ($LASTEXITCODE -ne 0) {
            Write-Warn 'public/storage could not be linked — uploads will 404 until it is. On Windows, turn on Developer Mode or run this step from an elevated shell.'
        } else {
            Write-Ok 'public/storage linked'
        }
    }

    # ── Summary ────────────────────────────────────────────────────────────────
    Write-Host ''
    Write-Host '========================================================' -ForegroundColor Green
    Write-Ok 'Subul POS is ready'
    Write-Host ''
    Write-Host "   Start it with either of:" -ForegroundColor White
    Write-Host '     composer run dev        # server + queue worker + Vite'
    Write-Host '     php artisan serve       # server only, uses the bundle above'
    Write-Host ''
    Write-Host "   Then open $Url and sign in with:" -ForegroundColor White
    Write-Host "     email     $AdminEmail"
    Write-Host "     username  $AdminUsername"
    Write-Host "     password  $AdminPassword"
    Write-Host ''
    Write-Host '   Those credentials exist only on this local install — change them' -ForegroundColor Yellow
    Write-Host '   in Users before the machine is used for real trading.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host "   Signing in lands on /activate: every terminal needs a license key" -ForegroundColor Yellow
    Write-Host '   before the dashboard opens. Enter one there, or run' -ForegroundColor Yellow
    Write-Host '     php artisan pos:activate --key=... --device=dev-machine' -ForegroundColor Yellow
    Write-Host '========================================================' -ForegroundColor Green
}
finally {
    Pop-Location
}
