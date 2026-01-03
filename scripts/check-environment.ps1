# Script para verificar e configurar o ambiente do projeto
# Uso: .\scripts\check-environment.ps1

Write-Host "Verificando ambiente do projeto Area do Aluno..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$success = @()

# 1. Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        $version = [version]($nodeVersion -replace 'v', '')
        if ($version.Major -ge 18) {
            Write-Host "   [OK] Node.js instalado: $nodeVersion" -ForegroundColor Green
            $success += "Node.js $nodeVersion"
        } else {
            Write-Host "   [AVISO] Node.js versao $nodeVersion (necessario 18+)" -ForegroundColor Yellow
            $warnings += "Node.js versao antiga: $nodeVersion (necessario 18+)"
        }
    } else {
        throw "Node.js nao encontrado"
    }
} catch {
    Write-Host "   [ERRO] Node.js nao encontrado" -ForegroundColor Red
    Write-Host "      Instale em: https://nodejs.org/" -ForegroundColor Gray
    $errors += "Node.js nao instalado"
}

# 2. Verificar npm
Write-Host "2. Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "   [OK] npm instalado: v$npmVersion" -ForegroundColor Green
        $success += "npm v$npmVersion"
    } else {
        throw "npm nao encontrado"
    }
} catch {
    Write-Host "   [ERRO] npm nao encontrado" -ForegroundColor Red
    $errors += "npm nao instalado"
}

# 3. Verificar dependências
Write-Host "3. Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   [OK] node_modules existe" -ForegroundColor Green
    $success += "Dependencias instaladas"
} else {
    Write-Host "   [AVISO] node_modules nao encontrado" -ForegroundColor Yellow
    Write-Host "      Execute: npm install" -ForegroundColor Gray
    $warnings += "Dependencias nao instaladas (execute: npm install)"
}

# 4. Verificar arquivo .env.local
Write-Host "4. Verificando variáveis de ambiente..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   [OK] .env.local existe" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
        "SUPABASE_URL",
        "SUPABASE_SECRET_KEY"
    )
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch $var) {
            $missingVars += $var
        }
    }
    if ($missingVars.Count -eq 0) {
        Write-Host "   [OK] Todas as variaveis obrigatorias estao presentes" -ForegroundColor Green
        $success += "Variaveis de ambiente configuradas"
    } else {
        Write-Host "   [AVISO] Variaveis faltando: $($missingVars -join ', ')" -ForegroundColor Yellow
        $warnings += "Variaveis de ambiente incompletas"
    }
} else {
    Write-Host "   [ERRO] .env.local nao encontrado" -ForegroundColor Red
    Write-Host "      Crie o arquivo .env.local na raiz do projeto" -ForegroundColor Gray
    Write-Host "      Consulte: docs/ENV_VARIABLES.md" -ForegroundColor Gray
    $errors += "Arquivo .env.local nao encontrado"
}

# 5. Verificar Supabase CLI
Write-Host "5. Verificando Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>$null
    if ($supabaseVersion) {
        Write-Host "   [OK] Supabase CLI instalado: $supabaseVersion" -ForegroundColor Green
        $success += "Supabase CLI instalado"
    } else {
        throw "Supabase CLI nao encontrado"
    }
} catch {
    Write-Host "   [AVISO] Supabase CLI nao encontrado (opcional)" -ForegroundColor Yellow
    Write-Host "      Instale com: npm install -g supabase" -ForegroundColor Gray
    $warnings += "Supabase CLI nao instalado (opcional)"
}

# 6. Verificar Docker
Write-Host "6. Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "   [OK] Docker instalado: $dockerVersion" -ForegroundColor Green
        $success += "Docker instalado"
    } else {
        throw "Docker nao encontrado"
    }
} catch {
    Write-Host "   [AVISO] Docker nao encontrado (opcional - necessario para Supabase local)" -ForegroundColor Yellow
    Write-Host "      Instale em: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
    $warnings += "Docker nao instalado (opcional)"
}

# 7. Verificar MCP do Supabase
Write-Host "7. Verificando MCP do Supabase..." -ForegroundColor Yellow
$mcpFile = "$env:USERPROFILE\.cursor\mcp.json"
if (Test-Path $mcpFile) {
    Write-Host "   [OK] Arquivo mcp.json existe" -ForegroundColor Green
    $mcpContent = Get-Content $mcpFile -Raw | ConvertFrom-Json
    if ($mcpContent.mcpServers.supabase) {
        Write-Host "   [OK] MCP do Supabase configurado" -ForegroundColor Green
        $success += "MCP do Supabase configurado"
    } else {
        Write-Host "   [AVISO] mcp.json existe mas MCP do Supabase nao esta configurado" -ForegroundColor Yellow
        $warnings += "MCP do Supabase nao configurado"
    }
} else {
    Write-Host "   [AVISO] MCP do Supabase nao configurado (opcional)" -ForegroundColor Yellow
    Write-Host "      Configure com: .\scripts\setup-supabase-mcp.ps1 -AccessToken SEU_TOKEN" -ForegroundColor Gray
    $warnings += "MCP do Supabase nao configurado (opcional)"
}

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "[OK] Sucessos ($($success.Count)):" -ForegroundColor Green
    foreach ($item in $success) {
        Write-Host "   - $item" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "[AVISO] Avisos ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "   - $item" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "[ERRO] Erros ($($errors.Count)):" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "   - $item" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "[AVISO] O projeto nao funcionara corretamente ate que os erros sejam corrigidos." -ForegroundColor Red
    exit 1
} else {
    Write-Host "[OK] Ambiente configurado! Voce pode comecar a trabalhar." -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    if ($warnings -match "Dependencias nao instaladas") {
        Write-Host "   1. Execute: npm install" -ForegroundColor Yellow
    }
    if ($warnings -match "Variaveis de ambiente") {
        Write-Host "   2. Configure o arquivo .env.local (consulte: docs/ENV_VARIABLES.md)" -ForegroundColor Yellow
    }
    Write-Host "   3. Execute: npm run dev" -ForegroundColor Yellow
    exit 0
}

