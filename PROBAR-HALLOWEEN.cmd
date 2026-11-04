@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js para abrir la vista local de Halloween.
  pause
  exit /b 1
)
node "%~dp0scripts\preview-halloween-bundle.mjs"
if errorlevel 1 pause
