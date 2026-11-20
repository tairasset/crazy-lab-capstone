@echo off
setlocal
title Crazy Lab - optional personal Gemini setup
echo Optional private Gemini setup for an eligible adult on this Windows account.
echo Leave the key blank to cancel. Normal Crazy Lab startup works without setup.
powershell.exe -NoProfile -Command "$ErrorActionPreference = 'Stop'; $key = Read-Host 'Gemini API key (hidden)' -AsSecureString; if ($key.Length -eq 0) { exit 0 }; $folder = Join-Path $env:LOCALAPPDATA 'CrazyLab'; [void][IO.Directory]::CreateDirectory($folder); $file = Join-Path $folder 'gemini.dpapi'; $temp = Join-Path $folder ([IO.Path]::GetRandomFileName()); try { [IO.File]::WriteAllText($temp, (ConvertFrom-SecureString -SecureString $key)); if ([IO.File]::Exists($file)) { [IO.File]::Replace($temp, $file, [NullString]::Value) } else { [IO.File]::Move($temp, $file) }; Write-Host 'Saved for this Windows account. Close any running desktop lab and open start-gemini.cmd.' } finally { if ([IO.File]::Exists($temp)) { [IO.File]::Delete($temp) }; $key.Dispose() }"
pause
