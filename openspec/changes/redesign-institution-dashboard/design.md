## Context

The institution admin dashboard (`InstitutionDashboardClient`) is the primary analytics view for administrators. It currently uses a vertical stack of card sections: WelcomeCard, stats row (3 cards), chart + metrics row, heatmap, rankings, and discipline performance.

The current implementation has several structural issues identified in a UI/UX audit:
- The `grid xl:grid-cols-3` stats row produces mismatched card heights because `StudentSuccessCard`, `ProgressStatisticsCard`, and `LeaderboardCard` have different content volumes
- `InstitutionMetrics` renders 4 `MetricCard` components in a `grid-cols-2 lg:grid-cols-4` that truncates labels at narrow widths
- Empty states across `ChartMostActivity`, `DisciplinaPerformanceList`, and the heatmap are plain text with no visual guidance
- `StudentRankingList` duplicates the `LeaderboardCard` data

All changes are confined to the dashboard module's component layer. No API endpoints, database schema, or authentication logic is affected.

## Goals / Non-Goals

**Goals:**
- Fix all critical and high-severity UX issues from the audit
- Ensure consistent card heights across grid rows
- Provide actionable empty states with icons and CTAs
- Remove duplicated data sections
- Add missing accessibility attributes
- Add visual feedback during data refresh

**Non-Goals:**
- Redesigning the student or professor dashboard views
- Changing the data model or API endpoints
- Adding new metrics or data sources
- Changing the sidebar navigation or layout shell
- Implementing dark mode fixes (separate concern)
- Adding new chart types or libraries

## Decisions

### 1. Fix card heights via `h-full` + flex layout

**Decision:** Add `h-full` to all cards in the stats row and use `flex flex-col` with `flex-1` on content areas to distribute space evenly.

**Rationale:** This is the standard CSS Grid approach for equal-height cards. The `LeaderboardCard` already uses `h-full`; extending this to `StudentSuccessCard` and `ProgressStatisticsCard` unifies behavior. Alternative: fixed min-height on the row - rejected because it doesn't adapt to content changes.

### 2. Fix metric label truncation via responsive text and tooltips

**Decision:** Replace `truncate` on `MetricCard` labels with a combination of: (a) shorter default labels when used in the institution metrics grid, and (b) adding `title` attributes for hover tooltips as a fallback. For the institution grid specifically, change from `grid-cols-2 lg:grid-cols-4` to a responsive `grid-cols-2 xl:grid-cols-4` to give cards more horizontal space on medium screens.

**Rationale:** The labels truncate because the 4-column grid at `lg` breakpoint (1024px) gives each card ~230px, which is too narrow for labels like "Atividades Concluidas". Bumping to `xl` (1280px) gives each card ~280px. Alternative: wrapping labels to 2 lines - rejected because it breaks the compact metric card aesthetic.

### 3. Consolidate duplicate "Top Alunos" sections

**Decision:** Remove the standalone `StudentRankingList` component from the rankings row. Enhance the existing `LeaderboardCard` in the stats row to show up to 5 items and add a "Ver todos" button that scrolls to or navigates to a full student list.

**Rationale:** Showing the same data twice wastes vertical space and confuses the information hierarchy. The `LeaderboardCard` is better positioned in the top row for at-a-glance viewing. The `ProfessorRankingList` will remain in its own full-width card below the heatmap.

### 4. Standardized empty state component pattern

**Decision:** Create an inline `EmptyState` pattern (not a new shared component file) using Lucide icons, descriptive text, and an optional CTA button. Apply consistently to `ChartMostActivity`, `DisciplinaPerformanceList`, `LeaderboardCard`, and `ConsistencyHeatmap`.

**Rationale:** An empty state with just "Sem dados" text provides no guidance. The pattern: centered icon (muted, 48px) + title + description + optional action button. This follows UX best practice of guiding users when no content exists. Alternative: creating a shared `EmptyState` component in `app/shared/components/` - deferred to avoid scope creep since only 4 places need it and a utility component extraction can be done later.

### 5. Fix badge color semantics in ProgressStatisticsCard

**Decision:** Change "Cursos Ativos" badge from `bg-orange-500` to `bg-primary` and keep "Alunos Ativos" badge at `bg-green-500`.

**Rationale:** Orange communicates "warning" or "pending" in most design systems. Active courses are a neutral/positive metric. Using the primary color (brand blue/dark) for courses and green for active students creates a clear semantic separation: neutral informational vs positive active state.

### 6. Add progress bar labels in ProgressStatisticsCard

**Decision:** Add small `text-xs text-muted-foreground` labels above each progress bar indicating what it represents (e.g., "Atividade" and "Conclusao").

**Rationale:** The current progress bars at 0% and 9% have no context. Users cannot determine what they measure without labels.

### 7. Visual refresh indicator

**Decision:** Add `opacity-50 transition-opacity` to the main content `div` when `isRefreshing` is true, along with a small loading spinner overlay near the period selector.

**Rationale:** The current implementation sets `isRefreshing` state but has no visual representation. Users clicking the refresh button or changing period get no feedback that data is loading. Alternative: skeleton overlays - rejected as too heavy for a refresh of existing data.

### 8. Wire WelcomeCard CTA with tenant-aware route

**Decision:** In `InstitutionDashboardClient`, pass `ctaHref` using the tenant from `usePathname()` to construct the proper route to the student management page.

**Rationale:** The current default `ctaHref="#"` produces a dead link. The institution admin's primary action from the dashboard is managing students, so linking to the alunos module is the correct target.

## Risks / Trade-offs

- **Risk: Removing StudentRankingList may lose information** - The standalone list may show more entries than the compact LeaderboardCard. Mitigation: Ensure the LeaderboardCard shows up to 5 entries and includes a "Ver todos" navigation option.

- **Risk: Changing grid breakpoints may affect other dashboard views** - The `InstitutionMetrics` component is only used by the institution dashboard, so changing its grid breakpoint is safe. The `MetricCard` component is shared, but we are not modifying its internal layout, only how the parent grid arranges them.

- **Trade-off: Inline empty states vs shared component** - Inline patterns are slightly more verbose but avoid creating a new shared dependency for 4 call sites. Acceptable for this scope.

- **Trade-off: `previousSuccessRate` hardcoded calculation remains** - The proposal identified `Math.max(0, currentSuccessRate - 2)` as misleading. However, fixing this requires API changes to provide real historical data, which is out of scope. The hardcoded delta is left as-is with a code comment marking it as a known limitation.
