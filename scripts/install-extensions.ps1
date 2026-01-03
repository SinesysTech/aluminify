# Script para instalar extensoes recomendadas do VS Code/Cursor
# Nota: Este script tenta instalar via linha de comando, mas pode nao funcionar para todas as extensoes
# A forma mais confiavel e instalar manualmente pelo Cursor/VS Code

Write-Host "Instalando extensoes recomendadas..." -ForegroundColor Cyan
Write-Host ""

$extensions = @(
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "supabase.supabase-vscode",
    "denoland.vscode-deno"
)

$codePath = $null

# Tentar encontrar o executavel do Cursor/VS Code
$possiblePaths = @(
    "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe",
    "$env:ProgramFiles\Cursor\Cursor.exe",
    "$env:ProgramFiles(x86)\Cursor\Cursor.exe",
    "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe",
    "$env:ProgramFiles\Microsoft VS Code\Code.exe",
    "$env:ProgramFiles(x86)\Microsoft VS Code\Code.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $codePath = $path
        break
    }
}

if (-not $codePath) {
    Write-Host "[AVISO] Cursor/VS Code nao encontrado nos caminhos padrao" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para instalar as extensoes manualmente:" -ForegroundColor Cyan
    Write-Host "1. Abra o Cursor/VS Code" -ForegroundColor Gray
    Write-Host "2. Pressione Ctrl+Shift+P" -ForegroundColor Gray
    Write-Host "3. Digite: Extensions: Show Recommended Extensions" -ForegroundColor Gray
    Write-Host "4. Clique em 'Install All'" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "Cursor/VS Code encontrado: $codePath" -ForegroundColor Green
Write-Host ""

$installed = 0
$failed = 0

foreach ($ext in $extensions) {
    Write-Host "Instalando: $ext..." -ForegroundColor Yellow
    try {
        $process = Start-Process -FilePath $codePath -ArgumentList "--install-extension", $ext -Wait -NoNewWindow -PassThru
        if ($process.ExitCode -eq 0) {
            Write-Host "  [OK] $ext instalado" -ForegroundColor Green
            $installed++
        } else {
            Write-Host "  [ERRO] Falha ao instalar $ext" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  [ERRO] Falha ao instalar $ext" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] Instaladas: $installed" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "[ERRO] Falharam: $failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Se algumas extensoes falharam, instale manualmente:" -ForegroundColor Yellow
    Write-Host "1. Abra o Cursor/VS Code" -ForegroundColor Gray
    Write-Host "2. Pressione Ctrl+Shift+P" -ForegroundColor Gray
    Write-Host "3. Digite: Extensions: Show Recommended Extensions" -ForegroundColor Gray
    Write-Host "4. Clique em 'Install All'" -ForegroundColor Gray
}

