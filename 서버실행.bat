@echo off
setlocal
cd /d "%~dp0"

set "PAGE=index.html"
set "START_PORT=4173"

if not exist "%PAGE%" (
  echo HTML file was not found: %PAGE%
  echo Please check the file name in the Program folder.
  pause
  goto end
)

if exist "%SystemRoot%\py.exe" (
  "%SystemRoot%\py.exe" -3 --version >nul 2>nul
  if not errorlevel 1 (
    set PYTHON="%SystemRoot%\py.exe" -3
    goto find_port
  )
)

for /d %%D in ("%LocalAppData%\Programs\Python\Python*") do (
  if exist "%%D\python.exe" (
    "%%D\python.exe" --version >nul 2>nul
    if not errorlevel 1 (
      set PYTHON="%%D\python.exe"
      goto find_port
    )
  )
)

where py.exe >nul 2>nul
if not errorlevel 1 (
  py -3 --version >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON=py -3"
    goto find_port
  )
)

where python.exe >nul 2>nul
if not errorlevel 1 (
  python --version >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON=python"
    goto find_port
  )
)

where python3.exe >nul 2>nul
if not errorlevel 1 (
  python3 --version >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON=python3"
    goto find_port
  )
)

echo Python was not found.
echo Python may be installed but not registered in PATH.
pause
goto end

:find_port
set "PORT_SCRIPT=%TEMP%\supgeul_find_port_%RANDOM%.ps1"
> "%PORT_SCRIPT%" echo $p = %START_PORT%
>> "%PORT_SCRIPT%" echo while ($true) {
>> "%PORT_SCRIPT%" echo   try {
>> "%PORT_SCRIPT%" echo     $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Parse('127.0.0.1'), $p)
>> "%PORT_SCRIPT%" echo     $listener.Start()
>> "%PORT_SCRIPT%" echo     $listener.Stop()
>> "%PORT_SCRIPT%" echo     Write-Output $p
>> "%PORT_SCRIPT%" echo     break
>> "%PORT_SCRIPT%" echo   } catch {
>> "%PORT_SCRIPT%" echo     $p++
>> "%PORT_SCRIPT%" echo   }
>> "%PORT_SCRIPT%" echo }

for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%PORT_SCRIPT%"`) do set "PORT=%%P"
del "%PORT_SCRIPT%" >nul 2>nul

if "%PORT%"=="" (
  echo Could not find an available local port.
  pause
  goto end
)

set "URL=http://localhost:%PORT%/%PAGE%?run=%RANDOM%%RANDOM%"
> "url.txt" echo %URL%

echo Starting author studio local server.
echo URL: %URL%
echo.
echo Keep this window open while using the app.
echo To stop the server, press Ctrl+C, then type Y.
echo.

if not "%SUPGEUL_SERVER_NO_BROWSER%"=="1" start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
%PYTHON% -m http.server %PORT%

echo.
echo Server stopped.
pause

:end
endlocal
