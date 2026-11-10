@echo off
cd /d "%~dp0"
title jakorchi - build restaurant files
echo ================================================================
echo  jakorchi builds the restaurant files on THIS PC.
echo  It downloads an official OpenStreetMap country file from
echo  download.geofabrik.de and the official "osmium" package
echo  from pypi.org. Nothing else is downloaded or run.
echo ================================================================
echo.
set PY=
where py >nul 2>nul
if not errorlevel 1 set PY=py
if "%PY%"=="" where python >nul 2>nul
if "%PY%"=="" if not errorlevel 1 set PY=python
if "%PY%"=="" goto nopython
%PY% -m pip install --user --upgrade osmium
if errorlevel 1 goto pipfail
echo.
echo Which area?
echo   4 = Tokyo  (recommended, about 64 km x 64 km around Tokyo, like Seoul)
echo   5 = Kyoto  (the whole city, with Arashiyama, Kurama and Uji)
echo   1 = South Korea (whole country)
echo   2 = Japan (whole country, very big)
echo   3 = China (whole country, very big, needs 8 GB memory or more)
set /p C=Type 4, 5, 1, 2 or 3 and press Enter: 
set N=
set R=
if "%C%"=="1" set URL=https://download.geofabrik.de/asia/south-korea-latest.osm.pbf
if "%C%"=="1" set F=south-korea.osm.pbf
if "%C%"=="1" set N=Korea
if "%C%"=="2" set URL=https://download.geofabrik.de/asia/japan-latest.osm.pbf
if "%C%"=="2" set F=japan.osm.pbf
if "%C%"=="2" set N=Japan
if "%C%"=="3" set URL=https://download.geofabrik.de/asia/china-latest.osm.pbf
if "%C%"=="3" set F=china.osm.pbf
if "%C%"=="3" set N=China
if "%C%"=="4" set URL=https://download.geofabrik.de/asia/japan/kanto-latest.osm.pbf
if "%C%"=="4" set F=kanto.osm.pbf
if "%C%"=="4" set N=Japan
if "%C%"=="4" set R=3634 3641 1608 1615
if "%C%"=="5" set URL=https://download.geofabrik.de/asia/japan/kansai-latest.osm.pbf
if "%C%"=="5" set F=kansai.osm.pbf
if "%C%"=="5" set N=Japan
if "%C%"=="5" set R=3590 3595 1620 1625
if "%N%"=="" goto badchoice
if not exist "%F%" goto download
rem A file younger than 7 days is used again: no new download.
forfiles /m "%F%" /d -7 >nul 2>&1 && goto refresh
echo Using the %N% file from the last 7 days (no new download).
goto build
:refresh
echo The %N% file is older than 7 days, getting a fresh copy...
:download
echo Downloading %N%, this can take several minutes...
curl.exe -L --fail -o "%F%.part" "%URL%"
if errorlevel 1 goto dlfail
move /y "%F%.part" "%F%" >nul
rem Write the date and SHA-256 fingerprint of every download to downloads-log.txt
for /f "skip=1 delims=" %%h in ('certutil -hashfile "%F%" SHA256 ^| findstr /v ":"') do (echo %date% %time% %F% %%h>>downloads-log.txt& goto build)
:build
echo Building restaurant files for %N% ...
%PY% build_places.py "%F%" %N% %R%
if errorlevel 1 goto buildfail
echo.
echo DONE. The restaurant files were added to jakorchi-site\places on your Desktop.
echo Now upload the jakorchi-site folder to Cloudflare again.
goto end
:nopython
echo Python is not installed. Install it from https://www.python.org/downloads/
echo and TICK "Add python to PATH" at the start. Then run this file again.
goto end
:pipfail
echo Could not install osmium. Send a screenshot of this window to Claude.
goto end
:badchoice
echo Please type 4, 5, 1, 2 or 3.
goto end
:dlfail
echo Download failed. Check your internet and run again.
del "%F%" 2>nul
goto end
:buildfail
echo The build failed. Send a screenshot of this window to Claude.
:end
echo.
pause
