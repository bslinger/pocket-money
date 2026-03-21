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
                'dark-amaranth': {
                    50:  '#fde7ee',
                    100: '#fbd0dd',
                    200: '#f7a1bb',
                    300: '#f47198',
                    400: '#f04276',
                    500: '#ec1354',
                    600: '#bd0f43',
                    700: '#8e0b32',
                    800: '#5e0822',
                    900: '#2f0411',
                    950: '#21030c',
                },
                'baltic-blue': {
                    50:  '#ecf3f8',
                    100: '#dae7f1',
                    200: '#b5cfe3',
                    300: '#8fb7d6',
                    400: '#6a9fc8',
                    500: '#4587ba',
                    600: '#376c95',
                    700: '#295170',
                    800: '#1c364a',
                    900: '#0e1b25',
                    950: '#0a131a',
                },
                'charcoal-blue': {
                    50:  '#eef3f6',
                    100: '#dee7ed',
                    200: '#bdd0db',
                    300: '#9cb8c9',
                    400: '#7aa0b8',
                    500: '#5988a6',
                    600: '#476d85',
                    700: '#365263',
                    800: '#243742',
                    900: '#121b21',
                    950: '#0c1317',
                },
                'blazing-flame': {
                    50:  '#ffece5',
                    100: '#ffd9cc',
                    200: '#ffb399',
                    300: '#ff8c66',
                    400: '#ff6633',
                    500: '#ff4000',
                    600: '#cc3300',
                    700: '#992600',
                    800: '#661a00',
                    900: '#330d00',
                    950: '#240900',
                },
                'soft-linen': {
                    50:  '#f3f4f1',
                    100: '#e7e8e3',
                    200: '#ced2c6',
                    300: '#b6bbaa',
                    400: '#9ea48e',
                    500: '#868e71',
                    600: '#6b715b',
                    700: '#505544',
                    800: '#35392d',
                    900: '#1b1c17',
                    950: '#131410',
                },
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
