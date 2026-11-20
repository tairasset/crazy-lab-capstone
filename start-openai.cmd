@echo off
setlocal
cd /d "%~dp0"
set "COPPER_LAB_DEMO_PORT=8792"
set "GEMINI_API_KEY="
powershell.exe -NoProfile -Command "if (-not $env:OPENAI_API_KEY) { $key = Read-Host 'OpenAI API key' -AsSecureString; $env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $key).Password }; if ($env:OPENAI_API_KEY) { node server.mjs --local-openai --open }"
pause
