# Plano de Estruturação Mobile - Área do Aluno

## 📱 Análise da Estrutura Atual

### Componentes com Suporte Mobile Parcial
- ✅ Sidebar: Já usa Sheet para mobile
- ✅ AlunoTable: Já tem versão mobile com cards
- ✅ Layout Dashboard: Já usa breakpoints responsivos
- ⚠️ TobIAs (Chat): Precisa otimização mobile
- ⚠️ Cronograma: Dashboard e Lista precisam adaptação (Kanban foi removido)
- ⚠️ Calendário: Precisa versão mobile otimizada
- ⚠️ Tabelas (Professores, Cursos, Disciplinas, Segmentos): Precisam versão mobile
- ⚠️ Conteúdos Programáticos: Precisa adaptação mobile
- ⚠️ Formulários: Precisam otimização para mobile

---

## 🎯 Princípios de UX Mobile

### 1. Navegação
- **Bottom Navigation Bar** para acesso rápido às funcionalidades principais
- **Sidebar** permanece como menu secundário (acessível via hamburger)
- **Breadcrumbs** simplificados ou removidos em mobile
- **Header** compacto com ações essenciais

### 2. Layout e Espaçamento
- **Padding reduzido**: `p-2` em mobile vs `p-4` em desktop
- **Gaps menores**: `gap-2` em mobile vs `gap-4` em desktop
- **Cards full-width** em mobile
- **Scroll horizontal** apenas quando necessário (tabelas)

### 3. Interações
- **Touch targets**: Mínimo 44x44px (Apple) / 48x48px (Material)
- **Gestos**: Swipe para ações rápidas (quando aplicável)
- **Feedback visual**: Estados de loading, sucesso e erro bem visíveis
- **Bottom sheets** para ações secundárias

### 4. Conteúdo
- **Hierarquia visual clara**: Títulos maiores, espaçamento adequado
- **Informações essenciais primeiro**: Ocultar detalhes secundários
- **Tabs horizontais** com scroll quando necessário
- **Accordions** para conteúdo expansível

---

## 📋 Estruturação por Página/Componente

### 1. Layout Principal (`app/(dashboard)/layout.tsx`)

**Mudanças:**
- ✅ Header já responsivo (usa `md:` breakpoints)
- ⚠️ Adicionar Bottom Navigation Bar para mobile
- ⚠️ Otimizar padding e gaps para mobile
- ⚠️ Breadcrumb: Ocultar em mobile ou simplificar

**Implementação:**
```tsx
// Bottom Navigation (apenas mobile)
<nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
  {/* Ícones principais: TobIAs, Calendário, Cronograma, Perfil */}
</nav>
```

---

### 2. Sidebar (`components/app-sidebar.tsx`)

**Status:** ✅ Já usa Sheet para mobile

**Melhorias:**
- Garantir que Sheet funcione bem em mobile
- Ícones maiores para touch
- Menu mais compacto

---

### 3. TobIAs - Chat (`app/(dashboard)/tobias/page.tsx`)

**Problemas Identificados:**
- Painel de conversas ocupa muito espaço em mobile
- Input de mensagem pode ser melhorado
- Anexos precisam melhor visualização

**Soluções:**
- **Conversas Panel**: Sheet lateral (slide-in) em mobile
- **Chat principal**: Full-width quando conversas fechadas
- **Input**: Fixo no bottom com melhor UX
- **Anexos**: Preview em grid compacto
- **Mensagens**: Melhor espaçamento e legibilidade

**Implementação:**
```tsx
// Mobile: Sheet para conversas
<Sheet open={conversationsPanelOpen} onOpenChange={setConversationsPanelOpen}>
  <SheetContent side="left" className="w-full sm:w-80">
    <ConversationsPanel />
  </SheetContent>
</Sheet>

// Chat principal full-width em mobile
<div className="flex-1 flex flex-col">
  {/* Mensagens */}
  {/* Input fixo no bottom */}
</div>
```

---

### 4. Cronograma - Dashboard (`components/schedule-dashboard.tsx`)

**Problemas Identificados:**
- Cards de resumo muito grandes
- Botões de ação em grid podem ser melhorados
- Tabs precisam scroll horizontal
- Informações muito densas

**Soluções:**
- **Cards de resumo**: Stack vertical em mobile
- **Botões de ação**: Scroll horizontal ou dropdown
- **Tabs**: Scroll horizontal com indicador
- **Resumo de configuração**: Accordion em mobile
- **Estatísticas**: Layout mais compacto

**Implementação:**
```tsx
// Cards responsivos
<div className="flex flex-col md:flex-row gap-2 md:gap-4">
  {/* Cards empilhados em mobile */}
</div>

// Tabs com scroll
<TabsList className="overflow-x-auto">
  {/* Scroll horizontal em mobile */}
</TabsList>
```

---

### 5. Cronograma - Lista (`components/schedule-list.tsx`)

**Problemas Identificados:**
- Accordions podem ser melhorados
- Informações por item muito densas
- Checkboxes pequenos

**Soluções:**
- **Accordions**: Melhor espaçamento e touch targets
- **Itens**: Layout mais limpo, informações essenciais
- **Checkboxes**: Tamanho maior (44x44px mínimo)
- **Ações**: Botões maiores e mais acessíveis

---

### 6. Cronograma - Kanban (`components/schedule-kanban.tsx`) - ⚠️ REMOVIDO

**Status**: Esta funcionalidade foi removida do sistema. A visualização kanban não está mais disponível.

**Alternativas disponíveis:**
- **Lista**: Visualização em lista (`components/schedule-list.tsx`)
- **Calendário**: Visualização em calendário (`/aluno/cronograma/calendario`)
- **Dashboard**: Dashboard do cronograma (`components/schedule-dashboard.tsx`)

---

### 7. Calendário (`app/(dashboard)/aluno/cronograma/calendario/page.tsx`)

**Problemas Identificados:**
- Calendário pode ser muito pequeno
- Navegação entre meses difícil
- Eventos podem ser difíceis de tocar

**Soluções:**
- **Calendário**: Full-width, dias maiores
- **Navegação**: Botões grandes e claros
- **Eventos**: Cards clicáveis maiores
- **Modal**: Sheet para detalhes do evento

---

### 8. Tabelas (Alunos, Professores, Cursos, Disciplinas, Segmentos)

**Status:** ✅ AlunoTable já tem versão mobile

**Aplicar padrão para outras tabelas:**
- **Mobile**: Cards com informações essenciais
- **Desktop**: Tabela tradicional
- **Ações**: Dropdown menu ou botões inline maiores
- **Filtros**: Sheet ou modal em mobile

**Padrão:**
```tsx
{/* Mobile Card View */}
<div className="block md:hidden space-y-3">
  {data.map((item) => (
    <Card key={item.id}>
      {/* Informações essenciais */}
      {/* Ações */}
    </Card>
  ))}
</div>

{/* Desktop Table View */}
<div className="hidden md:block">
  <Table>{/* ... */}</Table>
</div>
```

---

### 9. Conteúdos Programáticos (`app/(dashboard)/conteudos/conteudos-client.tsx`)

**Problemas Identificados:**
- Formulário de upload muito longo
- Tabelas de módulos/aulas pequenas
- Accordions podem ser melhorados

**Soluções:**
- **Formulário**: Steps ou accordions
- **Tabelas**: Cards em mobile
- **Upload**: Melhor feedback visual
- **Visualização**: Layout mais compacto

---

### 10. Perfil (`app/(dashboard)/perfil/page.tsx`)

**Problemas Identificados:**
- Formulário longo
- Avatar upload pode ser melhorado

**Soluções:**
- **Formulário**: Seções com separadores claros
- **Avatar**: Preview maior, upload mais intuitivo
- **Campos**: Stack vertical, labels acima dos inputs

---

### 11. Formulários Gerais

**Melhorias:**
- **Labels**: Sempre acima dos inputs em mobile
- **Inputs**: Tamanho adequado (mínimo 44px altura)
- **Botões**: Full-width em mobile ou tamanho adequado
- **Selects**: Melhor visualização em mobile
- **DatePicker**: Modal full-screen em mobile

---

## 🎨 Componentes Reutilizáveis a Criar

### 1. BottomNavigation
```tsx
// components/bottom-navigation.tsx
// Barra de navegação inferior para mobile
```

### 2. MobileCardView
```tsx
// components/mobile-card-view.tsx
// Wrapper para exibir dados em cards em mobile
```

### 3. ResponsiveContainer
```tsx
// components/responsive-container.tsx
// Container com padding/gaps responsivos
```

### 4. MobileSheet
```tsx
// components/mobile-sheet.tsx
// Sheet otimizado para mobile
```

---

## 📐 Breakpoints e Espaçamentos

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px (tablet)
- `lg`: 1024px
- `xl`: 1280px

### Espaçamentos Mobile
- **Padding**: `p-2` (8px) em mobile, `p-4` (16px) em desktop
- **Gaps**: `gap-2` (8px) em mobile, `gap-4` (16px) em desktop
- **Margins**: Reduzidos proporcionalmente

### Tamanhos de Fonte
- **Títulos**: `text-xl` em mobile, `text-2xl` em desktop
- **Corpo**: `text-sm` em mobile, `text-base` em desktop
- **Labels**: `text-xs` em mobile, `text-sm` em desktop

---

## ✅ Checklist de Implementação

### Fase 1: Base e Navegação
- [ ] Criar BottomNavigation component
- [ ] Otimizar Layout principal para mobile
- [ ] Melhorar Sidebar mobile (Sheet)
- [ ] Ajustar Header para mobile

### Fase 2: Páginas Principais
- [ ] Otimizar TobIAs (Chat) para mobile
- [ ] Adaptar Dashboard de Cronograma
- [ ] Melhorar Lista de Cronograma
- [x] ~~Adaptar Kanban ou criar alternativa mobile~~ (REMOVIDO)
- [ ] Otimizar Calendário

### Fase 3: Tabelas e Formulários
- [ ] Aplicar padrão mobile para todas as tabelas
- [ ] Otimizar formulários para mobile
- [ ] Melhorar DatePicker em mobile
- [ ] Otimizar Selects em mobile

### Fase 4: Componentes Específicos
- [ ] Adaptar Conteúdos Programáticos
- [ ] Otimizar Perfil
- [ ] Melhorar Upload de arquivos
- [ ] Otimizar Dialogs/Modals para mobile

### Fase 5: Polimento
- [ ] Testar em diferentes tamanhos de tela
- [ ] Ajustar touch targets
- [ ] Melhorar feedback visual
- [ ] Otimizar performance mobile
- [ ] Testar gestos e interações

---

## 🚀 Prioridades

### Alta Prioridade
1. Bottom Navigation
2. TobIAs (Chat) mobile
3. Cronograma Dashboard mobile
4. Tabelas mobile (padrão)

### Média Prioridade
5. Calendário mobile
6. ~~Kanban alternativa mobile~~ (REMOVIDO)
7. Formulários mobile
8. Conteúdos Programáticos mobile

### Baixa Prioridade
9. Perfil mobile (já funcional)
10. Polimento e animações

---

## 📝 Notas Técnicas

### Performance Mobile
- Lazy loading de componentes pesados
- Virtual scrolling para listas longas
- Debounce em inputs de busca
- Otimizar imagens e assets

### Acessibilidade
- Touch targets mínimos (44x44px)
- Contraste adequado
- Navegação por teclado (quando aplicável)
- Screen reader friendly

### Testes
- Testar em dispositivos reais (iOS e Android)
- Diferentes tamanhos de tela
- Orientação portrait e landscape
- Diferentes navegadores mobile

---

## ❓ Questões para Decisão

1. **Bottom Navigation**: Quais itens incluir? (TobIAs, Calendário, Cronograma, Perfil?)
2. ~~**Kanban Mobile**: Criar alternativa de lista ou manter scroll horizontal?~~ (REMOVIDO)
3. **Calendário Mobile**: Usar biblioteca específica ou componente custom?
4. **Gestos**: Implementar swipe para ações ou manter botões?
5. **Offline**: Considerar suporte offline para mobile?

---

## 📚 Referências

- [Material Design - Mobile](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Mobile UX Best Practices](https://www.nngroup.com/articles/mobile-ux/)
- [Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)


