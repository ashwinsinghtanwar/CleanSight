@echo off
cd /d "%~dp0.."
if "%~1"=="" (
  echo Usage: scripts\make_admin.bat your@email.com   ^(register that account in the website first^)
  exit /b 1
)
"backend\venv\Scripts\python.exe" scripts\make_admin.py "%~1"
