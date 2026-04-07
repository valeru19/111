# Public HTTPS tunnel to local frontend (Docker must publish http://127.0.0.1:5173).
# Uses tunnelmole (free random URL). URL is valid only while this window stays open.
# If tunnelmole fails: with VPN off try Cloudflare quick tunnel:
#   cloudflared tunnel --url http://127.0.0.1:5173 --protocol http2

$ErrorActionPreference = 'Stop'
$composeDir = Split-Path -Parent $PSScriptRoot

Push-Location -LiteralPath $composeDir
docker compose up -d
Pop-Location

Write-Host ''
Write-Host 'Starting tunnelmole -> localhost:5173 (Ctrl+C to stop)...'
Write-Host ''
npx --yes tunnelmole@2 5173
