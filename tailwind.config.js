/** Harbor design tokens. Every colour, font and size used in the app lives here. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        canvas: '#F3F5F9',        // page background
        surface: '#FFFFFF',       // cards, panels
        subtle: '#F7F9FC',        // table header, footers
        ink: '#0F1B2D',           // primary text
        muted: '#5A6577',         // secondary text (5.8:1 on white)
        line: { DEFAULT: '#E2E7EF', strong: '#C9D2E0', soft: '#EDF0F5' },
        brand: { 50: '#F0F4FF', 100: '#E8EEFC', 600: '#1D4ED8', 700: '#1E40AF', 800: '#1E3A8A' },
        success: { 50: '#E3F4EA', 700: '#17633A' },
        warning: { 50: '#FFF1D6', 100: '#FFF4E0', 300: '#E8B867', 700: '#8A5300' },
        danger: { 50: '#FDE4E2', 200: '#F3C4C0', 700: '#A3261B' },
        violet: { 50: '#F3F0FC', 200: '#C9BDF0', 600: '#5B3CC4', 700: '#4A2FA8' },
      },
      fontFamily: {
        // Set at runtime by Settings → My Account (see src/theme/fonts.js); defaults live in index.css
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        md: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['26px', '32px'],
        '3xl': ['28px', '34px'],
        '4xl': ['36px', '44px'],
      },
      borderRadius: { sm: '6px', DEFAULT: '8px', md: '10px', lg: '12px', xl: '14px' },
      boxShadow: {
        card: '0 1px 2px rgba(15,27,45,0.06)',
        pop: '0 20px 50px rgba(15,27,45,0.25)',
        drawer: '-12px 0 40px rgba(15,27,45,0.2)',
      },
    },
  },
  plugins: [],
};
