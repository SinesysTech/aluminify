# Change: Add Landing Page for Aluminify Platform

## Why
The platform needs a public-facing landing page to communicate the value proposition of Aluminify as an open-source, white-label student area solution for educational institutions. This page will serve as the primary entry point for potential customers (school owners) and developers interested in self-hosting or contributing to the project.

## What Changes
- Add a new landing page at `/` route (accessible before authentication)
- Implement Hero Section with main value proposition
- Add Value Proposition grid (Data Sovereignty, White Label, Contextual AI)
- Implement Features Bento Grid (Student Area, Flashcards, Smart Schedule)
- Add Open Source vs Cloud pricing model section
- Implement pricing table for cloud plans
- Add Footer with CTAs and links

## Impact
- Affected specs: landing-page (new capability)
- Affected code:
  - `app/(landing)/page.tsx` (new)
  - `app/(landing)/layout.tsx` (new)
  - `components/landing/*` (new components)
  - `app/page.tsx` (redirect logic update)
