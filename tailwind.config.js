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
                sans:  ['"DM Sans"', 'Figtree', ...defaultTheme.fontFamily.sans],
                serif: ['"Fraunces"', ...defaultTheme.fontFamily.serif],
            },
            colors: {
                // Semantic design tokens — use these in components, not palette names
                brand: {
                    DEFAULT:  'var(--color-amber-glow-500)', // primary CTAs, active states
                    emphasis: 'var(--color-amber-glow-600)', // hover/pressed
                    subtle:   'var(--color-amber-glow-50)',  // light tint, badge backgrounds
                    inverse:  'var(--color-amber-glow-300)', // brand on dark surfaces
                },
                heading:  'var(--color-forest-ink-900)',     // headings and primary text
                surface: {
                    DEFAULT: '#ffffff',                              // card and panel backgrounds
                    muted:   'var(--color-warm-cream-50)',          // section backgrounds
                    alt:     'var(--color-warm-cream-100)',         // secondary surfaces
                    border:  'var(--color-warm-cream-200)',         // card borders
                    dark:    'var(--color-forest-ink-900)',         // dark section backgrounds
                },
                copy: {
                    secondary: 'var(--color-warm-cream-700)',       // muted body text
                },
                highlight: {
                    DEFAULT: 'var(--color-marigold-500)',           // energetic accent (step numbers)
                    subtle:  'var(--color-marigold-50)',            // light accent tint
                },
                negative: 'var(--color-fired-clay-500)',            // negative indicators (✗ icons)

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
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
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
