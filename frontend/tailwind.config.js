/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ai: {
          // Dark background shades
          bg: '#050716',
          bgDeep: '#07071a',
          surface: 'rgba(255,255,255,0.03)',
          surfaceHover: 'rgba(255,255,255,0.06)',

          // Neon accents
          primary: '#7C5CFF', // Neon Indigo
          primaryLight: '#9a7cff',
          cyan: '#00F5A0', // Neon Cyan
          cyanLight: '#5affc6',

          // Muted text
          muted: '#94a3b8',
          text: '#f8fafc',
        },

        // Legacy primary (keep compatibility)
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        'glass-sm': '0 4px 12px rgba(2,6,23,0.6)',
        'glass-md': '0 8px 30px rgba(2,6,23,0.6)',
        'neon-sm': '0 6px 24px rgba(124,92,255,0.12)',
        'neon-lg': '0 12px 48px rgba(124,92,255,0.18), 0 6px 24px rgba(0,245,160,0.06)'
      },
      borderRadius: {
        'lg-2': '1rem',
        'xl-2': '1.5rem',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        neon: {
          '0%': { boxShadow: '0 0 8px rgba(124,92,255,0.12)' },
          '50%': { boxShadow: '0 0 18px rgba(124,92,255,0.22)' },
          '100%': { boxShadow: '0 0 8px rgba(124,92,255,0.12)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'neon-pulse': 'neon 2.8s ease-in-out infinite',
      },
      backgroundImage: {
        'ai-radial': 'radial-gradient(ellipse at center, rgba(124,92,255,0.06) 0%, rgba(0,245,160,0.03) 40%, transparent 60%)'
      }
    },
  },
  plugins: [],
};
