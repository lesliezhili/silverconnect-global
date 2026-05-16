<#
.SYNOPSIS
SilverConnect — local direct deploy to VPS (47.236.169.73).

.DESCRIPTION
Pulls .env.local from VPS (source of truth), builds .next locally, packs
artifacts, SCPs to VPS, swaps in atomically with one-step rollback to
.next.prev on health check failure.

Replaces the GitHub Actions push-to-deploy flow during the test-server +
solo-dev iteration phase. The workflow at .github/workflows/deploy.yml is
retained as a workflow_dispatch-only backup channel.

.PARAMETER SkipBuild
Reuse existing .next from a previous build. Fails if .next is missing.

.PARAMETER DryRun
Build + pack but do not push to VPS.

.PARAMETER Force
Skip the dirty-working-tree warning prompt.

.PARAMETER KeyPath
Override SSH key path. Default: $env:SC_DEPLOY_KEY or ~\.ssh\silverconnect-deploy.

.EXAMPLE
.\scripts\deploy.ps1
Full pipeline.

.EXAMPLE
.\scripts\deploy.ps1 -SkipBuild
Re-push existing .next without rebuilding.

.EXAMPLE
.\scripts\deploy.ps1 -DryRun
Build + tar locally, no remote push.
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$DryRun,
    [switch]$Force,
    [string]$KeyPath
)

$ErrorActionPreference = 'Stop'
$start = Get-Date

# --- Config ---
$VpsHost = '47.236.169.73'
$VpsUser = 'root'
$VpsPath = '/opt/silverconnect'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$EnvBackupBefore = $null
$Tarball = Join-Path $RepoRoot 'deploy.tar.gz'
$EnvFile = Join-Path $RepoRoot '.env.local'

# Resolve SSH key
if (-not $KeyPath) {
    $KeyPath = if ($env:SC_DEPLOY_KEY) { $env:SC_DEPLOY_KEY } else { Join-Path $env:USERPROFILE '.ssh\silverconnect-deploy' }
}

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "    [ok] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    [warn] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "    [err] $msg" -ForegroundColor Red }

function Invoke-CheckedCommand {
    param([string]$Cmd, [string[]]$ArgList)
    # PS 5.1 wraps any native-command stderr in NativeCommandError, which with
    # ErrorActionPreference=Stop terminates on benign warnings (e.g. npm's
    # EBADENGINE for transitive deps). Switch to Continue around the call and
    # rely on $LASTEXITCODE for real failures.
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Cmd @ArgList 2>&1 | ForEach-Object { "$_" } | Out-Host
    } finally {
        $ErrorActionPreference = $prevPref
    }
    if ($LASTEXITCODE -ne 0) { throw "$Cmd exited with code $LASTEXITCODE" }
}

try {
    Push-Location $RepoRoot

    # --- 1. Preflight ---
    Write-Step "Preflight"

    if (-not (Test-Path $KeyPath)) {
        throw "SSH key not found at $KeyPath. Set `$env:SC_DEPLOY_KEY or pass -KeyPath."
    }
    Write-Ok "SSH key: $KeyPath"

    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus -and -not $Force) {
        Write-Warn "Working tree has uncommitted changes:"
        $gitStatus | Select-Object -First 5 | ForEach-Object { Write-Host "      $_" }
        $resp = Read-Host "Continue anyway? [y/N]"
        if ($resp -ne 'y') { throw "Aborted by user." }
    }

    if ($SkipBuild) {
        if (-not (Test-Path (Join-Path $RepoRoot '.next'))) {
            throw "-SkipBuild requested but no .next directory found. Run a normal deploy first."
        }
        Write-Ok "Reusing existing .next"
    }

    Write-Host "    Pinging VPS via SSH..."
    & ssh -i $KeyPath -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "$VpsUser@$VpsHost" 'echo ok' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "SSH connectivity check failed." }
    Write-Ok "VPS reachable"

    # --- 2. Pull .env.local from VPS ---
    Write-Step "Pull .env.local from VPS"

    if (Test-Path $EnvFile) {
        $EnvBackupBefore = "$EnvFile.bak.$(Get-Date -Format 'yyyyMMddHHmmss')"
        Move-Item $EnvFile $EnvBackupBefore
        Write-Ok "Existing local .env.local backed up to $(Split-Path -Leaf $EnvBackupBefore)"
    }

    # scp on Windows mis-parses local paths with drive colons (f:\...) as host:path,
    # so pass the local destination as a relative path (we are in $RepoRoot).
    Invoke-CheckedCommand 'scp' @('-i', $KeyPath, '-o', 'StrictHostKeyChecking=accept-new', "${VpsUser}@${VpsHost}:${VpsPath}/.env.local", '.env.local')
    Write-Ok "Pulled .env.local ($((Get-Item $EnvFile).Length) bytes)"

    # --- 3. Install + Build ---
    if (-not $SkipBuild) {
        Write-Step "Install dependencies"
        Invoke-CheckedCommand 'npm' @('ci', '--no-audit', '--no-fund')
        Write-Ok "npm ci done"

        Write-Step "Build (next build)"
        Invoke-CheckedCommand 'npm' @('run', 'build')
        Write-Ok "Build done"
    }

    # --- 4. Pack artifacts ---
    Write-Step "Pack artifacts"
    if (Test-Path $Tarball) { Remove-Item $Tarball -Force }

    $tarFiles = @(
        '.next', 'public',
        'package.json', 'package-lock.json',
        'next.config.ts', 'next-env.d.ts', 'tsconfig.json',
        'i18n', 'messages',
        'drizzle', 'drizzle.config.ts',
        'lib', 'components', 'app'
    )
    foreach ($f in $tarFiles) {
        if (-not (Test-Path (Join-Path $RepoRoot $f))) { throw "Required path missing: $f" }
    }

    Invoke-CheckedCommand 'tar' (@('-czf', $Tarball) + $tarFiles)
    $tarSize = '{0:N1}' -f ((Get-Item $Tarball).Length / 1MB)
    Write-Ok "deploy.tar.gz packed (${tarSize} MB)"

    if ($DryRun) {
        Write-Step "DryRun complete"
        Write-Ok "Tarball at $Tarball — not pushing to VPS"
        return
    }

    # --- 5. SCP + remote reload ---
    Write-Step "SCP tarball to VPS"
    Invoke-CheckedCommand 'scp' @('-i', $KeyPath, '-o', 'StrictHostKeyChecking=accept-new', 'deploy.tar.gz', "${VpsUser}@${VpsHost}:/tmp/sc-deploy.tar.gz")
    Write-Ok "Uploaded"

    Write-Step "Extract + reload on VPS"
    $remoteScript = @'
set -euo pipefail
cd /opt/silverconnect
rm -rf .next.prev
[ -d .next ] && mv .next .next.prev || true
tar xzf /tmp/sc-deploy.tar.gz
rm /tmp/sc-deploy.tar.gz
npm ci --omit=dev --no-audit --no-fund
set -a && source .env.local && set +a
npm run db:migrate
pm2 reload silverconnect --update-env
pm2 save
sleep 3
code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/zh/home)
if [ "$code" != "200" ]; then
  echo "Health check failed (HTTP $code) — rolling back"
  rm -rf .next
  mv .next.prev .next
  pm2 reload silverconnect --update-env
  exit 1
fi
echo "Deploy OK (HTTP $code)"
'@

    # Write script to temp file (UTF-8 no BOM), pipe via stdin to avoid
    # PowerShell pipeline injecting a BOM that bash sees as `\xEF\xBB\xBFset`.
    $scriptFile = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($scriptFile, $remoteScript, [System.Text.UTF8Encoding]::new($false))
    try {
        # Same stderr-trap workaround as Invoke-CheckedCommand: PS 5.1 promotes
        # any native stderr (including npm warnings tunneled through ssh) to a
        # terminating error under ErrorActionPreference=Stop.
        $prevPref = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            & cmd /c "ssh -i `"$KeyPath`" -o StrictHostKeyChecking=accept-new $VpsUser@$VpsHost `"bash -s`" < `"$scriptFile`"" 2>&1 | ForEach-Object { "$_" } | Out-Host
        } finally {
            $ErrorActionPreference = $prevPref
        }
        if ($LASTEXITCODE -ne 0) { throw "Remote deploy failed (auto-rolled back to .next.prev)." }
    } finally {
        Remove-Item $scriptFile -Force -ErrorAction SilentlyContinue
    }
    Write-Ok "Remote reload done"

    # --- 6. Status report ---
    Write-Step "Verification"
    $duration = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)

    $localCommit = (git rev-parse --short HEAD 2>$null)
    $localDirty = if (git status --porcelain) { ' (dirty)' } else { '' }

    Write-Host ""
    Write-Host "  Duration : ${duration}s"
    Write-Host "  Commit   : $localCommit$localDirty"
    Write-Host ""

    $resp = Invoke-WebRequest -Uri "http://$VpsHost/zh/home" -UseBasicParsing -TimeoutSec 10
    $chunks = [regex]::Matches($resp.Content, '/_next/static/chunks/[a-z0-9~_.\-]+\.js') |
              ForEach-Object { $_.Value } |
              Select-Object -Unique -First 3
    Write-Host "  Public site : HTTP $($resp.StatusCode)"
    Write-Host "  Sample chunks (should differ from previous deploy):"
    $chunks | ForEach-Object { Write-Host "    $_" }
    Write-Host ""

    Write-Host "Done." -ForegroundColor Green
}
finally {
    Pop-Location
    # Cleanup
    if (Test-Path $Tarball) { Remove-Item $Tarball -Force -ErrorAction SilentlyContinue }
    if (Test-Path $EnvFile) { Remove-Item $EnvFile -Force -ErrorAction SilentlyContinue }
    if ($EnvBackupBefore -and (Test-Path $EnvBackupBefore)) {
        Move-Item $EnvBackupBefore $EnvFile -Force -ErrorAction SilentlyContinue
        Write-Host "    [cleanup] restored pre-deploy local .env.local"
    }
}
