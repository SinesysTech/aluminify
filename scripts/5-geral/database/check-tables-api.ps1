# Script PowerShell para verificar tabelas usando a API route
# Requer que voce esteja autenticado como superadmin

Write-Host "Verificando tabelas via API..." -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:3000/api/superadmin/check-empty-tables"

Write-Host "Fazendo requisicao para: $apiUrl" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "Resposta recebida:" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Resultados:" -ForegroundColor Cyan
    Write-Host "   1. auth.users: $($response.data.'auth.users')"
    Write-Host "   2. public.alunos: $($response.data.'public.alunos')"
    Write-Host "   3. public.professores: $($response.data.'public.professores')"
    Write-Host "   4. public.empresa_admins: $($response.data.'public.empresa_admins')"
    Write-Host ""
    
    if ($response.summary.allEmpty) {
        Write-Host "Todas as tabelas verificadas estao vazias (exceto auth.users)" -ForegroundColor Green
    } else {
        Write-Host "Algumas tabelas contem dados:" -ForegroundColor Yellow
        if ($response.data.'public.alunos' -gt 0) {
            Write-Host "      - alunos: $($response.data.'public.alunos') registro(s)"
        }
        if ($response.data.'public.professores' -gt 0) {
            Write-Host "      - professores: $($response.data.'public.professores') registro(s)"
        }
        if ($response.data.'public.empresa_admins' -gt 0) {
            Write-Host "      - empresa_admins: $($response.data.'public.empresa_admins') registro(s)"
        }
    }
    
    if ($response.summary.note) {
        Write-Host ""
        Write-Host "Nota: $($response.summary.note)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Erro ao fazer requisicao:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Dica: Certifique-se de estar autenticado como superadmin" -ForegroundColor Yellow
    Write-Host "   E que o servidor Next.js esta rodando (npm run dev)" -ForegroundColor Yellow
}
