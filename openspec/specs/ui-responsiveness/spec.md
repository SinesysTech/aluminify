# UI Responsiveness Specification

### Requirement: Breakpoint System
O sistema DEVE definir breakpoints mobile-first: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px). Hook useBreakpoint() retorna isMobile, isTablet, isDesktop.

---

### Requirement: Mobile Navigation
Bottom navigation bar com max 5 itens, visivel apenas em mobile (<768px), com safe area para iPhones.

---

### Requirement: Responsive Sidebar
Sidebar como drawer/sheet em mobile (<768px) com fechamento automatico apos navegacao. Fixo em desktop (>=1024px).

---

### Requirement: Touch Target Sizing
Elementos interativos com area minima de 44x44 pixels. Inputs com altura minima 44px em touch devices.

---

### Requirement: Responsive Tables
Cards empilhados em mobile (<768px), tabela tradicional em desktop (>=768px). Acoes acessiveis em ambos formatos.

---

### Requirement: Responsive Forms
Campos full-width em mobile, layout multi-coluna em desktop (>=1024px). Labels sempre visiveis.

---

### Requirement: Responsive Modals
Full-screen em mobile (<768px), centralizados com tamanho limitado em desktop. Bottom sheet para selecoes em mobile.

---

### Requirement: Responsive Typography
Titulos com escala responsiva. Corpo de texto minimo 16px em mobile. Line-height minimo 1.5.

---

### Requirement: Responsive Spacing
Padding de pagina menor em mobile (16px), maior em desktop (32px+). Gaps proporcionais a viewport.

---

### Requirement: Responsive Charts
Graficos redimensionam com container. Legends adaptaveis (abaixo em mobile). Tooltips touch-friendly via tap.
