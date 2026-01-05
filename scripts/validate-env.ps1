# Script para validar o arquivo .env.local
# Uso: .\scripts\validate-env.ps1

Write-Host "Validando arquivo .env.local..." -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"
$errors = @()
$warnings = @()
$success = @()

if (-not (Test-Path $envFile)) {
    Write-Host "[ERRO] Arquivo .env.local nao encontrado!" -ForegroundColor Red
    Write-Host "Crie o arquivo .env.local na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Arquivo .env.local encontrado" -ForegroundColor Green
Write-Host ""

# Ler o arquivo
$content = Get-Content $envFile -Raw

# Variáveis obrigatórias
$requiredVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "URL do projeto Supabase"
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY" = "Chave publica/anon do Supabase"
    "SUPABASE_URL" = "URL do Supabase (servidor)"
    "SUPABASE_SECRET_KEY" = "Chave secreta do Supabase"
}

Write-Host "Verificando variaveis obrigatorias..." -ForegroundColor Yellow
Write-Host ""

foreach ($var in $requiredVars.Keys) {
    if ($content -match "$var=(.+)") {
        $value = $matches[1].Trim()
        
        # Verificar se não é um valor de exemplo
        if ($value -match "sua_|your_|example|aqui|here|SEU_|YOUR_|EXAMPLE") {
            Write-Host "  [AVISO] $var" -ForegroundColor Yellow
            Write-Host "          Valor de exemplo detectado: $value" -ForegroundColor Gray
            Write-Host "          Preencha com a credencial real!" -ForegroundColor Gray
            $warnings += "$var ainda contem valor de exemplo"
        } elseif ($value -eq "" -or $value -eq $null) {
            Write-Host "  [ERRO] $var" -ForegroundColor Red
            Write-Host "          Variavel vazia!" -ForegroundColor Gray
            $errors += "$var esta vazia"
        } else {
            Write-Host "  [OK] $var" -ForegroundColor Green
            Write-Host "       Valor configurado (oculto por seguranca)" -ForegroundColor Gray
            $success += $var
            
            # Validações específicas
            if ($var -eq "NEXT_PUBLIC_SUPABASE_URL" -or $var -eq "SUPABASE_URL") {
                if ($value -notmatch "^https://.*\.supabase\.co$") {
                    Write-Host "       [AVISO] URL pode estar incorreta (deve ser https://*.supabase.co)" -ForegroundColor Yellow
                }
            }
            
            if ($var -eq "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY") {
                if ($value -notmatch "^eyJ") {
                    Write-Host "       [AVISO] Chave pode estar incorreta (deve comecar com 'eyJ')" -ForegroundColor Yellow
                }
            }
            
            if ($var -eq "SUPABASE_SECRET_KEY") {
                if ($value -notmatch "^(sb_secret_|eyJ)") {
                    Write-Host "       [AVISO] Chave secreta pode estar incorreta (deve comecar com 'sb_secret_' ou 'eyJ')" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "  [ERRO] $var" -ForegroundColor Red
        Write-Host "          Variavel nao encontrada no arquivo!" -ForegroundColor Gray
        $errors += "$var nao encontrada"
    }
    Write-Host ""
}

# Verificar variáveis opcionais
Write-Host "Verificando variaveis opcionais..." -ForegroundColor Yellow
Write-Host ""

$optionalVars = @{
    "UPSTASH_REDIS_REST_URL" = "URL do Redis Upstash"
    "UPSTASH_REDIS_REST_TOKEN" = "Token do Redis Upstash"
    "N8N_WEBHOOK_URL" = "URL do webhook N8N"
    "NEXT_PUBLIC_API_URL" = "URL base da API"
}

foreach ($var in $optionalVars.Keys) {
    if ($content -match "$var=(.+)") {
        $value = $matches[1].Trim()
        if ($value -match "sua_|your_|example|aqui|here|SEU_|YOUR_|EXAMPLE" -or $value -eq "") {
            Write-Host "  [INFO] $var - Nao configurado (opcional)" -ForegroundColor Gray
        } else {
            Write-Host "  [OK] $var - Configurado" -ForegroundColor Green
        }
    } else {
        Write-Host "  [INFO] $var - Nao encontrado (opcional)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "[OK] Variaveis configuradas ($($success.Count)):" -ForegroundColor Green
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
    Write-Host "[AVISO] Corrija os erros antes de executar o projeto!" -ForegroundColor Red
    exit 1
}

if ($warnings.Count -eq 0 -and $errors.Count -eq 0) {
    Write-Host "[OK] Todas as variaveis obrigatorias estao configuradas corretamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximo passo: Execute 'npm run dev' para testar" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "[AVISO] Algumas variaveis ainda precisam ser preenchidas." -ForegroundColor Yellow
    Write-Host "Consulte PREENCHE_ENV_PASSO_A_PASSO.md para instrucoes detalhadas." -ForegroundColor Cyan
    exit 0
}







