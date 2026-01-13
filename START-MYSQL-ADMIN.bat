@echo off
echo ========================================
echo   Iniciando MySQL Server
echo ========================================
echo.
net start MYSQL80
echo.
if %errorlevel% equ 0 (
    echo ✅ MySQL iniciado correctamente
) else (
    echo ❌ Error: Se requieren privilegios de administrador
    echo.
    echo Por favor, haz click derecho en este archivo
    echo y selecciona "Ejecutar como administrador"
)
echo.
pause
