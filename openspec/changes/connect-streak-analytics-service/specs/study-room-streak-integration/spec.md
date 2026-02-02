## ADDED Requirements

### Requirement: Sala de Estudos SHALL fetch streak from analytics service
The Sala de Estudos client SHALL fetch the student's streak days from the dashboard analytics endpoint (`GET /api/dashboard/user`) using a TanStack Query hook and display the real value in the `ProgressoStatsCard` component.

#### Scenario: Successful streak fetch
- **WHEN** the Sala de Estudos page loads for an authenticated student
- **THEN** the system SHALL call `GET /api/dashboard/user` to retrieve `UserInfo.streakDays`
- **THEN** the `ProgressoStatsCard` SHALL display the real streak value

#### Scenario: Streak value is zero
- **WHEN** the student has no completed study sessions on consecutive days
- **THEN** the streak SHALL display `0` with the default motivational message

#### Scenario: Streak value is positive
- **WHEN** the student has completed study sessions on consecutive days
- **THEN** the streak SHALL display the correct count with the corresponding motivational message and animated flame icon

### Requirement: Sala de Estudos SHALL handle streak loading state
The system SHALL display a loading indicator while the streak data is being fetched, preventing display of stale or default values.

#### Scenario: Streak data is loading
- **WHEN** the streak API request is in flight
- **THEN** the streak display area SHALL show a loading state (e.g., skeleton or spinner)
- **THEN** the component SHALL NOT display `0` as a fallback during loading

### Requirement: Sala de Estudos SHALL handle streak fetch errors gracefully
The system SHALL handle API errors when fetching streak data without breaking the rest of the Sala de Estudos page.

#### Scenario: API request fails
- **WHEN** the `GET /api/dashboard/user` request fails (network error, server error)
- **THEN** the streak SHALL fall back to displaying `0`
- **THEN** the rest of the Sala de Estudos page SHALL continue functioning normally

#### Scenario: API request retries automatically
- **WHEN** the initial streak fetch fails
- **THEN** TanStack Query SHALL retry the request according to its default retry policy
