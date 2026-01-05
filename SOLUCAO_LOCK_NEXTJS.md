# 🔧 Solução: Erro de Lock do Next.js

## ❌ Problema

```
⨯ Unable to acquire lock at C:\areadoaluno\.next\dev\lock, is another instance of next dev running?
```

## ✅ Solução

O erro ocorre quando há outra instância do Next.js rodando ou um arquivo de lock foi deixado para trás.

### Solução Rápida (Bash/Git Bash)

```bash
# 1. Remover o arquivo de lock
rm -f .next/dev/lock

# 2. Verificar e encerrar processos Node.js (se necessário)
pgrep -f "node"
pkill -f "node"  # Se houver processos rodando

# 3. Tentar novamente
npm run dev
```

### Solução Rápida (PowerShell)

```powershell
# 1. Remover o arquivo de lock
Remove-Item .next\dev\lock -Force -ErrorAction SilentlyContinue

# 2. Verificar e encerrar processos Node.js (se necessário)
Get-Process -Name node -ErrorAction SilentlyContinue
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Tentar novamente
npm run dev
```

### Usando o Script Automatizado

**Bash:**
```bash
./scripts/fix-nextjs-lock.sh
```

**PowerShell:**
```powershell
.\scripts\fix-nextjs-lock.ps1
```

## 🔍 Verificação

Após executar a solução, verifique:

1. ✅ Arquivo de lock removido
2. ✅ Nenhum processo Node.js rodando
3. ✅ Pode executar `npm run dev` sem erros

## 🆘 Se o Problema Persistir

1. **Limpar cache completo:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Verificar porta 3000:**
   ```bash
   # Ver o que está usando a porta 3000
   lsof -i :3000  # Linux/Mac
   netstat -ano | findstr :3000  # Windows
   ```

3. **Reiniciar o terminal/IDE**

---

**Status:** ✅ Problema resolvido! O lock foi removido.






