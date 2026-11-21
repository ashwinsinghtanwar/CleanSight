@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "ROOT=%CD%"

if not exist "backend\venv\Scripts\python.exe" (
  echo [ERROR] Not set up yet. Run  scripts\setup.bat  first.
  exit /b 1
)
if not exist "frontend\node_modules" (
  echo [ERROR] Frontend packages missing. Run  scripts\setup.bat  first.
  exit /b 1
)

echo Starting CleanSight API  ^(http://127.0.0.1:8000^) ...
start "CleanSight API" /D "%ROOT%\backend" cmd /k ""%ROOT%\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo Starting CleanSight website ^(http://localhost:5173^) ...
start "CleanSight Web" /D "%ROOT%\frontend" cmd /k "npm run dev"

echo Opening the browser in a few seconds...
timeout /t 8 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo CleanSight is running in the two new windows. Close them to stop it.
echo API docs: http://127.0.0.1:8000/docs     Health: http://127.0.0.1:8000/api/health
endlocal
