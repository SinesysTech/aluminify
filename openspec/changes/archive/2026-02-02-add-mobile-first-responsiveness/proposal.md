# Change: Implementar Responsividade Mobile-First Completa

## Why
A plataforma Aluminify é acessada por alunos, professores e administradores em diversos dispositivos - especialmente smartphones. Atualmente, embora exista suporte básico a responsividade via Tailwind CSS, a experiência mobile não é otimizada. Usuários mobile enfrentam problemas de usabilidade como elementos muito pequenos, layouts quebrados em telas estreitas e navegação difícil. Implementar uma abordagem **mobile-first** garantirá que a experiência primária seja projetada para dispositivos móveis, escalando progressivamente para tablets e desktops.

## What Changes

### Infraestrutura de Responsividade
- Definir sistema de breakpoints padronizado e documentado
- Criar CSS custom properties para espaçamentos responsivos
- Implementar container queries onde apropriado
- Padronizar hook `useBreakpoint()` para lógica condicional

### Componentes de Layout
- **Sidebar:** Otimizar comportamento offcanvas em mobile, melhorar gestos de swipe
- **Header:** Criar versão compacta para mobile com menu hamburger aprimorado
- **Navegação:** Bottom navigation bar para mobile (padrão app nativo)
- **Modais/Dialogs:** Full-screen em mobile, centered em desktop

### Componentes de Dados
- **Tabelas:** Transformar em cards empilhados ou listas em mobile
- **Formulários:** Campos full-width em mobile, multi-coluna em desktop
- **Grids:** Sistema de colunas responsivo (1 col mobile → N cols desktop)
- **Charts:** Versões simplificadas para telas pequenas

### Tipografia e Touch Targets
- Escala tipográfica responsiva (fluid typography)
- Touch targets mínimos de 44x44px em elementos interativos
- Espaçamento adequado para evitar mis-taps

### Testes e QA
- Definir viewports de teste (320px, 375px, 414px, 768px, 1024px, 1440px)
- Documentar padrões de teste de responsividade

## Impact
- **Affected specs:** ui-responsiveness (nova capability)
- **Affected code:**
  - `app/globals.css` (design tokens responsivos)
  - `components/ui/*` (todos os componentes base)
  - `components/layout/*` (sidebar, header, navigation)
  - `hooks/use-mobile.ts` → `hooks/use-breakpoint.ts` (upgrade)
  - Todas as páginas do dashboard
  - Landing page e páginas de auth
- **Breaking changes:** Nenhum. Mudanças são progressivas e backwards-compatible.
