@echo off
setlocal EnableExtensions
title FieldPlay for Desmos Updater

set "TARGET=%~dp0extension"
set "STAGE=%TEMP%\FieldPlayUpdate-%RANDOM%%RANDOM%"
set "BASE=https://raw.githubusercontent.com/daguitarman55555-byte/fieldplay/refs/heads/feature/desmos-extension/extension/published"

echo.
echo Updating FieldPlay for Desmos...
mkdir "%STAGE%" >nul 2>&1
if errorlevel 1 goto :failed

for %%F in (manifest.json content.js main-world.js content.css) do (
  echo Downloading %%F...
  curl.exe -fL --retry 3 --connect-timeout 15 -o "%STAGE%\%%F" "%BASE%/%%F"
  if errorlevel 1 goto :failed
)

findstr /C:"manifest_version" "%STAGE%\manifest.json" >nul
if errorlevel 1 goto :failed

if not exist "%TARGET%" mkdir "%TARGET%"
for %%F in (manifest.json content.js main-world.js content.css) do (
  copy /Y "%STAGE%\%%F" "%TARGET%\%%F" >nul
  if errorlevel 1 goto :failed
)

rmdir /S /Q "%STAGE%" >nul 2>&1
echo.
echo FieldPlay was updated successfully.
echo Chrome's Extensions page will open now.
echo Click the circular Reload button on FieldPlay for Desmos, then refresh Desmos.
echo.
start "" chrome.exe "chrome://extensions/" 2>nul
if errorlevel 1 start "" "chrome://extensions/"
pause
exit /b 0

:failed
echo.
echo The update did not complete. Your existing extension files were left unchanged.
echo Check your internet connection and try again.
if exist "%STAGE%" rmdir /S /Q "%STAGE%" >nul 2>&1
pause
exit /b 1
