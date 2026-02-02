# Aluno Module Architecture

## ADDED Requirements

### Self-Contained Module Structure

The 'aluno' module must be self-contained within `app/[tenant]/(modules)/aluno`.

#### Scenario: Directory Structure
Given the project root
When I list `app/[tenant]/(modules)/aluno`
Then I should see `components`, `hooks`, `lib`, `services`, `types` directories
And I should see `layout.tsx` and `page.tsx`.

#### Scenario: No Outer Dependencies
Given a file inside `app/[tenant]/(modules)/aluno`
Then it should not import from `components/aluno` (legacy)
And it should not import from `app/(modules)/aluno` (legacy).

### Migrated Components

Student-specific components must be moved to the module scope.

#### Scenario: Dashboard Components
Given components in `components/dashboard` specific to students
When I check the new module
Then they should be located in `app/[tenant]/(modules)/aluno/components/dashboard`.

## REMOVED Requirements

### Legacy Directory

The legacy 'aluno' directory must be removed.

#### Scenario: Delete Legacy
Given the migration is complete
Then `app/(modules)/aluno` should not exist.

