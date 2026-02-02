# Tasks: Mobile-First Responsiveness

## 1. Infraestrutura de Responsividade

- [x] 1.1 Adicionar design tokens responsivos em `app/globals.css`
  - CSS custom properties com media queries por breakpoint
  - Variáveis `--space-page-x`, `--space-section`, etc.
- [x] 1.2 Criar/atualizar hook `hooks/use-breakpoint.ts`
  - Retornar `isMobile`, `isTablet`, `isDesktop`
  - Retornar breakpoint atual e width
  - Funções `isAbove()` e `isBelow()`
- [x] 1.3 Atualizar `hooks/use-mobile.ts` para usar `use-breakpoint.ts` (deprecated, re-exporta)
- [x] 1.4 Documentar padrões de responsividade em comentários do código

## 2. Componentes de Navegação

- [x] 2.1 Atualizar componente `BottomNav` (`components/layout/bottom-navigation.tsx`)
  - 4-5 itens de navegação principais por role (aluno, professor, admin)
  - Indicador de item ativo
  - Visível apenas em mobile (<768px)
  - Safe area para iPhones com notch
- [x] 2.2 Atualizar `Sidebar` para melhor UX mobile
  - Fechamento automático após navegação (pathname change)
  - Backdrop com tap para fechar (já existente)
- [x] 2.3 Header atual funciona bem em mobile
- [x] 2.4 BottomNav já integrado no layout do dashboard

## 3. Componentes Base (Touch Targets)

- [x] 3.1 Atualizar `Button` para min 44px height em mobile (h-11 md:h-9)
- [x] 3.2 Atualizar `Input`, `Select` para min 44px height em mobile
- [x] 3.3 Atualizar SelectItem para espaçamento adequado entre itens (py-2.5 md:py-1.5)
- [x] 3.4 Atualizar `Checkbox` para área de toque expandida em mobile (size-5, after pseudo-element)
- [x] 3.5 Atualizar `Badge` e elementos pequenos (melhor contraste dark mode)

## 4. Tabelas Responsivas

- [x] 4.1 Criar componente `ResponsiveTable` wrapper (`components/ui/responsive-table.tsx`)
  - Detecta viewport e renderiza Table ou CardList
  - Props: columns, data, getRowKey, renderActions
- [x] 4.2 Componente inclui visualização em cards para mobile
- [x] 4.3 `AlunoTable` já usa padrão responsivo (card view mobile, table desktop)
- [x] 4.4 `ProfessorTable` atualizado (já tinha card view, ajustado dialog max-width)
- [x] 4.5 `TurmasList` atualizado com card view para mobile

## 5. Formulários Responsivos

- [x] 5.1 Criar utilitários CSS `form-grid`, `form-grid-3`, `form-grid-4` para layouts responsivos
- [x] 5.2 Formulários de alunos já usam grid responsivo (grid-cols-1 md:grid-cols-2)
- [x] 5.3 Formulários de professores já usam grid responsivo
- [x] 5.4 `page-container`, `section-container` utilitários criados
- [x] 5.5 Classes `mobile-only`, `desktop-only`, `pb-bottom-nav` adicionadas

## 6. Modais e Dialogs

- [x] 6.1 Atualizar componente `Dialog` para suportar full-screen em mobile
  - Prop `fullScreenMobile` adicionada
  - Header com botão fechar visível e touch-friendly (size-8 md:size-6)
- [x] 6.2 Criar componente `BottomSheet` para seleção de opções em mobile
  - Suporte a seleção única e múltipla
  - Safe area para iPhones
  - Hook `useBottomSheet()` para detecção
- [x] 6.3 Dialogs existentes já usam max-w-[95vw] md:max-w-4xl

## 7. Tipografia e Espaçamento

- [x] 7.1 Design tokens responsivos com media queries por breakpoint (mobile, tablet, desktop)
- [x] 7.2 Utilitários CSS `page-container`, `section-container` criados
- [x] 7.3 Variáveis `--space-page-x`, `--space-section`, `--space-component` responsivas
- [x] 7.4 Classe `pb-bottom-nav` para compensar bottom nav em mobile

## 8. Imagens e Mídia

- [x] 8.1 Componentes existentes já usam `max-width: 100%` implicitamente via Tailwind
- [x] 8.2 Aspect ratios preservados nos componentes de gráficos

## 9. Gráficos e Charts

- [x] 9.1 Componentes de gráfico já usam ResponsiveContainer (chart.tsx)
- [x] 9.2 FocusEfficiencyChart já tem padding responsivo (px-4 md:px-6)
- [x] 9.3 Gráficos customizados (sem Recharts) já são fluidos

## 10. Páginas do Dashboard

- [x] 10.1 Dashboard do Aluno - já tem grids responsivos (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)
- [x] 10.2 Dashboard do Professor - componentes já responsivos
- [x] 10.3 Dashboard Admin - tabelas já responsivas
- [x] 10.4 Página de listagem de alunos - já responsiva (cards mobile, table desktop)
- [x] 10.5 Páginas de listagem de turmas - atualizada com cards mobile

## 11. Landing e Auth

- [x] 11.1 Landing page já responsiva
  - Grids colapsáveis (md:grid-cols-3 → 1 col mobile)
  - Tipografia responsiva (text-5xl md:text-6xl lg:text-7xl)
  - Buttons flex-col sm:flex-row
- [x] 11.2 Páginas de auth responsivas
  - AuthPageLayout: área decorativa hidden em mobile
  - Formulário full-width em mobile
  - Padding responsivo p-8 md:p-12

## 12. Testes e QA

- [x] 12.1 Definir viewports de teste (documentado em RESPONSIVE-GUIDE.md)
- [ ] 12.2 Testar fluxos críticos em cada viewport (manual)
- [ ] 12.3 Verificar acessibilidade via teclado em mobile (manual)
- [ ] 12.4 Testar em dispositivos reais (iOS Safari, Android Chrome) (manual)
- [ ] 12.5 Documentar issues encontrados e corrigir (manual)

## 13. Documentação

- [x] 13.1 Criar guia de responsividade (`docs/RESPONSIVE-GUIDE.md`)
- [x] 13.2 Documentar componentes responsivos criados (JSDoc nos hooks e componentes)
- [x] 13.3 Criar checklist de responsividade (`docs/RESPONSIVE-CHECKLIST.md`)

---

## Resumo de Implementação

### Arquivos Criados
- `hooks/use-breakpoint.ts` - Hook unificado de breakpoints
- `components/ui/responsive-table.tsx` - Tabela responsiva com cards mobile
- `components/ui/bottom-sheet.tsx` - Sheet de seleção para mobile
- `docs/RESPONSIVE-GUIDE.md` - Guia completo de responsividade
- `docs/RESPONSIVE-CHECKLIST.md` - Checklist para novos componentes

### Arquivos Modificados
- `hooks/use-mobile.ts` - Re-exporta do use-breakpoint (deprecated)
- `app/globals.css` - Design tokens responsivos, utilitários CSS
- `components/ui/button.tsx` - Touch targets maiores em mobile
- `components/ui/input.tsx` - Touch targets maiores em mobile
- `components/ui/select.tsx` - Touch targets maiores em mobile
- `components/ui/checkbox.tsx` - Área de toque expandida
- `components/ui/dialog.tsx` - Prop fullScreenMobile, botão fechar maior
- `components/ui/sidebar.tsx` - Fechamento automático ao navegar
- `components/ui/badge.tsx` - Melhor contraste de texto em dark mode
- `components/layout/bottom-navigation.tsx` - Itens por role, safe area, texto maior (12px)
- `components/admin/professor-table.tsx` - Dialog max-width responsivo
- `components/turma/turmas-list.tsx` - Card view para mobile
- `components/dashboard/dashboard-header.tsx` - Texto tooltip legível (12px)
- `components/dashboard/metric-card.tsx` - Cores de trend com melhor contraste
