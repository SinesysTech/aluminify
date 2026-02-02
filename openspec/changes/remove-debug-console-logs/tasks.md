## 1. Remover console.log de debug do handleSubmit

- [ ] 1.1 Remover `console.log('[DEBUG] handleSubmit iniciado', ...)` (linha 188)
- [ ] 1.2 Remover `console.log('[DEBUG] handleSubmit cancelado: já está carregando')` (linha 191)
- [ ] 1.3 Remover `console.log('[DEBUG] handleSubmit cancelado: campos vazios')` (linha 196)
- [ ] 1.4 Remover `console.log('[DEBUG] Criando cliente Supabase...')` (linha 205)
- [ ] 1.5 Remover `console.log('[DEBUG] Cliente Supabase criado, ...')` (linha 207)
- [ ] 1.6 Remover `console.log('[DEBUG] Resultado signInWithPassword:', {...})` (linhas 214-219)
- [ ] 1.7 Remover `console.log('[DEBUG] Validando pertencimento ao tenant...')` (linha 256)
- [ ] 1.8 Remover `console.log('[DEBUG] Validação de tenant falhou:', ...)` (linha 265)
- [ ] 1.9 Remover `console.log('[DEBUG] Identificando roles do usuário...')` (linha 277)
- [ ] 1.10 Remover `console.log('[DEBUG] Role identificado, URL de destino:', ...)` (linha 282)
- [ ] 1.11 Remover `console.log('[DEBUG] Login bem-sucedido, redirecionando para:', ...)` (linha 285)
- [ ] 1.12 Remover `console.log('[DEBUG] Redirecionamento final:', ...)` (linha 295)
- [ ] 1.13 Remover `console.log('[DEBUG] handleSubmit finalizado')` (linha 303)

## 2. Corrigir console.error no bloco catch

- [ ] 2.1 Remover prefixo `[DEBUG]` do `console.error` na linha 298, mantendo a mensagem e o objeto de erro

## 3. Verificação

- [ ] 3.1 Confirmar que nenhum `console.log` com `[DEBUG]` permanece no arquivo
- [ ] 3.2 Confirmar que o `console.error` no catch não contém `[DEBUG]`
- [ ] 3.3 Verificar que a lógica do handleSubmit permanece funcional (sem linhas removidas acidentalmente)
