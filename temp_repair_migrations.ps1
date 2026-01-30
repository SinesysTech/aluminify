# Script para reparar o histórico de migrations (TEMP FIX)
# Marca as migrations locais como já aplicadas no remoto, EXCETO a que cria a tabela faltante.

$migrations = @(
    "20250120",
    "20250122",
    "20250123",
    "20250124",
    "20250127",
    "20250128",
    "20250129",
    "20250130",
    "20250131",
    "20250201",
    "20250605",
    "20251125",
    "20251206",
    "20251207",
    "20251208",
    "20251210",
    "20251217105924",
    "20251217105925",
    "20251217105926",
    "20251217105927",
    "20251217105928",
    "20251217105929",
    "20251217112720",
    "20251217120000",
    "20251217120001",
    "20251217120002",
    "20251217120003",
    "20251217120004",
    # "20251217120005", <-- Commented out so it gets applied by db push
    "20251217120006",
    "20251217120511",
    "20251217120815",
    "20260103000100",
    "20260105150836",
    "20260105152002",
    "20260105152003",
    "20260105",
    "20260107",
    "20260111191000",
    "20260112090000",
    "20260112130000",
    "20260112140000",
    "20260112143000",
    "20260112152000",
    "20260112170000",
    "20260112170500",
    "20260112171000",
    "20260113000001",
    "20260114120000"
)

foreach ($migration in $migrations) {
    Write-Host "Reparando migration $migration..."
    # Using specific status check before if possible, or just force applied
    # npx supabase migration repair --status applied $migration --linked
    # Note: --linked is usually needed for remote
    cmd /c "npx supabase migration repair --status applied $migration --linked"
}

Write-Host "Repair concluído. Agora execute remove_temp.ps1"
