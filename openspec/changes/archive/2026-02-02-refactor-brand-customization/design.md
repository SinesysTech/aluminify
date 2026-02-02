# Design: Refatoração do Sistema de Customização de Marca

## Context

### Problema Atual

O sistema de customização de marca tem os seguintes componentes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ARQUITETURA ATUAL (QUEBRADA)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [BrandCustomizationPanel]        [EmpresaSidebar]                     │
│         │                                │                              │
│         │ handleLogoUpload()             │ renderiza                   │
│         ▼                                ▼                              │
│  [LogoUploadComponent]            [TenantLogo]                         │
│         │                                │                              │
│         │ POST /api/.../logos            │ useEffect([empresaId])      │
│         ▼                                ▼                              │
│  [Supabase Storage + DB]          [GET /api/.../public]                │
│         │                                │                              │
│         ▼                                │                              │
│  setBrandingState() ──────╳─────────────→│                              │
│  (local apenas)         NÃO CONECTADO    │                              │
│                                          │                              │
└─────────────────────────────────────────────────────────────────────────┘
```

**Falhas identificadas:**
1. `TenantLogo` busca logo independentemente e não recebe atualizações
2. `TenantBrandingProvider` existe mas não é utilizado pelo `TenantLogo`
3. Após upload, apenas o estado local do painel é atualizado
4. Cache do navegador pode servir imagem antiga mesmo após re-fetch

### Stakeholders
- Administradores de empresa (configuram a marca)
- Todos os usuários autenticados (veem a marca na sidebar)
- Sistema (precisa aplicar branding consistentemente)

## Goals / Non-Goals

### Goals
- Garantir atualização imediata da logo em todos os componentes após upload
- Manter sincronização entre múltiplas abas do navegador
- Preservar performance (não fazer fetches desnecessários)
- Manter compatibilidade com fluxo de fallback para logo padrão

### Non-Goals
- Implementar real-time via WebSockets (complexidade desnecessária para este caso)
- Mudar estrutura de armazenamento no Supabase
- Modificar APIs existentes (manter retrocompatibilidade)

## Decisions

### Decision 1: TenantLogo consumirá dados do TenantBrandingProvider

**O que:** Refatorar `TenantLogo` para usar o contexto do provider em vez de fazer fetch próprio.

**Por que:**
- Centraliza a fonte de verdade em um único lugar
- Permite que atualizações propaguem automaticamente via React context
- Elimina duplicação de lógica de fetching

**Alternativas consideradas:**
1. ~~Event bus global~~ - Adiciona complexidade e não é idiomático em React
2. ~~Polling mais frequente~~ - Desperdiça recursos e ainda tem delay
3. **Context React** (escolhido) - Solução idiomática, performance otimizada pelo React

### Decision 2: Cache-busting via timestamp na URL

**O que:** Adicionar parâmetro `?v={timestamp}` na URL da logo após upload.

**Por que:**
- Supabase Storage tem cache de 1 hora (cacheControl: 3600)
- Forçar novo fetch sem esperar expiração do cache
- Solução simples e eficaz

**Implementação:**
```typescript
// Após upload bem-sucedido
const logoUrlWithCacheBust = `${logoUrl}?v=${Date.now()}`;
```

### Decision 3: Refresh imediato após upload

**O que:** Chamar `refreshBranding()` do provider imediatamente após upload bem-sucedido.

**Por que:**
- Garante que todos os componentes conectados ao provider recebam os dados atualizados
- Mantém consistência de estado em toda a aplicação

### Decision 4: Manter TenantLogo com fallback standalone

**O que:** `TenantLogo` terá dois modos:
1. **Modo conectado**: Usa dados do provider (quando dentro do provider)
2. **Modo standalone**: Faz fetch próprio (para páginas de login sem auth)

**Por que:**
- Páginas de login não têm usuário autenticado
- Não podem usar o provider que depende de `user.empresaId`
- Mantém componente flexível para diferentes contextos

## Architecture

### Nova Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       ARQUITETURA PROPOSTA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [TenantBrandingProvider]  ◄────────── Fonte única de verdade          │
│         │                                                               │
│         ├──► currentBranding.logos.sidebar                             │
│         ├──► currentBranding.logos.login                               │
│         ├──► currentBranding.logos.favicon                             │
│         │                                                               │
│         ▼ refreshBranding()                                            │
│         │                                                               │
│  ┌──────┴───────┬────────────────┬─────────────────┐                   │
│  │              │                │                 │                   │
│  ▼              ▼                ▼                 ▼                   │
│ [Sidebar]   [Header]    [BrandPanel]      [CrossTab]                   │
│    │           │              │                │                       │
│    └───────────┴──────────────┴────────────────┘                       │
│                       │                                                 │
│                       ▼                                                 │
│              [TenantLogo] (conectado ao context)                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE UPLOAD                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Usuário seleciona arquivo                                          │
│         │                                                               │
│         ▼                                                               │
│  2. LogoUploadComponent.handleFileSelect()                             │
│         │                                                               │
│         ▼                                                               │
│  3. POST /api/tenant-branding/{id}/logos                               │
│         │                                                               │
│         ▼                                                               │
│  4. Upload Supabase Storage + Save DB                                  │
│         │                                                               │
│         ▼                                                               │
│  5. Retorna { success: true, logoUrl }                                 │
│         │                                                               │
│         ▼                                                               │
│  6. BrandCustomizationPanel recebe resposta                            │
│         │                                                               │
│         ├──► setBrandingState() (local)                                │
│         │                                                               │
│         └──► refreshBranding() (NOVO - provider)                       │
│                   │                                                     │
│                   ▼                                                     │
│  7. Provider atualiza currentBranding                                  │
│         │                                                               │
│         ├──► Sidebar atualiza (via context)                            │
│         ├──► Outros componentes atualizam                              │
│         └──► triggerCrossTabUpdate()                                   │
│                   │                                                     │
│                   ▼                                                     │
│  8. Outras abas recebem evento e atualizam                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mudanças nos Componentes

#### TenantBrandingProvider

```typescript
// Adicionar exposição de logos individuais
interface TenantBrandingContextType {
  // ... existentes ...
  logos: {
    login: string | null;
    sidebar: string | null;
    favicon: string | null;
  };
  getLogoUrl: (type: LogoType) => string | null;
}
```

#### TenantLogo

```typescript
// Novo comportamento
function TenantLogo({ logoType, empresaId, ... }) {
  // Tentar usar context primeiro
  const brandingContext = useTenantBrandingOptional();

  // Se context disponível e empresaId coincide, usar dados do context
  if (brandingContext && brandingContext.currentBranding) {
    const logoUrl = brandingContext.getLogoUrl(logoType);
    // Renderizar com logoUrl do context
  }

  // Fallback: modo standalone para páginas sem provider
  // Manter lógica atual de fetch
}
```

#### BrandCustomizationPanel

```typescript
// Após upload bem-sucedido
const handleLogoUpload = async (file, type) => {
  const result = await uploadLogo(file, type);

  if (result.success) {
    // 1. Atualizar estado local (preview imediato)
    setBrandingState(prev => ({ ... }));

    // 2. NOVO: Refresh do provider (propaga para toda app)
    await refreshBranding();

    // 3. NOVO: Notificar outras abas
    triggerCrossTabUpdate();
  }
};
```

## Risks / Trade-offs

### Risk 1: Componentes órfãos fora do provider
- **Risco:** Componentes que usam TenantLogo fora do provider não receberão atualizações
- **Mitigação:** TenantLogo manterá modo standalone como fallback
- **Detecção:** Criar hook `useTenantBrandingOptional` que retorna null se fora do context

### Risk 2: Performance com muitos re-renders
- **Risco:** Atualização do context pode causar re-renders desnecessários
- **Mitigação:**
  - Usar `useMemo` para valores do context
  - Separar logos em sub-context se necessário
  - Componentes devem usar seletores específicos (`getLogoUrl`)

### Risk 3: Race condition entre upload e refresh
- **Risco:** Refresh pode buscar dados antes do banco ser atualizado
- **Mitigação:** Aguardar resposta do POST antes de chamar refresh (garantido pela sequência async/await)

### Trade-off: Complexidade vs Simplicidade
- **Trade-off:** Adicionar lógica de dois modos (connected/standalone) no TenantLogo
- **Justificativa:** Necessário para suportar páginas de login sem autenticação
- **Decisão:** Aceitar complexidade adicional em favor de flexibilidade

## Migration Plan

### Fase 1: Preparação (sem breaking changes)
1. Adicionar exposição de logos no TenantBrandingProvider
2. Criar hook `useTenantBrandingOptional`
3. Adicionar testes para novo comportamento

### Fase 2: Migração do TenantLogo
1. Refatorar TenantLogo para usar context quando disponível
2. Manter fallback standalone
3. Testar em todas as páginas que usam o componente

### Fase 3: Integração do Upload
1. Modificar BrandCustomizationPanel para chamar refreshBranding
2. Adicionar cache-busting na URL
3. Testar fluxo completo de upload

### Fase 4: Sincronização Cross-Tab
1. Verificar integração com BrandingSyncManager
2. Testar sincronização entre abas
3. Ajustar timing se necessário

### Rollback
- Se problemas críticos: reverter para versão anterior do TenantLogo
- Componentes afetados são isolados, rollback parcial é possível
- Manter branch separada até validação completa

## Open Questions

1. **Polling:** Manter polling de 30s como backup ou remover após implementação do context?
   - **Proposta:** Manter como fallback para casos edge (ex: usuário em aba inativa por muito tempo)

2. **Favicon:** Aplicar favicon automaticamente após upload ou manter manual?
   - **Proposta:** Aplicar automaticamente via `document.head`

3. **Animação:** Adicionar transição suave ao trocar logo ou troca instantânea?
   - **Proposta:** Troca instantânea (simplicidade) - animação pode ser adicionada depois se desejado
