# CLAUDE.md

## Product

**Quiddo** is an Australian family pocket money tracking app. Parents manage savings accounts, transactions, chores, and goals for their kids (spenders). Two frontends — Inertia.js web app and Expo React Native mobile app — share a single Laravel backend.

## Monorepo Structure

```
/                           ← Laravel backend (root of repo)
├── app/                    ← PHP: Models, Controllers, Services, Middleware
├── routes/                 ← web.php (Inertia), api.php (mobile JSON API), auth.php
├── resources/js/           ← Web frontend: Inertia + React pages
├── mobile/                 ← Expo React Native app (Expo Router, TanStack Query)
├── landing/                ← Astro static marketing site (GitHub Pages → quiddo.com.au)
├── packages/
│   └── shared/             ← @quiddo/shared: TypeScript types, Zod schemas, constants
├── database/migrations/    ← All database migrations
└── tests/                  ← Pest PHP tests + Playwright E2E tests
```

## Domains

| Domain | Source | Deployment |
|--------|--------|------------|
| `quiddo.com.au` | `/landing` (Astro static site) | GitHub Pages — auto-deploys on push to `landing/**` |
| `app.quiddo.com.au` | `/` (Laravel root) | Laravel Cloud — manual deploy via CI workflow |

The landing page is an Astro project that renders React components to static HTML. Build: `cd landing && npm run build`. The app subdomain has `robots.txt` disallowing all crawlers.

## Tech Stack

- **Backend:** Laravel 13, PHP 8.4+ on Laravel Cloud (ap-southeast-2 Sydney)
- **Web frontend:** Inertia.js v3 + React 19 + TypeScript, Vite 7 + Tailwind CSS
- **Mobile frontend:** Expo SDK 55, React Native 0.83, Expo Router, TanStack Query, MMKV
- **Auth:** Laravel Sanctum — session auth for Inertia, token auth for mobile API
- **Billing:** Laravel Cashier (Stripe)
- **Email:** Bento
- **Push notifications:** Direct FCM HTTP v1 API + APNs from Laravel. NO Firebase SDK in mobile app.
- **Testing:** Pest 4 (SQLite in-memory), Playwright E2E

## Commands

All Laravel commands run via Sail:
```bash
alias sail='./vendor/bin/sail'
sail up -d                                    # Start containers
sail artisan migrate                          # Run migrations
sail artisan test --compact                   # Run Pest tests
sail exec laravel.test ./vendor/bin/phpstan analyse  # PHPStan (level 5)
npm run dev                                   # Vite dev server (run locally)
npm run build                                 # TypeScript check + Vite build
npm run test:e2e                              # Playwright E2E tests
cd mobile && npx expo start                   # Start Expo dev server
```

Playwright tests live in `tests/e2e/`. Each parallel worker gets its own database (`pocket_money_test_{N}`). Tests import from `tests/e2e/fixtures.ts`, not `@playwright/test` directly.

## Data Model

```
User ─── FamilyUser ─── Family ─── Spender ─── Account ─── Transaction
                                          └─── SavingsGoal   └─── RecurringTransaction
                                          └─── ChoreCompletion ── Chore (M2M via chore_spender)
                                          └─── ChoreReward ────── Chore (M2M via chore_chore_reward)
                                          └─── PocketMoneySchedule
         SpenderUser ──────────────────────┘
         Family ─── Invitation / ChildInvitation / BillingTransferInvitation
```

All domain models use UUID primary keys. Currency amounts are `decimal:2`. Enums: `TxType`, `ChoreRewardType`, `ChoreFrequency`, `CompletionStatus`, `FamilyRole`, `Frequency`.

## Authorization Model

- **Parent:** Has a `FamilyUser` record. Parent-only routes protected by `require.parent` middleware.
- **Child:** Linked via `SpenderUser`. Sees child dashboard with their spenders' accounts and chores.
- `User::isParent()` checks for `familyUsers`. Shared to frontend via `HandleInertiaRequests`.
- Subscription required for write operations (`subscribed.family` middleware). Read-only when frozen.
- 30-day trial, one per user across all families.

## API Conventions

- **Web (Inertia):** Controllers return `Inertia::render('PageName', $props)`. Session auth.
- **Mobile API:** `routes/api.php` under `/api/v1/`. Bearer token auth via Sanctum.
  - Single resource: `{ "data": { ... } }`
  - Collection: `{ "data": [...], "meta": { current_page, last_page, per_page, total } }`
  - Error: `{ "message": "...", "errors": { ... } }`
- API Resources in `app/Http/Resources/` define JSON shapes. Types in `packages/shared/src/types/` must match exactly.

## Design System — Eucalyptus Palette

| Role | Token | Hex | Rule |
|------|-------|-----|------|
| Primary brand / CTAs | eucalyptus-400 | #4A7C59 | |
| Page background | bark-100 | #F5F0E8 | |
| Primary headings | bark-700 | #3A3028 | |
| Secondary text | bark-600 | #8C7A60 | |
| Earn / approve | gumleaf-400 | #2A9E5C | ONLY for earn and approve states |
| Spend / decline | redearth-400 | #C8483C | ONLY for spend and decline states |
| Goals / balances / badges | wattle-400 | #E8A030 | |
| Kid view dark bg | nightsky-900 | #081828 | |

- **Fonts:** Fraunces (font-display) for headings, display numbers, logo. DM Sans (font-body) for all UI text.
- **Border radius:** rounded-pill (99px), rounded-card (12px), rounded-input (8px)

## Critical Rules

1. **Never duplicate types.** API response shapes live in `packages/shared/src/types/`. Both web and mobile import from `@quiddo/shared`.
2. **Never duplicate business logic.** Calculations and rules live in Laravel (models, services, controllers). TypeScript never reimplements them.
3. **Never break existing Inertia functionality.** Every existing web page, route, and controller must work after changes.
4. **Earn is always gumleaf (#2A9E5C). Spend is always redearth (#C8483C).** Semantic signals — never repurposed.
5. **No Firebase SDK in the mobile app.** Push notifications via direct FCM/APNs HTTP APIs from Laravel.
6. **Encrypt sensitive fields.** Never store tokens or secrets in plain text.
7. **Zod schemas must mirror Laravel FormRequest rules.** Keep `packages/shared/src/validation/` in sync with `app/Http/Requests/`.

## Cross-Cutting Changes

When adding or modifying a feature, these files may need updating:
1. **Laravel:** Migration, Model, Controller (Inertia + API), FormRequest, API Resource, Routes
2. **Shared:** `packages/shared/src/types/` (response type), `packages/shared/src/validation/` (form schema)
3. **Web:** `resources/js/Pages/` (Inertia page component)
4. **Mobile:** `mobile/app/` (screen), `mobile/lib/api/` (query hook)
5. **Tests:** Pest feature test, Playwright E2E test

## Notion workspace

Quiddo uses Notion as a shared knowledge layer between Claude Code sessions and Claude.ai.

**Hub page:** https://www.notion.so/32e2a3ea64d981f7a0b6fd741a932059

**Workflow rules:**
- At the START of any session involving architectural decisions, new features, or significant changes: read the Strategy and Tech Stack Notion pages to check for decisions made since the last session
- At the END of any session where features were completed or decisions were made: update the relevant Notion pages and tick off completed items in the Implementation TODO
- Never make architectural decisions that contradict the Tech Stack page without flagging the conflict first
- When Claude.ai updates Notion with new decisions, those decisions are binding — treat them as you would treat instructions from the user

**Notion API:**
- Token: stored in NOTION_TOKEN environment variable
- API version header: Notion-Version: 2022-06-28
- Base URL: https://api.notion.com/v1/

**Page IDs:**
- Hub: 32e2a3ea64d981f7a0b6fd741a932059
- Strategy: 32e2a3ea64d9811c977feb9b91e94fc1
- Tech Stack: 32e2a3ea64d981e0b681d9bb186510cb
- **Implementation TODO: 32e2a3ea64d981a68d6fc2f070501b8e** ← Claude Code owns this
- Launch Checklist: 32e2a3ea64d98131818bcad79e78d14b ← company-level only, don't touch
- Design System: 32e2a3ea64d9818ebc15da1503de4186
- Financials: 32e2a3ea64d9819a9143f626c4bfed45
- Competitor Research: 32e2a3ea64d9812bbb7adb9b09bacd4c

**Two-page distinction — never confuse these:**
- 🔧 Implementation TODO = engineering tasks in the codebase. Claude Code reads and writes this every session.
- ✅ Launch Checklist = company-level readiness (legal, App Store, domains). Claude Code does NOT update this unless explicitly asked.

## Workflow

- Typecheck after code changes
- Prefer running single tests, not the whole suite
- Write Pest and Playwright tests for all code changes
- Run PHPStan after every PHP change
- Run `sail bin pint --dirty --format agent` after PHP changes

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v2
- laravel/breeze (BREEZE) - v2
- laravel/cashier (CASHIER) - v16
- laravel/framework (LARAVEL) - v13
- laravel/nightwatch (NIGHTWATCH) - v1
- laravel/octane (OCTANE) - v2
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- tightenco/ziggy (ZIGGY) - v2
- larastan/larastan (LARASTAN) - v3
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA_REACT) - v2
- react (REACT) - v18
- tailwindcss (TAILWINDCSS) - v3

## Skills Activation

This project has domain-specific skills available. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

- `cashier-stripe-development` — Handles Laravel Cashier Stripe integration including subscriptions, webhooks, Stripe Checkout, invoices, charges, refunds, trials, coupons, metered billing, and payment failure handling. Triggered when a user mentions Cashier, Billable, IncompletePayment, stripe_id, newSubscription, Stripe subscriptions, or billing. Also applies when setting up webhooks, handling SCA/3DS payment failures, testing with Stripe test cards, or troubleshooting incomplete subscriptions, CSRF webhook errors, or migration publish issues.
- `pest-testing` — Use this skill for Pest PHP testing in Laravel projects only. Trigger whenever any test is being written, edited, fixed, or refactored — including fixing tests that broke after a code change, adding assertions, converting PHPUnit to Pest, adding datasets, and TDD workflows. Always activate when the user asks how to write something in Pest, mentions test files or directories (tests/Feature, tests/Unit, tests/Browser), or needs browser testing, smoke testing multiple pages for JS errors, or architecture tests. Covers: it()/expect() syntax, datasets, mocking, browser testing (visit/click/fill), smoke testing, arch(), Livewire component tests, RefreshDatabase, and all Pest 4 features. Do not use for factories, seeders, migrations, controllers, models, or non-test PHP code.
- `inertia-react-development` — Develops Inertia.js v2 React client-side applications. Activates when creating React pages, forms, or navigation; using <Link>, <Form>, useForm, or router; working with deferred props, prefetching, or polling; or when user mentions React with Inertia, React pages, React forms, or React navigation.
- `tailwindcss-development` — Always invoke when the user's message includes 'tailwind' in any form. Also invoke for: building responsive grid layouts (multi-column card grids, product grids), flex/grid page structures (dashboards with sidebars, fixed topbars, mobile-toggle navs), styling UI components (cards, tables, navbars, pricing sections, forms, inputs, badges), adding dark mode variants, fixing spacing or typography, and Tailwind v3/v4 work. The core use case: writing or fixing Tailwind utility classes in HTML templates (Blade, JSX, Vue). Skip for backend PHP logic, database queries, API routes, JavaScript with no HTML/CSS component, CSS file audits, build tool configuration, and vanilla CSS.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `vendor/bin/sail npm run build`, `vendor/bin/sail npm run dev`, or `vendor/bin/sail composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan Commands

- Run Artisan commands directly via the command line (e.g., `vendor/bin/sail artisan route:list`, `vendor/bin/sail artisan tinker --execute "..."`).
- Use `vendor/bin/sail artisan list` to discover available commands and `vendor/bin/sail artisan [command] --help` to check parameters.

## URLs

- Whenever you share a project URL with the user, you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain/IP, and port.

## Debugging

- Use the `database-query` tool when you only need to read from the database.
- Use the `database-schema` tool to inspect table structure before writing migrations or models.
- To execute PHP code for debugging, run `vendor/bin/sail artisan tinker --execute "your code here"` directly.
- To read configuration values, read the config files directly or run `vendor/bin/sail artisan config:show [key]`.
- To inspect routes, run `vendor/bin/sail artisan route:list` directly.
- To check environment variables, read the `.env` file directly.

## Reading Browser Logs With the `browser-logs` Tool

- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)

- Boost comes with a powerful `search-docs` tool you should use before trying other approaches when working with Laravel or Laravel ecosystem packages. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic-based queries at once. For example: `['rate limiting', 'routing rate limiting', 'routing']`. The most relevant results will be returned first.
- Do not add package names to queries; package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'.
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit".
3. Quoted Phrases (Exact Position) - query="infinite scroll" - words must be adjacent and in that order.
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit".
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms.

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.

## Constructors

- Use PHP 8 constructor property promotion in `__construct()`.
    - `public function __construct(public GitHub $github) { }`
- Do not allow empty `__construct()` methods with zero parameters unless the constructor is private.

## Type Declarations

- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<!-- Explicit Return Types and Method Params -->
```php
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
```

## Enums

- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.

## Comments

- Prefer PHPDoc blocks over inline comments. Never use comments within the code itself unless the logic is exceptionally complex.

## PHPDoc Blocks

- Add useful array shape type definitions when appropriate.

=== sail rules ===

# Laravel Sail

- This project runs inside Laravel Sail's Docker containers. You MUST execute all commands through Sail.
- Start services using `vendor/bin/sail up -d` and stop them with `vendor/bin/sail stop`.
- Open the application in the browser by running `vendor/bin/sail open`.
- Always prefix PHP, Artisan, Composer, and Node commands with `vendor/bin/sail`. Examples:
    - Run Artisan Commands: `vendor/bin/sail artisan migrate`
    - Install Composer packages: `vendor/bin/sail composer install`
    - Execute Node commands: `vendor/bin/sail npm run dev`
    - Execute PHP scripts: `vendor/bin/sail php [script]`
- View all available Sail commands by running `vendor/bin/sail` without arguments.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `vendor/bin/sail artisan test --compact` with a specific filename or filter.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/Pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v2

- Use all Inertia features from v1 and v2. Check the documentation before making changes to ensure the correct approach.
- New features: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `vendor/bin/sail artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `vendor/bin/sail artisan list` and check their parameters with `vendor/bin/sail artisan [command] --help`.
- If you're creating a generic PHP class, use `vendor/bin/sail artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

## Database

- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries.
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `vendor/bin/sail artisan make:model --help` to check the available options.

### APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## Controllers & Validation

- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

## Authentication & Authorization

- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Queues

- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

## Configuration

- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `vendor/bin/sail artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `vendor/bin/sail npm run build` or ask the user to run `vendor/bin/sail npm run dev` or `vendor/bin/sail composer run dev`.

=== octane/core rules ===

# Octane

- Octane boots the application once and reuses it across requests, so singletons persist between requests.
- The Laravel container's `scoped` method may be used as a safe alternative to `singleton`.
- Never inject the container, request, or config repository into a singleton's constructor; use a resolver closure or `bind()` instead:

```php
// Bad
$this->app->singleton(Service::class, fn (Application $app) => new Service($app['request']));

// Good
$this->app->singleton(Service::class, fn () => new Service(fn () => request()));
```

- Never append to static properties, as they accumulate in memory across requests.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/sail bin pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/sail bin pint --test --format agent`, simply run `vendor/bin/sail bin pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `vendor/bin/sail artisan make:test --pest {name}`.
- Run tests: `vendor/bin/sail artisan test --compact` or filter: `vendor/bin/sail artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
