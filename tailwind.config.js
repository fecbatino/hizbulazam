/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["'Amiri'", 'serif'],
        display: ["'Playfair Display'", 'serif'],
        sans: ["'DM Sans'", 'system-ui', 'sans-serif'],
      },
      colors: {
        hza: {
          green: '#1B4332',
          gold: '#D4A843',
          bg: '#F7F5F0',
          card: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};
