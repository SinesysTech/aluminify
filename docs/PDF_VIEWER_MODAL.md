# 📄 Visualização de PDF em Modal/Popup

Este documento explica como funciona a visualização de PDFs em modal (popup) na mesma página, sem redirecionar o usuário.

## 🎯 Objetivo

Quando o aluno clica no botão "Visualizar", o PDF é exibido em um modal/popup na mesma página, permitindo que ele continue navegando sem perder o contexto da página atual.

## 🧩 Elementos Necessários

### 1. **Componente Dialog (Modal)**
- **Arquivo**: `components/ui/dialog.tsx`
- **Biblioteca**: Radix UI (`@radix-ui/react-dialog`)
- **Função**: Cria a estrutura base do modal (overlay, conteúdo, animações)
- **Já existe no projeto**: ✅

### 2. **Componente PdfViewerModal**
- **Arquivo**: `components/pdf-viewer-modal.tsx` (criado)
- **Função**: Componente reutilizável que encapsula a lógica de exibição do PDF
- **Características**:
  - Usa o componente `Dialog` do shadcn/ui
  - Exibe o PDF em um `iframe`
  - Inclui botões para download e abrir em nova aba
  - Responsivo (95% da viewport)

### 3. **Estado React para Controlar o Modal**
- **Variável**: `pdfModalOpen` (boolean)
- **Função**: Controla quando o modal está aberto ou fechado
- **Uso**: `const [pdfModalOpen, setPdfModalOpen] = React.useState(false)`

### 4. **iframe para Exibir o PDF**
- **Elemento HTML**: `<iframe>`
- **Atributos importantes**:
  - `src`: URL do PDF
  - `className`: Estilos para ocupar todo o espaço disponível
  - `title`: Acessibilidade

### 5. **Integração nos Componentes**
- **Componentes atualizados**:
  - `components/atividade-checklist-row.tsx`
  - `components/activity-upload-row.tsx`
- **Mudança**: Substituído `window.open()` por abertura do modal

## 📋 Estrutura do Componente PdfViewerModal

```tsx
<PdfViewerModal
  open={pdfModalOpen}              // Estado que controla abertura/fechamento
  onOpenChange={setPdfModalOpen}  // Função para atualizar o estado
  pdfUrl={atividade.arquivoUrl}    // URL do PDF
  title={atividade.titulo}          // Título exibido no modal
/>
```

## 🔄 Fluxo de Funcionamento

1. **Usuário clica em "Visualizar"**
   - A função `handleVisualizar()` é chamada
   - Define `setPdfModalOpen(true)`

2. **Modal é aberto**
   - O componente `Dialog` renderiza o overlay e o conteúdo
   - O `iframe` carrega o PDF da URL fornecida

3. **Usuário visualiza o PDF**
   - O PDF é exibido dentro do iframe
   - Pode fazer zoom, navegar páginas, etc. (funcionalidades nativas do navegador)

4. **Usuário fecha o modal**
   - Clica no botão X ou fora do modal
   - `onOpenChange(false)` é chamado
   - O modal fecha e o usuário volta para a página original

## ✨ Funcionalidades Adicionais

### Botão "Download"
- Permite baixar o PDF diretamente
- Cria um link temporário e simula o clique

### Botão "Abrir em nova aba"
- Para usuários que preferem visualizar em uma aba separada
- Usa `window.open()` como fallback

## 🎨 Estilização

- **Tamanho**: 90% da viewport (largura e altura)
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Overlay**: Fundo escuro semi-transparente
- **Animações**: Fade in/out e zoom suave (fornecidas pelo Dialog)

## 🔧 Como Usar em Outros Componentes

Se precisar usar o modal de PDF em outro componente:

```tsx
import { PdfViewerModal } from '@/components/pdf-viewer-modal'

// No componente:
const [pdfModalOpen, setPdfModalOpen] = React.useState(false)

// No JSX:
<PdfViewerModal
  open={pdfModalOpen}
  onOpenChange={setPdfModalOpen}
  pdfUrl="https://exemplo.com/arquivo.pdf"
  title="Título do Documento"
/>
```

## ⚠️ Considerações Importantes

1. **CORS**: O PDF deve estar hospedado em um servidor que permita ser exibido em iframes (sem restrições CORS)
2. **Performance**: PDFs muito grandes podem demorar para carregar
3. **Mobile**: Em dispositivos móveis, alguns navegadores podem abrir o PDF em um visualizador externo
4. **Segurança**: URLs de PDF devem ser validadas antes de serem exibidas

## 🚀 Vantagens desta Abordagem

- ✅ Não redireciona o usuário para outra página
- ✅ Mantém o contexto da página atual
- ✅ Experiência mais fluida e moderna
- ✅ Permite múltiplas ações (visualizar, baixar, abrir em nova aba)
- ✅ Reutilizável em qualquer parte da aplicação

