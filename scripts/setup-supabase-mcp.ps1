# Script PowerShell para configurar o MCP do Supabase no Cursor
# Uso: .\scripts\setup-supabase-mcp.ps1 -AccessToken "SEU_ACCESS_TOKEN"

param(
    [Parameter(Mandatory=$true)]
    [string]$AccessToken
)

$PROJECT_REF = "wtqgfmtucqmpheghcvxo"
$MCP_FILE = "$env:USERPROFILE\.cursor\mcp.json"

Write-Host "🔧 Configurando MCP do Supabase no Cursor..." -ForegroundColor Cyan
Write-Host ""

# Criar backup do arquivo existente
if (Test-Path $MCP_FILE) {
    Copy-Item $MCP_FILE "$MCP_FILE.backup"
    Write-Host "✅ Backup criado: $MCP_FILE.backup" -ForegroundColor Green
}

# Criar/atualizar arquivo mcp.json
$config = @{
    mcpServers = @{
        supabase = @{
            url = "https://mcp.supabase.com/mcp?project_ref=$PROJECT_REF"
            headers = @{
                Authorization = "Bearer $AccessToken"
            }
        }
    }
} | ConvertTo-Json -Depth 10

$config | Out-File -FilePath $MCP_FILE -Encoding UTF8

Write-Host "✅ Arquivo mcp.json atualizado em: $MCP_FILE" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuração aplicada:" -ForegroundColor Cyan
Write-Host "   - Project Ref: $PROJECT_REF"
Write-Host "   - URL: https://mcp.supabase.com/mcp?project_ref=$PROJECT_REF"
Write-Host "   - Token: $($AccessToken.Substring(0, [Math]::Min(20, $AccessToken.Length)))... (oculto)"
Write-Host ""
Write-Host "🔄 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Feche completamente o Cursor"
Write-Host "   2. Abra o Cursor novamente"
Write-Host "   3. O MCP do Supabase deve estar disponível"
Write-Host ""







