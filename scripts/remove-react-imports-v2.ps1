# Script para remover imports React desnecessários
# Versão compatível com PowerShell 2.0+

Write-Host "Removendo imports React desnecessários (v2)..." -ForegroundColor Green

$filesFixed = 0
$filesSkipped = 0

# Função para verificar se o arquivo usa React diretamente
function Uses-React-Directly {
    param($filePath)
    
    $content = Get-Content $filePath | Out-String
    
    # Verifica se usa React.algo (useState, useEffect, etc via React namespace)
    $usesReactNamespace = $content -match "(?<!//.*)\bReact\.[a-zA-Z]+"
    
    return $usesReactNamespace
}

# Função para remover import React
function Remove-React-Import {
    param($filePath)
    
    $lines = Get-Content $filePath
    $newLines = @()
    $skipNextEmpty = $false
    
    foreach ($line in $lines) {
        # Pular linhas com import React
        if ($line -match "^import\s+(\*\s+as\s+)?React\s+from\s+['""]react['""];?\s*$") {
            $skipNextEmpty = $true
            continue
        }
        
        # Pular linha vazia após import React
        if ($skipNextEmpty -and $line -match "^\s*$") {
            $skipNextEmpty = $false
            continue
        }
        
        $skipNextEmpty = $false
        $newLines += $line
    }
    
    $newLines | Set-Content -Path $filePath -Encoding UTF8
}

# Processar arquivos .tsx
$allFiles = @()
$allFiles += Get-ChildItem -Path "app" -Filter "*.tsx" -Recurse -File -ErrorAction SilentlyContinue
$allFiles += Get-ChildItem -Path "components" -Filter "*.tsx" -Recurse -File -ErrorAction SilentlyContinue

Write-Host "`nProcessando $($allFiles.Count) arquivos..." -ForegroundColor Cyan

foreach ($file in $allFiles) {
    try {
        $content = Get-Content $file.FullName | Out-String
        
        # Verificar se tem import React
        if ($content -notmatch "import\s+(\*\s+as\s+)?React\s+from\s+['""]react['""]") {
            $filesSkipped++
            continue
        }
        
        # Verificar se usa React diretamente
        if (Uses-React-Directly $file.FullName) {
            Write-Host "  Mantendo: $($file.FullName)" -ForegroundColor Yellow
            $filesSkipped++
            continue
        }
        
        Write-Host "  Removendo: $($file.FullName)" -ForegroundColor Green
        Remove-React-Import $file.FullName
        $filesFixed++
    }
    catch {
        Write-Host "  Erro: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Limpeza concluída!" -ForegroundColor Green
Write-Host "Imports removidos: $filesFixed" -ForegroundColor Green
Write-Host "Arquivos mantidos/pulados: $filesSkipped" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Execute 'npm run build' para verificar se não há erros." -ForegroundColor Cyan
