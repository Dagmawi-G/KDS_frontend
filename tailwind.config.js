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
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        kds: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          new: '#ef4444',
          prep: '#f59e0b',
          ready: '#10b981',
          served: '#64748b',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 1s ease-in-out 3',
        'flash-glow': 'flashGlow 1.5s infinite',
      },
      keyframes: {
        flashGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(239, 68, 68, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
