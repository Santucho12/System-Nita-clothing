@echo off
REM === Script de inicio automático para Nita Clothing Stock System ===
REM Ejecuta backend, frontend (build) y abre el sistema en el navegador


REM Reinicia el servicio MySQL
echo Reiniciando servicio MySQL...
net stop mysql
net start mysql

REM Cambia a la carpeta del backend y levanta el backend en modo desarrollo en una terminal nueva
echo Iniciando backend (modo desarrollo)...
start cmd /k "cd /d %~dp0backend && npm start"

REM Espera unos segundos para asegurar que el backend arranque
ping 127.0.0.1 -n 6 > nul


REM Cambia a la carpeta del frontend y levanta el frontend en modo desarrollo en otra terminal nueva
echo Iniciando frontend (modo desarrollo)...
start cmd /k "cd /d %~dp0frontend && npm start"

REM Espera unos segundos para asegurar que el frontend arranque
ping 127.0.0.1 -n 4 > nul


REM Abre el navegador en la página principal
echo Abriendo el sistema en el navegador...
start chrome http://localhost:3000

echo Todo listo. No cierres las ventanas negras mientras uses el sistema.
pause