@echo off
setlocal
cd /d "%~dp0"
title Crazy Lab
if not defined COPPER_LAB_DEMO_PORT set "COPPER_LAB_DEMO_PORT=8793"
set "COPPER_LAB_BIND=127.0.0.1"
set "OPENAI_API_KEY="
powershell.exe -NoProfile -Command "$ErrorActionPreference = 'Stop'; $port = [int]$env:COPPER_LAB_DEMO_PORT; $url = 'http://127.0.0.1:' + $port; try { $service = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri ($url + '/api/guide-status') } catch { $service = $null }; if ($service -and $service.Headers['X-Crazy-Lab-Edition'] -eq 'desktop') { Start-Process ($url + '/?mission=crazy&mode=learning'); exit 0 }; $file = Join-Path $env:LOCALAPPDATA 'CrazyLab\gemini.dpapi'; if (-not $env:GEMINI_API_KEY -and (Test-Path -LiteralPath $file -PathType Leaf)) { try { $secret = Get-Content -Raw -LiteralPath $file | ConvertTo-SecureString; $env:GEMINI_API_KEY = [System.Net.NetworkCredential]::new('', $secret).Password.Trim() } catch { Write-Host 'Your saved key could not be opened. Starting with the built-in guide.' } }; node server.mjs --desktop --open-learning; exit $LASTEXITCODE"
if errorlevel 1 pause
