@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "ROOT=%CD%"
echo ============================================
echo   CleanSight - one-time setup
echo ============================================

rem ---- find Python ----
set "PY="
python --version >nul 2>&1 && set "PY=python"
if not defined PY ( py -3 --version >nul 2>&1 && set "PY=py -3" )
if not defined PY (
  echo [ERROR] Python not found. Install Python 3.10 - 3.13 from https://www.python.org/downloads/
  echo         and tick "Add python.exe to PATH" during install. Then run this again.
  goto :fail
)
%PY% -c "import sys;sys.exit(0 if (3,9)<=sys.version_info[:2]<=(3,13) else 1)"
if errorlevel 1 (
  echo [ERROR] Unsupported Python version. CleanSight needs Python 3.9 - 3.13  ^(PyTorch has no wheels for newer versions yet^).
  %PY% --version
  goto :fail
)

rem ---- find Node ----
node --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install the LTS version from https://nodejs.org then run this again.
  goto :fail
)

rem ---- backend ----
echo.
echo [1/4] Creating Python virtual environment...
if not exist "backend\venv\Scripts\python.exe" (
  %PY% -m venv backend\venv
  if errorlevel 1 goto :fail
)
echo [2/4] Installing backend packages ^(first time downloads PyTorch, this can take several minutes^)...
"backend\venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 goto :fail
"backend\venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
if errorlevel 1 goto :fail
"backend\venv\Scripts\python.exe" scripts\init_env.py
if errorlevel 1 goto :fail

rem ---- frontend ----
echo.
echo [3/4] Installing frontend packages...
pushd frontend
call npm install --no-audit --no-fund
if errorlevel 1 ( popd & goto :fail )
popd

rem ---- models ----
echo.
echo [4/4] Checking the garbage and waterlogging AI models...
"backend\venv\Scripts\python.exe" scripts\check_models.py
if errorlevel 1 goto :fail

echo.
echo ============================================
echo   Setup complete.  Now run:  scripts\run.bat
echo ============================================
endlocal
exit /b 0

:fail
echo.
echo *** Setup did not finish. Fix the message above and run scripts\setup.bat again. ***
endlocal
exit /b 1
