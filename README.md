# Pocket Money

A family financial management app — parents manage savings accounts, transactions, chores, and goals for their kids.

![CI](https://github.com/bslinger/pocket-money/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/bslinger/pocket-money/graph/badge.svg)](https://codecov.io/gh/bslinger/pocket-money)

## Stack

- **Backend:** Laravel 13, PHP 8.4
- **Frontend:** Inertia.js 2 + React 18 + TypeScript
- **Styling:** Tailwind CSS 3
- **Database:** PostgreSQL (via Laravel Sail)
- **Auth:** Laravel Breeze (session-based, email verification)
- **Billing:** Laravel Cashier (Stripe)
- **Testing:** Pest (PHP) + Playwright (E2E)

## Getting Started

```bash
alias sail='./vendor/bin/sail'

sail up -d
sail artisan migrate --seed
npm install && npm run dev
```

The app is served at `http://localhost`.

## Testing

```bash
# PHP tests (Pest, SQLite in-memory)
sail artisan test

# E2E tests (Playwright)
npm run test:e2e

# Static analysis
sail exec laravel.test ./vendor/bin/phpstan analyse
```

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
