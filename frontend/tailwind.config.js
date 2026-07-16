/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Saint Mary's University brand palette — Marian blue & white, with
        // a gold accent (the halo/rose gold of the university emblem).
        // Every pairing below is WCAG 2.1 contrast-checked; see README notes.
        ink: '#16233B',
        cloud: '#F4F7FB',
        card: '#FFFFFF',
        navy: { DEFAULT: '#0F3D73', deep: '#0A2C54', light: '#E7EEF8' },
        gold: { DEFAULT: '#C9A227', soft: '#F5E9C8', dark: '#6B540F' },
        rose: { DEFAULT: '#7A1F3D', soft: '#F6DEE6' },
        line: '#C7D2E3',
        field: '#64789E',
        muted: '#4E5F7D',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Public Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 61, 115, 0.06), 0 1px 3px rgba(15, 61, 115, 0.08)',
        raised: '0 4px 12px rgba(10, 44, 84, 0.12)',
        focus: '0 0 0 3px rgba(201, 162, 39, 0.45)',
      },
    },
  },
  plugins: [],
}
