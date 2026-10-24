/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        powerbi: {
          yellow: '#f2c811',
          dark: '#111827',
          gold: '#d9a900',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
      }
    },
  },
  plugins: [],
}
