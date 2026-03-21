import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: { '2xl': '1400px' },
        },
        extend: {
            fontFamily: {
                sans:    ['"DM Sans"', 'Figtree', ...defaultTheme.fontFamily.sans],
                serif:   ['"Fraunces"', ...defaultTheme.fontFamily.serif],
                display: ['"Fraunces"', 'Georgia', 'serif'],   // headings, logo, balance amounts
                body:    ['"DM Sans"', 'system-ui', 'sans-serif'], // all UI text
            },
            colors: {

                // ── QUIDDO EUCALYPTUS PALETTE ──────────────────────────────────
                // Primary brand colour — CTAs, nav logo, key UI accents
                eucalyptus: {
                    50:  '#EDF5F0',
                    100: '#D0E8D8',
                    200: '#A8D4B8',
                    300: '#75B98C',
                    400: '#4A7C59',   // primary brand (buttons, links, active states)
                    500: '#3A6347',
                    600: '#2A4A34',   // dark variant (hover states, footer bg)
                    700: '#1C3324',
                    800: '#0F1F15',
                    900: '#060E09',
                },

                // Warm neutral — page backgrounds, card surfaces, inputs
                bark: {
                    50:  '#FDFBF7',   // lightest page bg
                    100: '#F5F0E8',   // standard page / app bg
                    200: '#EBE4D6',   // card borders, input borders
                    300: '#D8CEBC',   // dividers
                    400: '#B8A98E',   // placeholder text
                    500: '#8C7A60',   // secondary text
                    600: '#5E5040',   // body text
                    700: '#3A3028',   // headings
                    800: '#1E1810',
                    900: '#0A0804',
                },

                // Reward / earning accent — goals, balances, savings progress
                wattle: {
                    50:  '#FEF8EC',
                    100: '#FDECC8',
                    200: '#FAD98A',
                    300: '#F7C14A',
                    400: '#E8A030',   // primary wattle (goal bars, balance amounts, badges)
                    500: '#C07818',
                    600: '#8A5208',   // dark wattle (text on wattle-50 bg)
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
                    400: '#C8483C',   // primary (spend rows, decline buttons)
                    500: '#A03028',
                    600: '#78201A',   // dark (text on redearth-50)
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
                    400: '#2A9E5C',   // primary (earn rows, approve buttons, chore complete)
                    500: '#1E7A44',
                    600: '#145830',   // dark (text on gumleaf-50)
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
                    600: '#0F2538',   // kid view card bg
                    700: '#081828',   // kid view main bg
                    800: '#040E18',
                    900: '#010508',
                },

                // ── SEMANTIC ALIASES (mapped to new palette) ──────────────────
                brand: {
                    DEFAULT:  '#4A7C59', // eucalyptus-400
                    emphasis: '#3A6347', // eucalyptus-500
                    subtle:   '#EDF5F0', // eucalyptus-50
                    inverse:  '#F7C14A', // wattle-300 (brand on dark surfaces)
                },
                heading:  '#3A3028', // bark-700
                surface: {
                    DEFAULT: '#ffffff',
                    muted:   '#FDFBF7', // bark-50
                    alt:     '#F5F0E8', // bark-100
                    border:  '#EBE4D6', // bark-200
                    dark:    '#2A4A34', // eucalyptus-600 (featured pricing card)
                },
                copy: {
                    secondary: '#8C7A60', // bark-500
                },
                highlight: {
                    DEFAULT: '#E8A030', // wattle-400
                    subtle:  '#FEF8EC', // wattle-50
                },
                negative: '#C8483C', // redearth-400

                // ── SHADCN / RADIX UI TOKENS ───────────────────────────────────
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },
            borderRadius: {
                lg:    'var(--radius)',
                md:    'calc(var(--radius) - 2px)',
                sm:    'calc(var(--radius) - 4px)',
                pill:  '99px',  // buttons, badges, tags
                card:  '12px',  // cards, modals, panels
                input: '8px',   // form inputs, small chips
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },

    plugins: [forms, animate],
};
