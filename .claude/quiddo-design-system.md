# Quiddo — Eucalyptus Design System
## Tailwind config + usage guide for Claude Code

---

## 1. Tailwind config

Add this to your `tailwind.config.js` inside `theme.extend.colors`:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {

        // ── BRAND ──────────────────────────────────────────
        // Primary brand colour. Use for CTAs, nav logo, key UI accents.
        eucalyptus: {
          50:  '#EDF5F0',
          100: '#D0E8D8',
          200: '#A8D4B8',
          300: '#75B98C',
          400: '#4A7C59',   // ← primary brand (buttons, links, active states)
          500: '#3A6347',
          600: '#2A4A34',   // ← dark variant (hover states, footer bg)
          700: '#1C3324',
          800: '#0F1F15',
          900: '#060E09',
        },

        // Warm neutral — page backgrounds, card surfaces, inputs
        bark: {
          50:  '#FDFBF7',   // ← lightest page bg
          100: '#F5F0E8',   // ← standard page / app bg
          200: '#EBE4D6',   // ← card borders, input borders
          300: '#D8CEBC',   // ← dividers
          400: '#B8A98E',   // ← placeholder text
          500: '#8C7A60',   // ← secondary text
          600: '#5E5040',   // ← body text
          700: '#3A3028',   // ← headings
          800: '#1E1810',
          900: '#0A0804',
        },

        // Reward / earning accent — goals, balances, savings progress
        wattle: {
          50:  '#FEF8EC',
          100: '#FDECC8',
          200: '#FAD98A',
          300: '#F7C14A',
          400: '#E8A030',   // ← primary wattle (goal bars, balance amounts, badges)
          500: '#C07818',
          600: '#8A5208',   // ← dark wattle (text on wattle-50 bg)
          700: '#5C3404',
          800: '#2E1A02',
          900: '#120A01',
        },

        // Spend / deduction — always red, never repurposed
        redearth: {
          50:  '#FDF0EF',
          100: '#FAD8D5',
          200: '#F4AEAA',
          300: '#E87C74',
          400: '#C8483C',   // ← primary (spend rows, decline buttons)
          500: '#A03028',
          600: '#78201A',   // ← dark (text on redearth-50)
          700: '#501410',
          800: '#280A08',
          900: '#100303',
        },

        // Earn / approval — always green, never repurposed
        gumleaf: {
          50:  '#EDF7F1',
          100: '#D0ECD9',
          200: '#A3D9B5',
          300: '#6ABF8A',
          400: '#2A9E5C',   // ← primary (earn rows, approve buttons, chore complete)
          500: '#1E7A44',
          600: '#145830',   // ← dark (text on gumleaf-50)
          700: '#0C3A20',
          800: '#061D10',
          900: '#020C06',
        },

        // Kid view — dark background surfaces
        nightsky: {
          50:  '#E8ECF0',
          100: '#C0CAD4',
          200: '#8FA3B2',
          300: '#5A7A8E',
          400: '#2E5468',
          500: '#1A3A4E',
          600: '#0F2538',   // ← kid view card bg
          700: '#081828',   // ← kid view main bg
          800: '#040E18',
          900: '#010508',
        },

      },

      // ── FONTS ─────────────────────────────────────────────
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],   // headings, logo, balance amounts
        body:    ['DM Sans', 'system-ui', 'sans-serif'], // all UI text
      },

      // ── BORDER RADIUS ─────────────────────────────────────
      borderRadius: {
        'pill': '99px',   // buttons, badges, tags
        'card': '12px',   // cards, modals, panels
        'input': '8px',   // form inputs, small chips
      },

    },
  },
}
```

---

## 2. Semantic colour roles

These are the rules Claude Code should follow — never deviate from these mappings.

### Global rules
| Role | Token | Notes |
|------|-------|-------|
| Page background | `bg-bark-100` | App and website default |
| Card / surface | `bg-white` + `border-bark-200` | All cards |
| Primary heading | `text-bark-700` | H1–H3 |
| Body text | `text-bark-600` | Paragraphs, labels |
| Secondary / muted text | `text-bark-500` | Captions, hints, timestamps |
| Placeholder | `text-bark-400` | Input placeholders |
| Primary CTA button | `bg-eucalyptus-400 text-white hover:bg-eucalyptus-500` | |
| Secondary CTA button | `border border-eucalyptus-400 text-eucalyptus-400 hover:bg-eucalyptus-50` | |
| Destructive button | `bg-redearth-400 text-white hover:bg-redearth-500` | Delete, decline only |
| Dividers / borders | `border-bark-200` | Default border colour |
| Active nav item | `bg-eucalyptus-50 text-eucalyptus-600 font-medium` | |
| Focus ring | `ring-2 ring-eucalyptus-400` | All focusable elements |

### Financial transaction rows
| Role | Token |
|------|-------|
| Earn row background | `bg-gumleaf-50` |
| Earn amount text | `text-gumleaf-400` |
| Earn icon background | `bg-gumleaf-100` |
| Spend row background | `bg-redearth-50` |
| Spend amount text | `text-redearth-400` |
| Spend icon background | `bg-redearth-100` |

> **Rule:** Earn is always gumleaf green. Spend is always redearth red. These colours must never be used for anything else in the UI — parents and kids learn them as semantic signals.

### Chore & approval states
| State | Background | Text | Border |
|-------|-----------|------|--------|
| Pending approval | `bg-wattle-50` | `text-wattle-600` | `border-wattle-200` |
| Approved / complete | `bg-gumleaf-50` | `text-gumleaf-600` | `border-gumleaf-200` |
| Declined / missed | `bg-redearth-50` | `text-redearth-600` | `border-redearth-200` |
| Active / recurring | `bg-eucalyptus-50` | `text-eucalyptus-600` | `border-eucalyptus-200` |

### Balance & goal display
| Element | Token |
|---------|-------|
| Balance amount (large) | `text-bark-700 font-display` — use Fraunces font |
| Goal progress bar fill | `bg-wattle-400` |
| Goal progress bar track | `bg-bark-200` |
| Goal amount text | `text-wattle-600` |
| Savings badge | `bg-wattle-50 text-wattle-600` |

### Stat / metric cards
| Element | Token |
|---------|-------|
| Card background | `bg-bark-50` |
| Card border | `border-bark-200` |
| Label | `text-bark-400 text-xs uppercase tracking-wide` |
| Value | `text-bark-700 font-display text-2xl` |
| Positive delta | `text-gumleaf-400` |
| Negative delta | `text-redearth-400` |

---

## 3. Kid view — dark theme

The child-facing screen uses a completely different dark theme. Apply these to the kid view wrapper and all its children.

```html
<!-- Kid view wrapper -->
<div class="bg-nightsky-700 min-h-screen text-white">
```

| Element | Token |
|---------|-------|
| Main background | `bg-nightsky-700` |
| Card / surface | `bg-nightsky-600` |
| Card border | `border-nightsky-500/30` |
| Heading text | `text-white` |
| Body / secondary text | `text-white/60` |
| Balance amount | `text-wattle-300 font-display` — warm gold on dark |
| Goal progress fill | `bg-wattle-400` |
| Goal progress track | `bg-white/10` |
| Chore card background | `bg-white/8` |
| Chore card hover | `bg-white/12` |
| "Done!" button | `bg-wattle-400 text-wattle-900` |
| Waiting state | `opacity-40` on the chore card |

---

## 4. Website landing page specifics

The marketing site uses the same palette but with more generous spacing and larger type.

| Element | Token |
|---------|-------|
| Hero background | `bg-bark-50` |
| Hero heading | `font-display text-5xl text-bark-700` |
| Hero accent word | `text-eucalyptus-400 italic` — use italic Fraunces |
| Nav background | `bg-white border-b border-bark-200` |
| Nav logo | `font-display text-eucalyptus-400` |
| Feature card | `bg-white border border-bark-200 rounded-card` |
| Feature icon bg | `bg-eucalyptus-50 rounded-input` |
| Feature icon colour | `text-eucalyptus-400` |
| CTA section bg | `bg-eucalyptus-50` |
| Footer background | `bg-eucalyptus-600` |
| Footer text | `text-eucalyptus-100` |
| Footer logo | `text-wattle-300` |
| Pricing card (featured) | `bg-eucalyptus-600 text-white` |
| Pricing card (standard) | `bg-white border border-bark-200` |
| Pricing amount | `font-display text-4xl` |
| Checkmark items | `text-gumleaf-400` |

---

## 5. Notification & badge patterns

| Type | Classes |
|------|---------|
| Pending count badge | `bg-wattle-400 text-wattle-900 text-xs font-medium px-2 py-0.5 rounded-pill` |
| Success badge | `bg-gumleaf-50 text-gumleaf-600 text-xs font-medium px-2 py-0.5 rounded-pill border border-gumleaf-200` |
| Error badge | `bg-redearth-50 text-redearth-600 text-xs font-medium px-2 py-0.5 rounded-pill border border-redearth-200` |
| "Active" badge | `bg-eucalyptus-50 text-eucalyptus-600 text-xs font-medium px-2 py-0.5 rounded-pill border border-eucalyptus-200` |
| "Shared" badge | `bg-bark-100 text-bark-600 text-xs font-medium px-2 py-0.5 rounded-pill border border-bark-300` |

---

## 6. Toggle / switch component

```html
<!-- On state -->
<div class="w-10 h-5 bg-gumleaf-400 rounded-pill flex items-center justify-end px-0.5">
  <div class="w-4 h-4 bg-white rounded-full"></div>
</div>

<!-- Off state -->
<div class="w-10 h-5 bg-bark-300 rounded-pill flex items-center justify-start px-0.5">
  <div class="w-4 h-4 bg-white rounded-full"></div>
</div>
```

---

## 7. Typography scale

| Role | Classes |
|------|---------|
| App logo / wordmark | `font-display text-xl font-semibold text-eucalyptus-400` |
| Page title | `font-display text-2xl text-bark-700` |
| Section heading | `font-display text-lg text-bark-700` |
| Balance (large) | `font-display text-4xl text-bark-700` |
| Balance (kid view) | `font-display text-5xl text-wattle-300` |
| Card label (caps) | `font-body text-xs font-semibold text-bark-400 uppercase tracking-widest` |
| Body text | `font-body text-sm text-bark-600 leading-relaxed` |
| Secondary / caption | `font-body text-xs text-bark-500` |
| Button text | `font-body text-sm font-semibold` |
| Input text | `font-body text-sm text-bark-700` |

---

## 8. Key component patterns

### Kid avatar pill
```html
<div class="flex items-center gap-2 px-3 py-1.5 bg-eucalyptus-50 rounded-pill border border-eucalyptus-200">
  <div class="w-5 h-5 rounded-full bg-eucalyptus-400 flex items-center justify-center text-white text-xs font-semibold">OJ</div>
  <span class="text-eucalyptus-600 text-sm font-medium">Olivia</span>
</div>
```

### Approve / decline button pair
```html
<button class="w-7 h-7 rounded-full bg-gumleaf-100 text-gumleaf-500 flex items-center justify-center hover:bg-gumleaf-200">✓</button>
<button class="w-7 h-7 rounded-full bg-bark-100 text-bark-500 flex items-center justify-center hover:bg-bark-200 ml-1">✕</button>
```

### Goal progress bar
```html
<div class="w-full h-1.5 bg-bark-200 rounded-full overflow-hidden">
  <div class="h-full bg-wattle-400 rounded-full" style="width: 84%"></div>
</div>
```

### Pending section header
```html
<div class="px-3 py-2 bg-wattle-50 border-b border-wattle-200">
  <span class="text-xs font-semibold text-wattle-600 uppercase tracking-wide">2 pending approval</span>
</div>
```

---

## 9. What to avoid

- **Never** use `eucalyptus` for earn/positive states — that's always `gumleaf`
- **Never** use `wattle` for anything except goals, balances, and reward amounts
- **Never** use `redearth` for anything except spend and decline
- **Never** use coloured backgrounds on the main page — keep it `bark-100` or `white`
- **Never** use the kid view dark theme outside the child-facing screens
- **Avoid** mixing `bark` neutrals with pure grays (`gray-*`) — keep everything warm
- **Avoid** `font-display` for body copy — Fraunces is for numbers, headings, and the logo only

---

## 10. Google Fonts import

Add to your global CSS or `_document.tsx`:

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap" rel="stylesheet">
```

---

*Quiddo design system — Eucalyptus palette — March 2026*
