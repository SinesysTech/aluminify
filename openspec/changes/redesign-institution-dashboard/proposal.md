## Why

The institution admin dashboard has significant UX issues that undermine its usefulness as an analytics tool. A UI/UX audit revealed: truncated metric labels that are unreadable, unhelpful empty states with no guidance or CTAs, inconsistent card heights across the stats row, duplicated "Top Alunos" sections, dead CTA links, misleading badge colors, unlabeled progress bars, hardcoded fake trend data, and missing accessibility attributes. These issues compound to make the dashboard feel unfinished and reduce admin confidence in the platform.

## What Changes

- Redesign the top stats row with consistent card heights and better information density
- Replace all empty states with guided, actionable designs (icon + message + CTA)
- Fix truncated metric labels in the institution metrics grid
- Remove duplicated "Top Alunos" section and consolidate into a single leaderboard with "Ver todos" action
- Add labeled progress bars in the "Visao Geral" card
- Fix badge color semantics (remove misleading orange for positive metrics)
- Wire up dead CTA links (WelcomeCard "Gerenciar Alunos" button)
- Add missing accessibility attributes (aria-labels on icon-only buttons)
- Add visual refresh indicator during period changes
- Fix Portuguese accent issues in card titles ("Visao" -> "Visao Geral" with proper accents)
- Improve heatmap sizing for sparse data states

## Capabilities

### New Capabilities
- `institution-dashboard-layout`: Defines the overall layout structure, card grid system, section ordering, and responsive behavior for the institution admin dashboard view.

### Modified Capabilities
_(No existing specs are affected - the `landing-page` spec is unrelated to the dashboard module.)_

## Impact

- **Components affected:**
  - `app/[tenant]/(modules)/dashboard/components/institution/institution-dashboard-client.tsx` (main orchestrator)
  - `app/[tenant]/(modules)/dashboard/components/institution/institution-metrics.tsx` (metric grid)
  - `app/[tenant]/(modules)/dashboard/components/cards/welcome-card.tsx` (CTA link)
  - `app/[tenant]/(modules)/dashboard/components/cards/student-success-card.tsx` (badge colors)
  - `app/[tenant]/(modules)/dashboard/components/cards/progress-statistics-card.tsx` (labels, badges)
  - `app/[tenant]/(modules)/dashboard/components/cards/leaderboard-card.tsx` (consolidation)
  - `app/[tenant]/(modules)/dashboard/components/cards/chart-most-activity.tsx` (empty state)
  - `app/[tenant]/(modules)/dashboard/components/consistency-heatmap.tsx` (sparse data sizing)
  - `app/[tenant]/(modules)/dashboard/components/metric-card.tsx` (label truncation)
- **No API changes** - all fixes are frontend/presentation layer
- **No database changes** - data layer remains unchanged
- **No breaking changes** - all modifications are visual/UX improvements to existing components
