# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pocket Money** is a family financial management app — parents manage savings accounts, transactions, chores, and goals for their kids (spenders). Built with Laravel 13 + Inertia.js + React.

## Commands

All commands run via Laravel Sail. Add the alias for convenience:
```bash
alias sail='./vendor/bin/sail'
```

### Starting / stopping
```bash
sail up -d       # Start containers in background (app + postgres)
sail down        # Stop containers
sail down -v     # Stop and wipe volumes (including DB data)
```

### First-time setup
```bash
sail up -d
sail artisan migrate
npm install && npm run dev   # Run Vite locally (outside container)
```

### Development
```bash
sail artisan serve          # Not needed — Sail's app container serves on port 80
npm run dev                 # Run Vite dev server locally for HMR
sail artisan queue:work     # Run queue worker inside container
```

### Testing
```bash
sail artisan test                         # Run all PHPUnit tests (SQLite in-memory)
sail artisan test --testsuite=Feature     # Feature tests only
sail artisan test --testsuite=Unit        # Unit tests only
sail artisan test tests/Feature/Auth/AuthenticationTest.php  # Single file

npm run test:e2e          # Run Playwright E2E tests (resets DB + seeds first)
npm run test:e2e:ui       # Playwright interactive UI mode
npm run test:e2e:headed   # Run with browser visible
```

Playwright tests live in `tests/e2e/`. Each parallel worker creates its own isolated database (`pocket_money_test_{N}`) via `sail artisan test:db:prepare {N}`, which migrates and seeds it fresh. Auth state is stored per-worker in `tests/e2e/.auth/user_{N}.json` (gitignored). Tests import `test` and `expect` from `tests/e2e/fixtures.ts`, not from `@playwright/test` directly. Auth tests opt out of the shared auth state with `test.use({ storageStatePath: null })`.

### Database
```bash
sail artisan migrate              # Run migrations
sail artisan migrate:fresh --seed # Fresh database with seed data
sail artisan db:seed              # Seed only
sail psql                         # Connect to Postgres via psql
```

### Static analysis
```bash
sail exec laravel.test ./vendor/bin/phpstan analyse   # Run PHPStan (level 5 via phpstan.neon)
```

### Build
```bash
npm run build    # TypeScript check + Vite build
```

### Artisan / Composer inside container
```bash
sail artisan <command>
sail composer <command>
```

## Architecture

### Stack
- **Backend:** Laravel 13, PHP 8.4+
- **Frontend:** Inertia.js 2.0 + React 18 + TypeScript
- **Build:** Vite 7 + Tailwind CSS 3
- **Auth:** Laravel Breeze (session-based, email verification required)
- **Billing:** Laravel Cashier (Stripe)
- **Testing:** PHPUnit 12 (SQLite in-memory)

### Request Flow
All routes use Inertia — controllers return `Inertia::render('PageName', [...props])` and React page components in `resources/js/Pages/` receive those props directly as typed TypeScript props.

### Authorization Model
Two user tiers enforced at the middleware level:
- **Parent:** Has a `FamilyUser` record. Accesses parent-only routes protected by the `require.parent` middleware (`RequireParent`).
- **Child:** Linked via `SpenderUser`. Sees a child dashboard with their spenders' accounts and pending chores.

`User::isParent()` checks for the existence of `familyUsers`. The `HandleInertiaRequests` middleware shares `isParent` to all frontend pages.

Email verification is required for dashboard access (`verified` middleware).

### Key Models & Relationships
```
User ─── FamilyUser ─── Family ─── Spender ─── Account ─── Transaction
                                          └─── SavingsGoal   └─── RecurringTransaction
                                          └─── ChoreCompletion ── Chore (BelongsToMany via chore_spender)
         SpenderUser ──────────────────────┘
```

All models use UUID primary keys (`HasUuids`, `$incrementing = false`).

Currency fields (`balance`, `amount`, `target_amount`) are cast as `decimal:2`.

Enums used for: `TxType` (Credit/Debit), `ChoreRewardType`, `ChoreFrequency`, `CompletionStatus`, `FamilyRole`.

### Routing
Routes are in `routes/web.php` and `routes/auth.php`. Parent-only resource routes are grouped under the `require.parent` middleware. A catch-all show route for spenders/accounts is placed *after* resource routes to avoid conflicts.

Scheduled commands live in `routes/console.php` — recurring transactions run hourly via `recurring:run`.

### Frontend Structure
- `resources/js/Pages/` — Route-level React components (one per Inertia page)
- `resources/js/Components/` — Shared UI components
- `resources/js/Layouts/` — Page layout wrappers
- `resources/js/types/` — TypeScript type definitions for Inertia props
- `resources/js/lib/` — Utility helpers

Path alias `@/` resolves to `resources/js/`.

### Image Uploads
Browser uploads directly to S3 via presigned URLs. `ImageUploadController::sign()` generates the presigned URL; the client uploads, then saves the `image_key` reference to the backend.

Temporary signed URLs (60-minute expiry) are generated via `Storage::temporaryUrl()` on models with `image_key`.

### Test Environment
Tests use SQLite `:memory:`, array drivers for cache/mail/queue/session, and `RefreshDatabase`. Factories exist for all models.

# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
- Write Pest and Playwright tests for all code changes, and ensure they pass
- Run PHPStan after every feature is implemented and ensure it passes
