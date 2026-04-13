@echo off
echo ============================================
echo   Dhisum Tseyig - Safe Dev Server
echo ============================================
echo.

echo [1/3] Killing any existing Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo     ✓ Killed runaway processes
) else (
    echo     ✓ No processes to kill
)
echo.

echo [2/3] Clearing .next cache...
if exist .next (
    rmdir /s /q .next 2>nul
    echo     ✓ Cleared .next folder
) else (
    echo     ✓ .next already clean
)
echo.

echo [3/3] Starting development server (WEBPACK MODE)...
echo.
echo ============================================
echo   Server starting... Wait for "Ready"
echo   Press Ctrl+C to stop server
echo ============================================
echo.

REM Use --webpack flag to avoid Turbopack compilation loops
call npm run dev
