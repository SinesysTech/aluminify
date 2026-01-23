@echo off
cd /d "E:\Development\aluminify"
set NEXT_PUBLIC_SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co
set SUPABASE_SECRET_KEY=sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u
call npx tsx scripts/fix-transaction-products.ts
