# Design: Landing Page Architecture

## Context
The landing page needs to follow the existing project patterns while being a standalone public page that doesn't require authentication. It should use the existing shadcn/ui components and Tailwind CSS styling system.

## Goals / Non-Goals
**Goals:**
- Create a clean, modern landing page following Bento Grid/PrismUI design principles
- Communicate the dual-model (Open Source + Cloud) clearly
- Mobile-first responsive design
- Use existing component library (Button, Card, Badge)
- Performance-optimized with minimal client-side JavaScript

**Non-Goals:**
- Complex animations (keep simple with Motion library)
- Backend integration (landing is static content)
- Multi-language support (Portuguese only for now)

## Decisions

### 1. Route Structure
**Decision:** Use Next.js route groups with `(landing)` folder
**Why:** Allows separate layout without affecting existing authenticated routes

### 2. Component Organization
**Decision:** Create components inline in page.tsx initially, extract if reused
**Why:** Follows YAGNI principle, avoids premature abstraction

### 3. Styling Approach
**Decision:** Use Tailwind classes with existing design tokens
**Why:** Consistency with existing codebase, no new dependencies

### 4. Design System
**Decision:** Follow reference image (Acme-style) with clean white background, subtle grid, black typography
**Why:** Matches the specs.md requirements for "Bento Grid/PrismUI" style

## Component Structure

```
app/(landing)/
├── layout.tsx          # Minimal wrapper, no auth
├── page.tsx            # Main landing page
└── components/         # Landing-specific components (if needed)
```

## Risks / Trade-offs
- **Risk:** Root page redirect logic needs careful handling
  - **Mitigation:** Check auth status and only redirect authenticated users

## Open Questions
- None at this time
