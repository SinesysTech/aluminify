# UI Responsiveness

Especificação para comportamento responsivo da interface em diferentes tamanhos de tela.

## ADDED Requirements

### Requirement: Breakpoint System
O sistema DEVE definir breakpoints consistentes para diferentes tamanhos de dispositivo, seguindo a abordagem mobile-first onde estilos base são para mobile e são progressivamente aprimorados para telas maiores.

#### Scenario: Breakpoints padrão disponíveis
- **WHEN** um desenvolvedor utiliza classes Tailwind
- **THEN** os seguintes breakpoints estão disponíveis: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)

#### Scenario: Aliases semânticos de breakpoint
- **WHEN** lógica condicional é necessária via JavaScript
- **THEN** o hook useBreakpoint() retorna isMobile (<768px), isTablet (768-1023px), isDesktop (>=1024px)

---

### Requirement: Mobile Navigation
O sistema DEVE fornecer navegação otimizada para dispositivos móveis através de uma bottom navigation bar, garantindo acesso rápido às funcionalidades principais sem obscurecer o conteúdo.

#### Scenario: Bottom nav visível em mobile
- **WHEN** a viewport é menor que 768px
- **THEN** uma bottom navigation bar é exibida com no máximo 5 itens
- **AND** a barra permanece fixa na parte inferior da tela

#### Scenario: Bottom nav oculto em desktop
- **WHEN** a viewport é 768px ou maior
- **THEN** a bottom navigation bar NÃO é exibida
- **AND** o sidebar lateral é utilizado para navegação

#### Scenario: Navegação acessível via teclado
- **WHEN** usuário navega via Tab no mobile
- **THEN** os itens da bottom nav são focáveis e ativáveis via Enter/Space

---

### Requirement: Responsive Sidebar
O sidebar DEVE adaptar seu comportamento baseado no tamanho da tela, usando offcanvas em mobile e exibição fixa ou colapsável em desktop.

#### Scenario: Sidebar como drawer em mobile
- **WHEN** a viewport é menor que 768px
- **THEN** o sidebar é exibido como drawer/sheet deslizante
- **AND** pode ser aberto via botão hamburger ou gesto de swipe da borda

#### Scenario: Sidebar fixo em desktop
- **WHEN** a viewport é 1024px ou maior
- **THEN** o sidebar é exibido fixo ao lado do conteúdo
- **AND** pode ser colapsado para modo ícone

#### Scenario: Fechamento automático após navegação mobile
- **WHEN** usuário está em mobile e clica em um item do sidebar drawer
- **THEN** o drawer fecha automaticamente
- **AND** a navegação é executada

---

### Requirement: Touch Target Sizing
Todos os elementos interativos DEVEM ter área de toque mínima de 44x44 pixels para garantir usabilidade em dispositivos touch.

#### Scenario: Botões com tamanho mínimo
- **WHEN** um botão é renderizado em qualquer tamanho de tela
- **THEN** a área clicável/tocável tem no mínimo 44x44 pixels

#### Scenario: Links em listas com espaçamento adequado
- **WHEN** links são exibidos em lista (ex: menu, sidebar)
- **THEN** há espaçamento vertical mínimo de 8px entre itens tocáveis

#### Scenario: Inputs com altura adequada
- **WHEN** um campo de input é renderizado
- **THEN** a altura mínima é 44px em dispositivos touch

---

### Requirement: Responsive Tables
Tabelas de dados DEVEM adaptar sua apresentação para diferentes tamanhos de tela, usando formato de cards em mobile e tabela tradicional em desktop.

#### Scenario: Visualização em cards para mobile
- **WHEN** uma tabela de dados é exibida em viewport menor que 768px
- **THEN** os dados são apresentados como cards empilhados verticalmente
- **AND** cada card contém todas as informações relevantes da linha

#### Scenario: Visualização em tabela para desktop
- **WHEN** uma tabela de dados é exibida em viewport de 768px ou maior
- **THEN** os dados são apresentados em formato de tabela tradicional com colunas

#### Scenario: Ações acessíveis em ambos formatos
- **WHEN** uma linha/card tem ações disponíveis (editar, excluir, etc.)
- **THEN** as ações são acessíveis tanto no formato card quanto tabela

---

### Requirement: Responsive Forms
Formulários DEVEM adaptar seu layout para diferentes tamanhos de tela, com campos em coluna única em mobile e múltiplas colunas em desktop quando apropriado.

#### Scenario: Campos full-width em mobile
- **WHEN** um formulário é exibido em viewport menor que 768px
- **THEN** todos os campos ocupam 100% da largura disponível

#### Scenario: Layout multi-coluna em desktop
- **WHEN** um formulário é exibido em viewport de 1024px ou maior
- **AND** o formulário tem múltiplos campos relacionados
- **THEN** campos podem ser organizados em 2 ou mais colunas

#### Scenario: Labels sempre visíveis
- **WHEN** um campo de formulário é exibido em qualquer tamanho
- **THEN** o label é visível (não apenas placeholder)

---

### Requirement: Responsive Modals
Modais e dialogs DEVEM adaptar seu tamanho e posição baseado na viewport, ocupando tela cheia em mobile e centralizados com tamanho limitado em desktop.

#### Scenario: Modal full-screen em mobile
- **WHEN** um modal é aberto em viewport menor que 768px
- **THEN** o modal ocupa a tela inteira (100vw x 100vh)
- **AND** tem um botão de fechar claramente visível no header

#### Scenario: Modal centralizado em desktop
- **WHEN** um modal é aberto em viewport de 768px ou maior
- **THEN** o modal é centralizado na tela
- **AND** tem largura máxima apropriada ao conteúdo (max-w-md, max-w-lg, etc.)

#### Scenario: Drawer bottom sheet em mobile para seleções
- **WHEN** um seletor (select, combobox) é ativado em mobile
- **THEN** pode ser apresentado como bottom sheet em vez de dropdown

---

### Requirement: Responsive Typography
A tipografia DEVE escalar apropriadamente para diferentes tamanhos de tela, mantendo legibilidade e hierarquia visual.

#### Scenario: Escala de títulos responsiva
- **WHEN** um título (h1, h2, h3) é renderizado
- **THEN** o tamanho da fonte aumenta progressivamente com o tamanho da viewport

#### Scenario: Corpo de texto legível
- **WHEN** texto de parágrafo é renderizado em mobile
- **THEN** o tamanho mínimo é 16px para garantir legibilidade

#### Scenario: Line-height adequado para leitura
- **WHEN** blocos de texto são renderizados
- **THEN** o line-height é no mínimo 1.5 para corpo de texto

---

### Requirement: Responsive Spacing
Espaçamentos DEVEM se adaptar ao tamanho da tela, sendo mais compactos em mobile e mais generosos em desktop.

#### Scenario: Padding de página responsivo
- **WHEN** o conteúdo principal é renderizado
- **THEN** o padding horizontal é menor em mobile (16px) e maior em desktop (32px+)

#### Scenario: Gap entre elementos responsivo
- **WHEN** elementos em grid/flex são espaçados
- **THEN** o gap aumenta proporcionalmente ao tamanho da viewport

---

### Requirement: Responsive Images and Media
Imagens e mídia DEVEM se adaptar ao container e viewport, mantendo proporções e qualidade visual.

#### Scenario: Imagens fluid
- **WHEN** uma imagem é inserida em conteúdo
- **THEN** a imagem escala para caber no container (max-width: 100%)

#### Scenario: Aspect ratio preservado
- **WHEN** uma imagem é redimensionada responsivamente
- **THEN** a proporção original é mantida (não distorce)

---

### Requirement: Responsive Charts
Gráficos e visualizações DEVEM se adaptar ao tamanho da tela, simplificando ou ocultando elementos conforme necessário em telas menores.

#### Scenario: Gráfico redimensiona com container
- **WHEN** um gráfico é exibido em diferentes viewports
- **THEN** o gráfico redimensiona para caber no container disponível

#### Scenario: Legends adaptáveis
- **WHEN** um gráfico com legenda é exibido em mobile
- **THEN** a legenda pode ser posicionada abaixo do gráfico (em vez de ao lado)
- **OR** a legenda pode ser colapsável/expandível

#### Scenario: Tooltips touch-friendly
- **WHEN** usuário interage com gráfico em dispositivo touch
- **THEN** tooltips são ativados por tap (não apenas hover)
