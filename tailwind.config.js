/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        forest: {
          800: '#0f3823',
          900: '#0a2919',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(16, 185, 129, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 8px 24px -4px rgba(16, 185, 129, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 16px 36px -6px rgba(16, 185, 129, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 25px -5px rgba(34, 197, 94, 0.4)',
      },
    },
  },
  plugins: [],
}
