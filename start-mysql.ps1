# Script para iniciar MySQL como administrador
Write-Host "Iniciando MySQL..." -ForegroundColor Cyan
Start-Service MYSQL80
Start-Sleep -Seconds 2
$status = (Get-Service MYSQL80).Status
if ($status -eq "Running") {
    Write-Host "✅ MySQL iniciado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error iniciando MySQL. Estado: $status" -ForegroundColor Red
}
