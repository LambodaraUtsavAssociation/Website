import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#070709',
          900: '#0c0c0f',
          850: '#121217',
          800: '#181820',
          700: '#23232e',
          600: '#323242',
        },
        ivory: {
          50: '#fdfbf7',
          100: '#faf7f0',
          200: '#f4ede0',
          300: '#e7dabf',
          400: '#d5c098',
          500: '#bfa06f',
        },
        saffron: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
        },
        maroon: {
          900: '#300a12',
          800: '#4a111c',
          700: '#671827',
          600: '#862133',
        },
        gold: {
          400: '#fbbf24',
          500: '#d4af37',
          600: '#b89326',
          700: '#94731a',
        }
      },
      fontFamily: {
        serif: ['var(--font-cinzel)', 'Georgia', 'serif'],
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-saffron': '0 0 25px -5px rgba(224, 122, 95, 0.25)',
        'glow-gold': '0 0 30px -5px rgba(212, 175, 55, 0.2)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'subtle-pulse': 'subtlePulse 4s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
