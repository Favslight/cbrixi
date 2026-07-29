# Sync CBRIXI favicon into mobile splash/preloader assets.
# Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File mobile/scripts/sync-favicon.ps1
$ErrorActionPreference = 'Stop'
$mobileRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$repoRoot = Resolve-Path (Join-Path $mobileRoot '..')
$src = Join-Path $repoRoot 'smart\public\favicon.png'
$dstDir = Join-Path $mobileRoot 'assets\images'
$dst = Join-Path $dstDir 'favicon.png'

if (-not (Test-Path -LiteralPath $src)) {
  Write-Error "Source favicon not found: $src"
}

New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
Copy-Item -LiteralPath $src -Destination $dst -Force
Write-Host "Copied -> $dst ($((Get-Item -LiteralPath $dst).Length) bytes)"
Write-Host "BrandMark + app.json splash already use assets/images/favicon.png."
