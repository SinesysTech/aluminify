## MODIFIED Requirements

### Requirement: Professor Selection
The system SHALL allow students to browse and select available professors before scheduling an appointment. The professor listing SHALL include all users with teaching roles (`professor`, `professor_admin`, `monitor`).

#### Scenario: Student views available professors
- **WHEN** a student navigates to `/agendamentos`
- **THEN** a list of professors with available slots is displayed
- **AND** the list includes users with any of the teaching role types: `professor`, `professor_admin`, `monitor`
- **AND** each professor card shows name, photo, and next available slot

#### Scenario: Student filters professors
- **WHEN** a student enters a search term
- **THEN** the professor list is filtered by name or specialty

#### Scenario: Student selects professor
- **WHEN** a student clicks on a professor card
- **THEN** the student is navigated to `/agendamentos/[professorId]`
- **AND** the scheduling calendar is displayed for that professor
