# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15, Tailwind CSS, Clerk (auth), Supabase (database), Resend (email)

## Users

Students, founders, professionals, and anyone who wants to stay organized. They need a simple, fast way to manage tasks — and they want AI-powered trend analysis of their productivity patterns.

## Product Purpose

Taskly helps people stay organized with a clean, minimal todo app — and gives power users an edge through AI trend analysis of their productivity patterns. The core todo experience is free and unlimited. We charge for advanced AI capabilities, not for basic features like task duration or categories.

## Positioning

Most todo apps either charge for premium features (tags, durations, categories) or offer AI as an upsell on top of a free tier. Taskly does the opposite: every core task management feature is free forever. The AI layer — which studies your productivity trends, surfaces patterns, and gives actionable insights — is the paid product. No tricks, no feature gates on basics.

## Operating Context

Users interact with Taskly daily, often multiple times. The primary workflow is: open app → see todos → add/toggle/delete → optionally check AI insights. Users may check in briefly between classes, meetings, or tasks. The experience should feel fast and simple — not a tool that demands attention, but one that fits into the routine.

## Capabilities and Constraints

- Email + password authentication (Clerk)
- Full CRUD for todos (create, read, update, delete)
- Toggle completed status
- Server-side rendering for todo list
- User-specific data isolation (each user sees only their todos)
- Mobile-responsive design
- Future: AI trend analysis (paid tier), task duration tracking, categories, reminders

## Brand Commitments

- Name: Taskly
- Voice: Clean, direct, confident — not playful or quirky
- No feature gates on core task management
- Transparency about what's free vs. paid

## Evidence on Hand

- Design system: "Soft Tactility" — warm bone backgrounds, paper-like surfaces, tactile inputs with inner shadows, deep diffused shadows, DM Sans typography, sage green primary palette
- Reference designs: Login and signup pages with glassmorphism-inspired card layouts
- Existing color tokens and typography scale defined in DESIGN.md

## Product Principles

1. Core task management is always free — no exceptions
2. AI is the product, not the features
3. Speed and simplicity over feature density
4. Respect the user's attention — no unnecessary notifications or distractions
5. Build trust through transparency

## Accessibility & Inclusion

- Minimum touch target size for mobile interactions
- Sufficient color contrast for readability
- Keyboard navigation support
