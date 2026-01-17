# Implementation Tasks

## Phase 1: Critical Fixes (P0)

### 1.1 Fix Professor Identity Issue
- [ ] 1.1.1 Create `ProfessorSelector` component at `components/agendamento/professor-selector.tsx`
- [ ] 1.1.2 Create new route `app/(dashboard)/agendamentos/[professorId]/page.tsx`
- [ ] 1.1.3 Update `app/(dashboard)/agendamentos/page.tsx` to show professor list instead of scheduler
- [ ] 1.1.4 Add server action `getProfessoresDisponiveis(empresaId)` to fetch available professors
- [ ] 1.1.5 Update navigation links across the app

### 1.2 Fix Table Inconsistency
- [ ] 1.2.1 Create new `RecorrenciaManager` component at `components/professor/recorrencia-manager.tsx`
- [ ] 1.2.2 Replace `AvailabilityManager` usage in `professor/disponibilidade/page.tsx`
- [ ] 1.2.3 Update `validateAgendamento` to use `agendamento_recorrencia` table
- [ ] 1.2.4 Mark `agendamento_disponibilidade` as deprecated in comments
- [ ] 1.2.5 Add migration to create view for backwards compatibility (if needed)

### 1.3 Fix Security Vulnerability
- [ ] 1.3.1 Update `cancelAgendamento` to verify user is aluno or professor of the appointment
- [ ] 1.3.2 Update `cancelAgendamentoWithReason` with same verification
- [ ] 1.3.3 Add RLS policy for agendamentos table to enforce at database level
- [ ] 1.3.4 Add tests for permission verification

### 1.4 Fix Slot Duration
- [ ] 1.4.1 Update `form-panel.tsx` to receive slot duration as prop
- [ ] 1.4.2 Pass duration from `getAvailableSlots` response
- [ ] 1.4.3 Update `AgendamentoScheduler` to track selected slot duration

## Phase 2: New Features (P1)

### 2.1 Recorrencia Manager
- [ ] 2.1.1 Design UI for weekly schedule pattern (days + time ranges)
- [ ] 2.1.2 Implement form for creating recorrencia (tipo_servico, data_inicio, data_fim, dia_semana, horarios)
- [ ] 2.1.3 Implement list view of existing recorrencias
- [ ] 2.1.4 Implement edit/delete functionality
- [ ] 2.1.5 Add visual calendar preview of configured availability

### 2.2 Bloqueios Manager
- [ ] 2.2.1 Create `BloqueiosManager` component at `components/professor/bloqueios-manager.tsx`
- [ ] 2.2.2 Implement form for creating bloqueio (tipo, data_inicio, data_fim, motivo)
- [ ] 2.2.3 Show preview of affected appointments before creating
- [ ] 2.2.4 Implement list view of existing bloqueios
- [ ] 2.2.5 Implement edit/delete functionality
- [ ] 2.2.6 Add route `professor/bloqueios/page.tsx`

### 2.3 Integration Manager
- [ ] 2.3.1 Create `IntegracaoManager` component at `components/professor/integracao-manager.tsx`
- [ ] 2.3.2 Implement OAuth flow for Google Calendar
- [ ] 2.3.3 Implement OAuth flow for Zoom
- [ ] 2.3.4 Add UI to set default meeting link
- [ ] 2.3.5 Add route `professor/configuracoes/integracoes/page.tsx`

### 2.4 Professor Selection for Students
- [ ] 2.4.1 Create `ProfessorCard` component showing professor info and availability summary
- [ ] 2.4.2 Implement search/filter by name or specialty
- [ ] 2.4.3 Show next available slot for each professor
- [ ] 2.4.4 Add pagination for large professor lists

## Phase 3: Logic Improvements (P2)

### 3.1 Fix Bloqueio Query
- [ ] 3.1.1 Update `createBloqueio` cancellation query to check overlap correctly
- [ ] 3.1.2 Change from `gte/lte` to proper range overlap check
- [ ] 3.1.3 Add test cases for edge cases (partial overlap, exact match, contained)

### 3.2 Timezone Standardization
- [ ] 3.2.1 Audit all date/time operations in `agendamentos.ts`
- [ ] 3.2.2 Decide on standard approach (all UTC or all local with explicit timezone)
- [ ] 3.2.3 Update `generateAvailableSlots` to handle timezone correctly
- [ ] 3.2.4 Update frontend date display to use consistent timezone
- [ ] 3.2.5 Add timezone indicator in UI

### 3.3 Auto-refresh After Actions
- [ ] 3.3.1 Implement optimistic updates or use React Query/SWR
- [ ] 3.3.2 Add `useRouter().refresh()` after all mutation actions
- [ ] 3.3.3 Test refresh behavior on all status change actions

### 3.4 Auto-complete Appointments
- [ ] 3.4.1 Create Edge Function `complete-past-appointments`
- [ ] 3.4.2 Implement logic to mark confirmed appointments as completed after end time
- [ ] 3.4.3 Set up cron trigger (every hour or daily)
- [ ] 3.4.4 Add logging for audit trail

## Phase 4: UX Improvements (P3)

### 4.1 Calendar Availability Indicators
- [ ] 4.1.1 Fetch availability summary for visible month
- [ ] 4.1.2 Use Calendar `modifiers` prop to style days with slots
- [ ] 4.1.3 Add legend explaining indicators

### 4.2 Confirmation Summary
- [ ] 4.2.1 Create `ConfirmationSummary` component
- [ ] 4.2.2 Show professor name, date, time, duration before confirming
- [ ] 4.2.3 Add "Edit" button to go back and change selection

### 4.3 Error Messages
- [ ] 4.3.1 Create error message mapping for common errors
- [ ] 4.3.2 Update all try/catch blocks to show specific messages
- [ ] 4.3.3 Add toast details for debugging (collapsible)

### 4.4 Reports Dashboard
- [ ] 4.4.1 Create `RelatoriosDashboard` component
- [ ] 4.4.2 Implement date range picker for report generation
- [ ] 4.4.3 Display report data with charts (appointments by status, by professor)
- [ ] 4.4.4 Add export to CSV/PDF functionality
- [ ] 4.4.5 Add route `professor/relatorios/page.tsx` or `empresa/relatorios/page.tsx`

## Phase 5: Technical Cleanup

### 5.1 Type Regeneration
- [ ] 5.1.1 Run `supabase gen types typescript --local > lib/database.types.ts`
- [ ] 5.1.2 Remove all `as any` casts in `agendamentos.ts`
- [ ] 5.1.3 Update type imports across components
- [ ] 5.1.4 Remove local type definitions that duplicate generated types

### 5.2 Migration Cleanup
- [ ] 5.2.1 Identify and document duplicate migrations
- [ ] 5.2.2 Create consolidation migration if needed
- [ ] 5.2.3 Update migration README with cleanup notes

### 5.3 Code Organization
- [ ] 5.3.1 Split `agendamentos.ts` into logical modules (agendamentos, recorrencias, bloqueios, relatorios)
- [ ] 5.3.2 Create shared types file `types/agendamento.ts`
- [ ] 5.3.3 Add JSDoc comments to exported functions

## Validation & Testing

### 6.1 Manual Testing Checklist
- [ ] 6.1.1 Test full flow: aluno selects professor -> selects date -> selects slot -> confirms
- [ ] 6.1.2 Test professor flow: configure recorrencia -> view appointments -> confirm/reject
- [ ] 6.1.3 Test bloqueio flow: create bloqueio -> verify affected appointments cancelled
- [ ] 6.1.4 Test cancellation permissions (aluno can only cancel own, professor can only cancel own)
- [ ] 6.1.5 Test meeting link generation (default, Google, Zoom)

### 6.2 Edge Cases
- [ ] 6.2.1 Test scheduling at timezone boundaries
- [ ] 6.2.2 Test overlapping bloqueios
- [ ] 6.2.3 Test recorrencia with past data_inicio
- [ ] 6.2.4 Test concurrent booking attempts for same slot
