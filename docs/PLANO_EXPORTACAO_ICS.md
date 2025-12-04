# Plano de Implementação: Exportação de Calendário em Formato .ics (iCalendar)

## 📋 Objetivo

Permitir que os alunos exportem seu cronograma de estudos no formato `.ics` (iCalendar), para que possam importar o planejamento no Google Agenda, Outlook, Apple Calendar ou outros aplicativos de calendário compatíveis.

---

## 🔍 Análise do Sistema Atual

### Estrutura de Dados Disponível

1. **Tabela `cronogramas`**:
   - `id`: ID do cronograma
   - `nome`: Nome do cronograma
   - `data_inicio`: Data de início do cronograma
   - `data_fim`: Data de fim do cronograma
   - `aluno_id`: ID do aluno proprietário

2. **Tabela `cronograma_itens`**:
   - `id`: ID do item
   - `cronograma_id`: Referência ao cronograma
   - `aula_id`: Referência à aula
   - `data_prevista`: Data calculada para o item (formato YYYY-MM-DD)
   - `semana_numero`: Número da semana
   - `ordem_na_semana`: Ordem dentro da semana
   - `concluido`: Status de conclusão
   - `data_conclusao`: Data de conclusão (se concluído)

3. **Hierarquia de Dados** (via joins):
   - Aula → Módulo → Frente → Disciplina
   - Cada aula tem `tempo_estimado_minutos`

### Exportações Existentes

O sistema já possui:
- ✅ Exportação PDF (`/api/cronograma/[id]/export/pdf`)
- ✅ Exportação XLSX (`/api/cronograma/[id]/export/xlsx`)

Ambas seguem o padrão de buscar dados completos do cronograma e gerar o arquivo.

---

## 📝 Passos de Implementação

### **PASSO 1: Criar Endpoint de API para Exportação .ics**

**Arquivo:** `app/api/cronograma/[id]/export/ics/route.ts`

**Responsabilidades:**
1. Validar autenticação do usuário
2. Verificar se o cronograma pertence ao usuário
3. Buscar dados completos do cronograma (similar ao PDF/XLSX)
4. Gerar arquivo .ics no formato iCalendar
5. Retornar arquivo com headers apropriados

**Estrutura:**
```typescript
export async function GET(
  request: AuthenticatedRequest,
  context?: { params: { id: string } }
)
```

**Validações:**
- Verificar se `cronogramaId` existe
- Verificar se o cronograma pertence ao `request.user.id`
- Verificar se há itens com `data_prevista` válida

---

### **PASSO 2: Implementar Função de Geração do Arquivo .ics**

**Formato iCalendar (RFC 5545):**

O arquivo .ics deve seguir o padrão iCalendar com:

1. **Cabeçalho do arquivo:**
   ```
   BEGIN:VCALENDAR
   VERSION:2.0
   PRODID:-//Área do Aluno//Cronograma de Estudos//PT
   CALSCALE:GREGORIAN
   METHOD:PUBLISH
   ```

2. **Para cada item do cronograma (VEVENT):**
   ```
   BEGIN:VEVENT
   UID:unique-id-do-item
   DTSTART:YYYYMMDDTHHMMSSZ
   DTEND:YYYYMMDDTHHMMSSZ
   SUMMARY:Título do evento
   DESCRIPTION:Descrição detalhada
   LOCATION:Opcional
   STATUS:CONFIRMED
   END:VEVENT
   ```

3. **Rodapé:**
   ```
   END:VCALENDAR
   ```

**Campos a incluir em cada evento:**

- **UID**: ID único do evento (pode usar `cronograma-item-${item.id}`)
- **DTSTART**: Data/hora de início (usar `data_prevista` + horário padrão, ex: 08:00)
- **DTEND**: Data/hora de fim (calcular baseado em `tempo_estimado_minutos`)
- **SUMMARY**: Título do evento (ex: "Matemática - Frente A - Aula 1")
- **DESCRIPTION**: Descrição completa com:
  - Nome da disciplina
  - Nome da frente
  - Nome do módulo
  - Nome da aula
  - Tempo estimado
  - Status (Concluída/Pendente)
- **STATUS**: CONFIRMED (sempre confirmado)
- **CATEGORIES**: Categoria (ex: "Estudos", "Aula")

**Considerações:**
- Usar timezone UTC ou timezone do Brasil (America/Sao_Paulo)
- Se `tempo_estimado_minutos` não existir, usar duração padrão (ex: 1 hora)
- Se `data_prevista` não existir, pular o item (ou usar fallback baseado em semana/ordem)

---

### **PASSO 3: Reutilizar Função de Busca de Dados**

**Arquivo:** Criar função compartilhada ou reutilizar lógica existente

**Opções:**

**Opção A:** Criar função utilitária compartilhada
- Criar `lib/cronograma-export-utils.ts`
- Função `fetchCronogramaCompleto(cronogramaId: string)`
- Reutilizar em PDF, XLSX e ICS

**Opção B:** Reutilizar lógica do PDF (já existe `fetchCronogramaCompleto` no route.tsx do PDF)
- Extrair para arquivo compartilhado
- Importar nos três endpoints

**Recomendação:** **Opção B** - Extrair a função existente para um arquivo compartilhado.

---

### **PASSO 4: Implementar Biblioteca de Geração .ics**

**Opções de bibliotecas:**

1. **`ical-generator`** (recomendado)
   - Biblioteca Node.js popular
   - Suporta TypeScript
   - Fácil de usar
   - Instalação: `npm install ical-generator`

2. **Geração manual (string concatenation)**
   - Sem dependências
   - Mais controle, mas mais trabalho
   - Requer escape correto de caracteres especiais

**Recomendação:** Usar `ical-generator` para garantir conformidade com RFC 5545.

**Exemplo de uso:**
```typescript
import ical from 'ical-generator';

const calendar = ical({
  prodId: {
    company: 'Área do Aluno',
    product: 'Cronograma de Estudos',
    language: 'PT'
  },
  name: cronograma.nome,
  timezone: 'America/Sao_Paulo'
});

itens.forEach(item => {
  if (!item.data_prevista) return;
  
  const startDate = new Date(item.data_prevista);
  const duration = item.aulas?.tempo_estimado_minutos || 60;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
  
  calendar.createEvent({
    uid: `cronograma-item-${item.id}`,
    start: startDate,
    end: endDate,
    summary: `${item.aulas?.modulos?.frentes?.disciplinas?.nome || 'Aula'} - ${item.aulas?.nome || 'Sem nome'}`,
    description: `Disciplina: ${item.aulas?.modulos?.frentes?.disciplinas?.nome}\nFrente: ${item.aulas?.modulos?.frentes?.nome}\nMódulo: ${item.aulas?.modulos?.nome}\nAula: ${item.aulas?.nome}\nTempo estimado: ${duration} minutos`,
    status: 'CONFIRMED',
    categories: [{ name: 'Estudos' }]
  });
});

return calendar.toString();
```

---

### **PASSO 5: Adicionar Botão de Exportação no Frontend**

**Arquivo:** `components/schedule-dashboard.tsx`

**Localização:** Adicionar botão ao lado dos botões "Exportar PDF" e "Exportar XLSX"

**Implementação:**
```typescript
<Button
  variant="outline"
  className="w-full sm:w-auto"
  onClick={async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Sessão expirada. Faça login novamente.')
        return
      }
      const res = await fetch(`/api/cronograma/${cronogramaId}/export/ics`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro ao exportar calendário' }))
        alert(err.error || 'Erro ao exportar calendário')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cronograma_${cronogramaId}.ics`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Erro ao exportar calendário:', e)
      alert('Erro ao exportar calendário')
    }
  }}
>
  <CalendarCheck className="mr-2 h-4 w-4" />
  <span className="hidden sm:inline">Exportar Calendário</span>
  <span className="sm:hidden">ICS</span>
</Button>
```

**Ícone:** Usar `CalendarCheck` do lucide-react (já importado)

---

### **PASSO 6: Tratamento de Erros e Edge Cases**

**Casos a tratar:**

1. **Item sem `data_prevista`:**
   - Pular o item (não incluir no .ics)
   - Ou usar fallback baseado em `semana_numero` e `ordem_na_semana`

2. **Item sem `tempo_estimado_minutos`:**
   - Usar duração padrão (ex: 60 minutos)

3. **Data inválida:**
   - Validar formato antes de processar
   - Pular item se data inválida

4. **Cronograma sem itens:**
   - Retornar arquivo .ics vazio (apenas cabeçalho/rodapé)
   - Ou retornar erro informativo

5. **Timezone:**
   - Usar timezone do Brasil (America/Sao_Paulo)
   - Ou permitir configuração

---

### **PASSO 7: Testes**

**Cenários de teste:**

1. ✅ Exportar cronograma com itens válidos
2. ✅ Exportar cronograma sem itens
3. ✅ Exportar cronograma com itens sem `data_prevista`
4. ✅ Exportar cronograma com itens sem `tempo_estimado_minutos`
5. ✅ Importar arquivo .ics no Google Agenda
6. ✅ Importar arquivo .ics no Outlook
7. ✅ Importar arquivo .ics no Apple Calendar
8. ✅ Verificar encoding de caracteres especiais (acentos)
9. ✅ Verificar timezone correto
10. ✅ Verificar UIDs únicos

**Teste manual:**
- Baixar arquivo .ics
- Importar no Google Agenda
- Verificar se eventos aparecem corretamente
- Verificar se datas/horas estão corretas
- Verificar se descrições estão completas

---

## 📦 Dependências Necessárias

```json
{
  "dependencies": {
    "ical-generator": "^4.2.0"
  }
}
```

**Instalação:**
```bash
npm install ical-generator
```

---

## 🗂️ Estrutura de Arquivos

```
app/api/cronograma/[id]/export/
  ├── pdf/
  │   └── route.tsx
  ├── xlsx/
  │   └── route.ts
  └── ics/
      └── route.ts          ← NOVO

lib/
  └── cronograma-export-utils.ts  ← NOVO (extrair função compartilhada)

components/
  └── schedule-dashboard.tsx      ← MODIFICAR (adicionar botão)
```

---

## 🔄 Fluxo Completo

```
1. Usuário clica em "Exportar Calendário" no ScheduleDashboard
   ↓
2. Frontend faz requisição GET /api/cronograma/[id]/export/ics
   ↓
3. Backend valida autenticação e propriedade do cronograma
   ↓
4. Backend busca dados completos do cronograma
   ↓
5. Backend gera arquivo .ics usando ical-generator
   ↓
6. Backend retorna arquivo com Content-Type: text/calendar
   ↓
7. Frontend faz download do arquivo
   ↓
8. Usuário importa arquivo no Google Agenda/Outlook/etc.
```

---

## ⚠️ Considerações Importantes

### Timezone
- **Recomendação:** Usar timezone `America/Sao_Paulo` (UTC-3)
- Definir horário padrão para início dos eventos (ex: 08:00)
- Calcular `DTEND` baseado em `tempo_estimado_minutos`

### Encoding
- Garantir que caracteres especiais (acentos) sejam codificados corretamente
- O formato .ics usa UTF-8, mas pode precisar de escape em alguns campos

### Performance
- Para cronogramas com muitos itens (1000+), considerar:
  - Processamento assíncrono (se necessário)
  - Streaming do arquivo (se muito grande)
  - Limite de tamanho do arquivo

### Atualizações
- O arquivo .ics é um "snapshot" no momento da exportação
- Se o cronograma for atualizado, o usuário precisará exportar novamente
- **Futuro:** Considerar exportação dinâmica via URL (webcal://)

---

## 🚀 Ordem de Implementação Recomendada

1. **Instalar dependência** (`ical-generator`)
2. **Extrair função compartilhada** de busca de dados
3. **Criar endpoint ICS** (`/api/cronograma/[id]/export/ics/route.ts`)
4. **Implementar geração do arquivo .ics**
5. **Adicionar botão no frontend**
6. **Testar exportação e importação**
7. **Ajustar edge cases e melhorias**

---

## 📚 Referências

- [RFC 5545 - iCalendar Specification](https://tools.ietf.org/html/rfc5545)
- [ical-generator Documentation](https://github.com/sebbo2002/ical-generator)
- [Google Calendar Import Format](https://support.google.com/calendar/answer/37118)

---

## ✅ Checklist de Implementação

- [ ] Instalar dependência `ical-generator`
- [ ] Extrair função `fetchCronogramaCompleto` para arquivo compartilhado
- [ ] Criar endpoint `/api/cronograma/[id]/export/ics/route.ts`
- [ ] Implementar geração do arquivo .ics
- [ ] Adicionar validações e tratamento de erros
- [ ] Adicionar botão no `schedule-dashboard.tsx`
- [ ] Testar exportação com dados válidos
- [ ] Testar edge cases (sem data, sem tempo, etc.)
- [ ] Testar importação no Google Agenda
- [ ] Testar importação no Outlook
- [ ] Verificar encoding de caracteres especiais
- [ ] Documentar uso da funcionalidade

---

## 🎯 Resultado Esperado

Após a implementação, o aluno poderá:

1. Clicar em "Exportar Calendário" no dashboard do cronograma
2. Baixar um arquivo `.ics` com todos os eventos do cronograma
3. Importar o arquivo no Google Agenda (ou outro aplicativo compatível)
4. Ver todos os eventos do cronograma no calendário pessoal
5. Sincronizar automaticamente com dispositivos móveis

Cada evento no calendário terá:
- Título: Nome da disciplina e aula
- Data/hora: Baseada em `data_prevista` e `tempo_estimado_minutos`
- Descrição: Informações completas (disciplina, frente, módulo, aula, tempo)
- Status: Confirmado




