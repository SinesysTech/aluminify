# Scheduling System Spec Delta

## ADDED Requirements

### Requirement: Professor Selection
The system SHALL allow students to browse and select available professors before scheduling an appointment.

#### Scenario: Student views available professors
- **WHEN** a student navigates to `/agendamentos`
- **THEN** a list of professors with available slots is displayed
- **AND** each professor card shows name, photo, and next available slot

#### Scenario: Student filters professors
- **WHEN** a student enters a search term
- **THEN** the professor list is filtered by name or specialty

#### Scenario: Student selects professor
- **WHEN** a student clicks on a professor card
- **THEN** the student is navigated to `/agendamentos/[professorId]`
- **AND** the scheduling calendar is displayed for that professor

---

### Requirement: Recurrence-based Availability
The system SHALL use `agendamento_recorrencia` table as the single source of truth for professor availability.

#### Scenario: Professor configures weekly availability
- **WHEN** a professor accesses the availability management page
- **THEN** they can create recurrence patterns with:
  - Service type (plantao/mentoria)
  - Start and end dates
  - Day of week
  - Start and end times
  - Slot duration (15, 30, 45, or 60 minutes)

#### Scenario: System generates available slots
- **WHEN** `getAvailableSlots` is called for a professor and date
- **THEN** slots are generated based on `agendamento_recorrencia` entries
- **AND** existing appointments and bloqueios are excluded
- **AND** minimum advance time is respected

#### Scenario: Legacy table is deprecated
- **WHEN** any code references `agendamento_disponibilidade`
- **THEN** a deprecation warning should be logged
- **AND** the operation should still work for backwards compatibility

---

### Requirement: Bloqueios Management
The system SHALL allow professors and admins to create schedule blocks that prevent appointments.

#### Scenario: Professor creates personal bloqueio
- **WHEN** a professor creates a bloqueio with their professor_id
- **THEN** the bloqueio is saved with type (feriado/recesso/imprevisto/outro)
- **AND** affected pending/confirmed appointments are cancelled automatically
- **AND** affected students are notified

#### Scenario: Admin creates company-wide bloqueio
- **WHEN** an admin creates a bloqueio with null professor_id
- **THEN** the bloqueio applies to all professors in the company
- **AND** all affected appointments across professors are cancelled

#### Scenario: System validates bloqueio overlap
- **WHEN** checking if a time slot is available
- **THEN** bloqueios are checked for overlap using: `(slot_start < bloqueio_end AND slot_end > bloqueio_start)`

---

### Requirement: Integration Management
The system SHALL allow professors to configure meeting link providers (Google Meet, Zoom, or default).

#### Scenario: Professor sets default meeting link
- **WHEN** a professor configures a default meeting link
- **THEN** confirmed appointments use this link when no provider is configured

#### Scenario: Professor connects Google Calendar
- **WHEN** a professor completes Google OAuth flow
- **THEN** their access token is stored in `professor_integracoes`
- **AND** confirmed appointments create Google Calendar events with Meet links

#### Scenario: Professor connects Zoom
- **WHEN** a professor completes Zoom OAuth flow
- **THEN** their access token is stored in `professor_integracoes`
- **AND** confirmed appointments create Zoom meetings

#### Scenario: Provider fallback
- **WHEN** meeting link generation fails for configured provider
- **THEN** the system falls back to the default meeting link
- **AND** if no default exists, the appointment is confirmed without a link

---

### Requirement: Dynamic Slot Duration
The system SHALL respect the slot duration configured in recurrence patterns.

#### Scenario: Slots respect configured duration
- **WHEN** a professor configures 45-minute slots in their recurrence
- **THEN** available slots are generated with 45-minute intervals
- **AND** appointments created use the 45-minute duration

#### Scenario: Duration displayed to student
- **WHEN** a student views available slots
- **THEN** each slot displays its duration (e.g., "09:00 - 09:45")

---

### Requirement: Appointment Auto-completion
The system SHALL automatically mark confirmed appointments as completed after their end time.

#### Scenario: Past appointments are completed
- **WHEN** the auto-completion job runs
- **THEN** appointments with status "confirmado" and `data_fim` in the past are updated to "concluido"
- **AND** a log entry is created for audit

---

### Requirement: Reports Dashboard
The system SHALL provide appointment reports for professors and company admins.

#### Scenario: Professor views their report
- **WHEN** a professor accesses the reports page
- **THEN** they see statistics for their appointments only
- **AND** data includes total, by status, attendance rate

#### Scenario: Admin views company report
- **WHEN** an admin accesses the company reports page
- **THEN** they see aggregated statistics for all professors
- **AND** data includes per-professor breakdown and peak hours

#### Scenario: Report export
- **WHEN** a user requests report export
- **THEN** the report is available as CSV or PDF download

---

## ADDED Requirements - Security

### Requirement: Appointment Ownership Verification
The system SHALL verify that users can only modify appointments they own.

#### Scenario: Student cancels own appointment
- **WHEN** a student attempts to cancel an appointment
- **THEN** the system verifies the student is the `aluno_id` of the appointment
- **AND** if verified, the cancellation proceeds
- **AND** if not verified, a "Forbidden" error is returned

#### Scenario: Professor cancels own appointment
- **WHEN** a professor attempts to cancel an appointment
- **THEN** the system verifies the professor is the `professor_id` of the appointment
- **AND** if verified, the cancellation proceeds

#### Scenario: Unauthorized cancellation attempt
- **WHEN** a user attempts to cancel an appointment they don't own
- **THEN** the system returns a 403 Forbidden error
- **AND** the attempt is logged for security audit

---

## ADDED Requirements - UX

### Requirement: Calendar Availability Indicators
The system SHALL visually indicate which days have available slots on the calendar.

#### Scenario: Days with availability are highlighted
- **WHEN** a student views the scheduling calendar
- **THEN** days with at least one available slot are visually distinct
- **AND** days without availability appear disabled or dimmed

#### Scenario: Fully booked days
- **WHEN** all slots for a day are taken
- **THEN** the day appears as unavailable
- **AND** clicking shows "Sem horarios disponiveis"

---

### Requirement: Appointment Confirmation Summary
The system SHALL show a summary before creating an appointment.

#### Scenario: Summary displayed before confirmation
- **WHEN** a student clicks "Confirmar Agendamento"
- **THEN** a summary is displayed showing:
  - Professor name and photo
  - Date and day of week
  - Start time and duration
  - Any notes entered
- **AND** the student can go back to edit or confirm

---

### Requirement: Detailed Error Messages
The system SHALL provide specific, actionable error messages.

#### Scenario: Time conflict error
- **WHEN** a student tries to book an already-taken slot
- **THEN** the error message says "Este horario ja foi agendado por outro aluno. Por favor, escolha outro horario."

#### Scenario: Minimum advance time error
- **WHEN** a student tries to book with insufficient advance time
- **THEN** the error message says "Agendamentos devem ser feitos com pelo menos X horas de antecedencia."

#### Scenario: Outside availability error
- **WHEN** a student tries to book outside professor availability
- **THEN** the error message says "O professor nao tem disponibilidade neste horario."

---

## ADDED Requirements - Technical

### Requirement: Timezone Consistency
The system SHALL handle timezones consistently across all operations.

#### Scenario: Storage in UTC
- **WHEN** an appointment is created
- **THEN** `data_inicio` and `data_fim` are stored as UTC timestamps

#### Scenario: Display in local time
- **WHEN** appointment times are displayed to users
- **THEN** times are converted to the user's timezone (default: America/Sao_Paulo)

#### Scenario: Slot generation uses UTC
- **WHEN** available slots are generated
- **THEN** day-of-week calculations use `getUTCDay()`
- **AND** time comparisons use UTC values

---

### Requirement: Type Safety
The system SHALL use generated Supabase types without manual overrides.

#### Scenario: Types are generated
- **WHEN** database schema changes
- **THEN** types are regenerated using `supabase gen types typescript`

#### Scenario: No type assertions
- **WHEN** querying Supabase tables
- **THEN** queries do not use `as any` or `as unknown` casts
- **AND** proper table types from `Database` are used
