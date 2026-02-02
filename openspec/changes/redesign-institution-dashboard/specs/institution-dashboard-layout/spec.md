## ADDED Requirements

### Requirement: Stats row cards SHALL have equal height
All cards in the top stats row (Taxa de Engajamento, Visao Geral, Top Alunos) SHALL render at equal height within their grid row regardless of content volume.

#### Scenario: Three cards in stats row align vertically
- **WHEN** the institution dashboard renders the top stats row at viewport width >= 1280px
- **THEN** all three cards in the `grid xl:grid-cols-3` row SHALL have the same rendered height

#### Scenario: Cards stretch on smaller viewports
- **WHEN** the viewport width is < 1280px and cards stack vertically
- **THEN** each card SHALL use its natural content height without fixed constraints

### Requirement: Metric labels SHALL be fully readable
The four metric cards in the institution metrics section (Alunos Ativos, Horas de Estudo, Atividades Concluidas, Taxa de Conclusao) SHALL display their labels without truncation at all supported breakpoints.

#### Scenario: Metric labels visible at xl breakpoint
- **WHEN** the institution metrics grid renders at viewport width >= 1280px in a 4-column layout
- **THEN** all four metric labels SHALL be fully visible without text truncation

#### Scenario: Metric labels visible at medium breakpoint
- **WHEN** the institution metrics grid renders at viewport width between 768px and 1279px in a 2-column layout
- **THEN** all four metric labels SHALL be fully visible without text truncation

#### Scenario: Metric labels accessible via title attribute
- **WHEN** a metric label is rendered in the institution metrics grid
- **THEN** the label element SHALL have a `title` attribute containing the full label text

### Requirement: Empty states SHALL provide guidance and actions
All dashboard sections that can display an empty state SHALL show: (1) a relevant icon, (2) a descriptive message, and (3) an optional action button when applicable.

#### Scenario: ChartMostActivity empty state
- **WHEN** the "Aproveitamento por Disciplina" chart has no data
- **THEN** the component SHALL display a chart icon, the message "Sem dados de atividade", a description guiding the admin, and an optional action link

#### Scenario: DisciplinaPerformance empty state
- **WHEN** the "Performance por Disciplina" section has no data
- **THEN** the component SHALL display an icon, the message "Nenhuma disciplina com dados de performance", and a descriptive sub-message

#### Scenario: LeaderboardCard empty state
- **WHEN** the leaderboard has no student data
- **THEN** the component SHALL display a users icon, the message "Sem dados de ranking", and a descriptive sub-message

#### Scenario: ConsistencyHeatmap sparse data
- **WHEN** the heatmap data contains fewer than 5 active days in the selected period
- **THEN** the component SHALL still render the grid but MAY display a subtle informational message indicating low activity

### Requirement: Top Alunos section SHALL NOT be duplicated
The institution dashboard SHALL display student ranking data in exactly one location.

#### Scenario: Single leaderboard in stats row
- **WHEN** the institution dashboard renders
- **THEN** student ranking data SHALL appear only in the `LeaderboardCard` within the top stats row

#### Scenario: LeaderboardCard shows up to 5 entries
- **WHEN** the institution dashboard renders with ranking data available
- **THEN** the `LeaderboardCard` SHALL display up to 5 students

#### Scenario: Professor ranking remains separate
- **WHEN** the institution dashboard renders
- **THEN** the `ProfessorRankingList` SHALL remain in its own full-width card below the heatmap section

### Requirement: Progress bars SHALL have visible labels
The progress bars in the ProgressStatisticsCard SHALL each have a text label identifying what metric they represent.

#### Scenario: Progress bar labels displayed
- **WHEN** the "Visao Geral" card renders with progress bars
- **THEN** each progress bar SHALL have a visible text label above or beside it describing the metric (e.g., "Atividade", "Conclusao")

### Requirement: Badge colors SHALL use correct semantics
Badge colors in the ProgressStatisticsCard SHALL use semantically appropriate colors for their metrics.

#### Scenario: Cursos Ativos badge color
- **WHEN** the "Cursos Ativos" badge renders
- **THEN** the badge SHALL use the primary/neutral color (not orange/warning)

#### Scenario: Alunos Ativos badge color
- **WHEN** the "Alunos Ativos" badge renders
- **THEN** the badge SHALL use green to indicate active/positive status

### Requirement: WelcomeCard CTA SHALL link to a valid route
The "Gerenciar Alunos" button in the WelcomeCard SHALL navigate to the student management page for the current tenant.

#### Scenario: CTA navigates to alunos page
- **WHEN** an institution admin clicks the "Gerenciar Alunos" button
- **THEN** the browser SHALL navigate to the `/{tenant}/alunos` route

#### Scenario: CTA does not link to hash
- **WHEN** the WelcomeCard renders on the institution dashboard
- **THEN** the `ctaHref` prop SHALL NOT be `"#"` or empty

### Requirement: Icon-only buttons SHALL have aria-labels
All icon-only buttons on the institution dashboard SHALL have an `aria-label` attribute for screen reader accessibility.

#### Scenario: Refresh button has aria-label
- **WHEN** the refresh button (icon-only) renders
- **THEN** the button SHALL have `aria-label="Atualizar dados"` or equivalent descriptive text

### Requirement: Dashboard SHALL show visual feedback during data refresh
When the dashboard is refreshing data (after period change or manual refresh), the UI SHALL provide visual feedback indicating the loading state.

#### Scenario: Content opacity during refresh
- **WHEN** a data refresh is in progress
- **THEN** the main content area SHALL reduce opacity to indicate loading state

#### Scenario: Refresh button shows loading state
- **WHEN** the user clicks the refresh button
- **THEN** the refresh icon SHALL animate (spin) until the refresh completes

### Requirement: Card titles SHALL use correct Portuguese accents
All card titles and labels SHALL use proper Portuguese diacritical marks.

#### Scenario: Visao Geral title
- **WHEN** the ProgressStatisticsCard renders with default title
- **THEN** the title SHALL read "Visao Geral" with correct accents where applicable in the codebase
