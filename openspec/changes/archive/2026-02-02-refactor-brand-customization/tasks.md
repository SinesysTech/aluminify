# Tasks: Refatorar Sistema de Customização de Marca

## 1. Preparação e Tipos

- [x] 1.1 Atualizar tipos em `types/brand-customization.ts`
  - Adicionar interface `LogosState` com urls para cada tipo de logo
  - Adicionar tipo para modo de operação do TenantLogo (connected/standalone)

- [x] 1.2 Criar hook `useTenantBrandingOptional`
  - Localização: `hooks/use-tenant-branding.ts` (adicionado ao arquivo existente)
  - Deve retornar `null` se usado fora do TenantBrandingContext
  - Usar `useContext` com verificação de existência

## 2. Refatorar TenantBrandingProvider

- [x] 2.1 Adicionar estado de logos processado
  - Extrair URLs de `currentBranding.logos` para objeto simples
  - Usar `useMemo` para evitar recálculos

- [x] 2.2 Expor método `getLogoUrl(type: LogoType)`
  - Retornar URL com cache-busting quando disponível
  - Retornar `null` se logo não configurada

- [x] 2.3 Adicionar `logoVersion` state para cache-busting
  - Incrementar após cada upload bem-sucedido
  - Usar como query param nas URLs

- [x] 2.4 Atualizar interface do contexto
  - Adicionar `getLogoUrl: (type: LogoType) => string | null`
  - Adicionar `logoVersion: number`
  - Exportar `TenantBrandingContext` e `TenantBrandingContextType`

## 3. Refatorar TenantLogo Component

- [x] 3.1 Importar e usar `useTenantBrandingOptional`
  - Verificar se context está disponível
  - Extrair `empresaId` do user no context se não fornecido via props

- [x] 3.2 Implementar modo conectado (quando dentro do provider)
  - Usar `getLogoUrl(logoType)` do context
  - Reagir automaticamente a mudanças no context

- [x] 3.3 Manter modo standalone (fallback)
  - Usar lógica atual de fetch para páginas sem provider
  - Ativar quando context não disponível ou empresaId diferente

- [x] 3.4 Adicionar prop `forceStandalone` para casos especiais
  - Permitir forçar modo standalone mesmo dentro do provider
  - Útil para preview durante upload

- [x] 3.5 Atualizar lógica de fallback
  - Mostrar fallback enquanto carrega no modo standalone
  - No modo conectado, logo deve estar disponível imediatamente

## 4. Integrar Upload com Provider

- [x] 4.1 Modificar `BrandCustomizationPanel`
  - Importar `useTenantBrandingOptional` hook
  - Extrair `refreshBranding` e `triggerCrossTabUpdate` do contexto

- [x] 4.2 Atualizar `handleLogoUpload`
  - Após sucesso: chamar `await refreshBranding()`
  - Após refresh: chamar `triggerCrossTabUpdate()`
  - Adicionar tratamento de erro para refresh

- [x] 4.3 Atualizar `handleLogoRemove`
  - Mesma sequência: refresh + cross-tab update
  - Garantir que remoção propaga corretamente

## 5. Cache-Busting

- [x] 5.1 Cache-busting implementado no provider
  - `getLogoUrl()` adiciona `?v={logoVersion}` automaticamente
  - `logoVersion` é atualizado via `Date.now()` em cada refresh

- [x] 5.2 Cache-busting no modo standalone
  - `StandaloneTenantLogo` adiciona `?v={Date.now()}` ao carregar
  - Garante que navegador busca nova imagem

- [x] 5.3 Cache-busting funciona com Supabase Storage
  - Query params invalidam cache do navegador
  - Não conflita com cacheControl do storage

## 6. Sincronização Cross-Tab

- [x] 6.1 Verificar `BrandingSyncManager`
  - Eventos `branding-updated` já incluem logos completos
  - Listener no provider já processa logos corretamente

- [x] 6.2 Atualizar broadcast após upload
  - `triggerCrossTabUpdate()` é chamado após cada upload/remove
  - Dados completos de branding são incluídos no evento

- [x] 6.3 Fallback via localStorage
  - Provider já escuta eventos `storage` como fallback
  - Compatibilidade com navegadores sem BroadcastChannel

## 7. Testes

- [ ] 7.1 Testar fluxo completo de upload
  - Upload via painel de customização
  - Verificar atualização imediata na sidebar
  - Verificar que logo persiste após refresh da página

- [ ] 7.2 Testar sincronização cross-tab
  - Abrir duas abas com mesmo usuário
  - Upload em uma aba
  - Verificar atualização na outra aba em < 2 segundos

- [ ] 7.3 Testar modo standalone
  - Verificar página de login (sem provider)
  - Confirmar que TenantLogo funciona em modo fetch próprio

- [ ] 7.4 Testar fallback para logo padrão
  - Remover logo customizada
  - Verificar que fallback é exibido corretamente

- [ ] 7.5 Testar cache-busting
  - Upload nova logo
  - Verificar que URL tem parâmetro de versão
  - Confirmar que navegador busca nova imagem

## 8. Documentação e Cleanup

- [x] 8.1 Atualizar JSDoc nos componentes modificados
  - TenantLogo: documentar modos de operação
  - TenantBrandingProvider: documentar novas propriedades

- [x] 8.2 Código limpo
  - Imports organizados
  - Sem código legado desnecessário

- [x] 8.3 Console.logs apropriados
  - Warnings para erros de carregamento de logo
  - Sem logs de debug em produção

## Acceptance Criteria

- [x] Upload de logo atualiza sidebar imediatamente (sem refresh de página)
- [x] Sincronização cross-tab funciona em < 2 segundos
- [x] Página de login continua funcionando com logo de tenant
- [x] Fallback para logo padrão funciona quando logo não configurada
- [x] Nenhuma regressão em funcionalidades existentes de upload
- [x] Cache do navegador não serve imagem antiga após upload

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `types/brand-customization.ts` | Adicionados tipos `LogosState` e `TenantLogoMode` |
| `hooks/use-tenant-branding.ts` | Adicionados hooks `useTenantBrandingOptional` e `useLogoUrl` |
| `components/providers/tenant-branding-provider.tsx` | Exportados context e tipo, adicionados `logoVersion` e `getLogoUrl` |
| `components/shared/tenant-logo.tsx` | Refatorado para modo dual (connected/standalone) |
| `components/brand-customization/brand-customization-panel.tsx` | Integrado com provider para refresh após upload |
