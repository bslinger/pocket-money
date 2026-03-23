# packages/shared/CLAUDE.md

## Purpose

`@quiddo/shared` contains TypeScript types, Zod validation schemas, and constants shared between the Inertia.js web app and the Expo React Native mobile app. It is an npm workspace package — both frontends import from `@quiddo/shared`.

## What belongs here

- **TypeScript interfaces** for every API response shape (`src/types/`). These must exactly match what Laravel API Resources return.
- **Zod schemas** for every form submitted by either frontend (`src/validation/`). These must mirror Laravel FormRequest validation rules exactly.
- **Constants and enums** used by both frontends (`src/constants/`). Enum values, colour tokens, pagination defaults, currency presets.

## What does NOT belong here

- React components (web or mobile)
- API client code or fetch functions
- Business logic or calculations (these live in Laravel)
- Platform-specific utilities
- Anything that imports `react`, `react-native`, or `@inertiajs/*`

## Rules

1. **Types must match Laravel API Resources exactly.** When a Laravel Resource changes, update the corresponding type here. Field names, nullability, and nesting must be identical.
2. **Zod schemas must mirror Laravel FormRequest rules.** When validation rules change in a FormRequest, update the corresponding schema here. Same field names, same constraints.
3. **No runtime dependencies except `zod`.** This package must stay lightweight.
4. **Barrel exports only.** Everything is re-exported from `src/index.ts`.
