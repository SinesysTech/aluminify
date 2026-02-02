## 1. Remover console.log de debug do handleSubmit

- [x] 1.1 Remover `console.log('[DEBUG] handleSubmit iniciado', ...)` (linha 188)
- [x] 1.2 Remover `console.log('[DEBUG] handleSubmit cancelado: já está carregando')` (linha 191)
- [x] 1.3 Remover `console.log('[DEBUG] handleSubmit cancelado: campos vazios')` (linha 196)
- [x] 1.4 Remover `console.log('[DEBUG] Criando cliente Supabase...')` (linha 205)
- [x] 1.5 Remover `console.log('[DEBUG] Cliente Supabase criado, ...')` (linha 207)
- [x] 1.6 Remover `console.log('[DEBUG] Resultado signInWithPassword:', {...})` (linhas 214-219)
- [x] 1.7 Remover `console.log('[DEBUG] Validando pertencimento ao tenant...')` (linha 256)
- [x] 1.8 Remover `console.log('[DEBUG] Validação de tenant falhou:', ...)` (linha 265)
- [x] 1.9 Remover `console.log('[DEBUG] Identificando roles do usuário...')` (linha 277)
- [x] 1.10 Remover `console.log('[DEBUG] Role identificado, URL de destino:', ...)` (linha 282)
- [x] 1.11 Remover `console.log('[DEBUG] Login bem-sucedido, redirecionando para:', ...)` (linha 285)
- [x] 1.12 Remover `console.log('[DEBUG] Redirecionamento final:', ...)` (linha 295)
- [x] 1.13 Remover `console.log('[DEBUG] handleSubmit finalizado')` (linha 303)

## 2. Corrigir console.error no bloco catch

- [x] 2.1 Remover prefixo `[DEBUG]` do `console.error` na linha 298, mantendo a mensagem e o objeto de erro

## 3. Verificação

- [x] 3.1 Confirmar que nenhum `console.log` com `[DEBUG]` permanece no arquivo
- [x] 3.2 Confirmar que o `console.error` no catch não contém `[DEBUG]`
- [x] 3.3 Verificar que a lógica do handleSubmit permanece funcional (sem linhas removidas acidentalmente)
