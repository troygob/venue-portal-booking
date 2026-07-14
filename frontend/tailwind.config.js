/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1C1A',
        ledger: '#F2F4EE',
        card: '#FFFFFF',
        forest: { DEFAULT: '#1F4D3A', deep: '#153629' },
        brass: { DEFAULT: '#C9A227', soft: '#F1E3B4', dark: '#8A6D14' },
        clay: { DEFAULT: '#B3423A', soft: '#F5DEDB' },
        line: '#DBDED2',
        muted: '#6B7268',
      },
      fontFamily: {
        display: ['"Zilla Slab"', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
