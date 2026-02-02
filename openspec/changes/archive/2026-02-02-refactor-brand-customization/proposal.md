# Change: Refatorar Sistema de Customização de Marca

## Why

O sistema atual de customização de marca (brand customization) apresenta falhas críticas de comunicação entre componentes. Quando o usuário faz upload de uma logo, ela é salva corretamente no Supabase Storage e no banco de dados, porém **não é atualizada automaticamente na sidebar** nem em outros componentes do sistema. Isso causa uma experiência de usuário frustrante onde parece que o upload não funcionou.

## What Changes

### Arquitetura de Estado
- **BREAKING**: Refatorar `TenantLogo` para consumir dados do `TenantBrandingProvider` em vez de buscar individualmente
- Implementar sistema de eventos para notificação de atualizações em tempo real
- Adicionar cache-busting para URLs de imagens após upload

### Componentes Afetados
- `TenantLogo` - Será refatorado para usar context do provider
- `TenantBrandingProvider` - Adicionar método de refresh imediato e exposição de logos
- `BrandCustomizationPanel` - Integrar com provider para propagar atualizações
- `LogoUploadComponent` - Adicionar callback de sucesso para trigger de refresh
- `EmpresaSidebar` - Garantir que recebe atualizações do provider

### APIs
- Adicionar timestamp/hash na URL da logo para cache-busting
- Manter endpoints existentes compatíveis

### Sincronização Cross-Tab
- Corrigir integração com `BrandingSyncManager`
- Garantir que atualizações propagam entre abas do navegador

## Impact

- **Affected specs**: brand-customization (nova capability)
- **Affected code**:
  - [tenant-logo.tsx](components/shared/tenant-logo.tsx)
  - [tenant-branding-provider.tsx](components/providers/tenant-branding-provider.tsx)
  - [brand-customization-panel.tsx](components/brand-customization/brand-customization-panel.tsx)
  - [logo-upload-component.tsx](components/brand-customization/logo-upload-component.tsx)
  - [empresa-sidebar.tsx](components/layout/empresa-sidebar.tsx)
  - [logo-manager.ts](backend/services/brand-customization/logo-manager.ts)
- **Breaking changes**: Componentes que usam `TenantLogo` diretamente sem o provider precisarão ser atualizados
- **Migration**: Garantir que `TenantBrandingProvider` envolve toda a aplicação autenticada

## Success Criteria

1. Ao fazer upload de uma logo, ela deve aparecer imediatamente na sidebar sem necessidade de refresh da página
2. Atualizações de branding devem sincronizar entre abas do navegador em menos de 2 segundos
3. O sistema deve manter fallback para logo padrão quando não houver customização
4. Não deve haver regressão nos uploads de logo (salvamento no storage e banco)
