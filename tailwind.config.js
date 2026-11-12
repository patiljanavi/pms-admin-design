/**
 * Harbor design tokens (shadcn/ui compatible).
 *
 * Every colour is a CSS variable defined in src/index.css (light + dark), written as
 * HSL channels so Tailwind opacity modifiers work: bg-primary/10, ring-ring/30 …
 *
 *  - shadcn tokens:   background, foreground, card, popover, primary, secondary, muted,
 *                     accent, destructive, border, input, ring, sidebar-*, chart-1..5
 *  - Harbor aliases:  canvas, surface, subtle, ink, line, brand-*, success-*, warning-*,
 *                     danger-*, violet-*  (kept so existing screens follow the theme)
 */
const v = (name) => `hsl(var(--${name}) / <alpha-value>)`;
const scale = (name, steps) => Object.fromEntries(steps.map((s) => [s, v(`${name}-${s}`)]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        /* ---------- shadcn/ui ---------- */
        border: v('border'),
        input: v('input'),
        ring: v('ring'),
        background: v('background'),
        foreground: v('foreground'),
        primary: { DEFAULT: v('primary'), foreground: v('primary-foreground') },
        secondary: { DEFAULT: v('secondary'), foreground: v('secondary-foreground') },
        destructive: { DEFAULT: v('destructive'), foreground: v('destructive-foreground') },
        muted: { DEFAULT: v('muted'), foreground: v('muted-foreground') },
        accent: { DEFAULT: v('accent'), foreground: v('accent-foreground') },
        popover: { DEFAULT: v('popover'), foreground: v('popover-foreground') },
        card: { DEFAULT: v('card'), foreground: v('card-foreground') },
        sidebar: {
          DEFAULT: v('sidebar'), foreground: v('sidebar-foreground'), muted: v('sidebar-muted'),
          accent: v('sidebar-accent'), 'accent-foreground': v('sidebar-accent-foreground'), border: v('sidebar-border'),
        },
        chart: { 1: v('chart-1'), 2: v('chart-2'), 3: v('chart-3'), 4: v('chart-4'), 5: v('chart-5') },
        inverse: { DEFAULT: v('inverse'), foreground: v('inverse-foreground') },

        /* ---------- Harbor aliases (theme-aware) ---------- */
        canvas: v('canvas'),
        surface: v('card'),
        subtle: v('subtle'),
        ink: v('foreground'),
        line: { DEFAULT: v('border'), strong: v('line-strong'), soft: v('line-soft') },
        brand: scale('brand', [50, 100, 200, 500, 600, 700, 800]),
        success: scale('success', [50, 100, 500, 600, 700]),
        warning: scale('warning', [50, 100, 300, 500, 700]),
        danger: scale('danger', [50, 100, 200, 500, 600, 700]),
        violet: scale('violet', [50, 200, 600, 700]),
      },
      fontFamily: {
        // Set at runtime by Settings → My Account (see AppearanceContext); defaults live in index.css
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        '2xs': ['11px', '14px'],
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        md: ['15px', '22px'],
        lg: ['17px', '24px'],
        xl: ['19px', '26px'],
        '2xl': ['22px', '28px'],
        '3xl': ['24px', '30px'],
        '4xl': ['32px', '40px'],
        '5xl': ['40px', '48px'],
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        DEFAULT: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.03)',
        raised: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 4px 12px -2px rgb(15 23 42 / 0.06)',
        pop: '0 10px 38px -10px rgb(15 23 42 / 0.25), 0 10px 20px -15px rgb(15 23 42 / 0.2)',
        drawer: '-16px 0 48px -12px rgb(15 23 42 / 0.22)',
        'inset-top': 'inset 0 1px 0 0 rgb(255 255 255 / 0.12)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'collapsible-down': { from: { height: '0' }, to: { height: 'var(--radix-collapsible-content-height)' } },
        'collapsible-up': { from: { height: 'var(--radix-collapsible-content-height)' }, to: { height: '0' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } }, // 'none' so .page never becomes a containing block for position:fixed children
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
        'fade-up': 'fade-up 0.25s ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
