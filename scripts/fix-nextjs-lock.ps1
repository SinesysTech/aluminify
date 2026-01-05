# Script para resolver problemas de lock do Next.js
# Uso: .\scripts\fix-nextjs-lock.ps1

Write-Host "Resolvendo problema de lock do Next.js..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar processos Node.js rodando
Write-Host "1. Verificando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   [AVISO] Encontrados $($nodeProcesses.Count) processo(s) Node.js rodando:" -ForegroundColor Yellow
    foreach ($proc in $nodeProcesses) {
        Write-Host "   - PID: $($proc.Id) | Iniciado: $($proc.StartTime)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "   Deseja encerrar esses processos? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        foreach ($proc in $nodeProcesses) {
            Write-Host "   Encerrando processo PID: $($proc.Id)..." -ForegroundColor Gray
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
        Write-Host "   [OK] Processos encerrados" -ForegroundColor Green
    }
} else {
    Write-Host "   [OK] Nenhum processo Node.js encontrado" -ForegroundColor Green
}

Write-Host ""

# 2. Remover arquivo de lock
Write-Host "2. Removendo arquivo de lock..." -ForegroundColor Yellow
$lockFile = ".next\dev\lock"

if (Test-Path $lockFile) {
    try {
        Remove-Item $lockFile -Force -ErrorAction Stop
        Write-Host "   [OK] Arquivo de lock removido" -ForegroundColor Green
    } catch {
        Write-Host "   [ERRO] Nao foi possivel remover o lock: $_" -ForegroundColor Red
        Write-Host "   Tente fechar manualmente todos os processos Node.js" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [OK] Nenhum arquivo de lock encontrado" -ForegroundColor Green
}

Write-Host ""

# 3. Limpar cache do Next.js (opcional)
Write-Host "3. Deseja limpar o cache do Next.js? (S/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
    if (Test-Path ".next") {
        Write-Host "   Removendo diretorio .next..." -ForegroundColor Gray
        Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   [OK] Cache limpo" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Problema de lock resolvido!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora voce pode executar:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host ""






