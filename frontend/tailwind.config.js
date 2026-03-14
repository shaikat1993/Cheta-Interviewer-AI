/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          bg:      '#07090e',
          base:    '#0d1117',
          card:    '#111827',
          border:  'rgba(255,255,255,0.07)',
          muted:   '#6b7280',
          text:    '#f1f5f9',
        },
        teal: {
          DEFAULT: '#14b8a6',
          hover:   '#0d9488',
          soft:    'rgba(20,184,166,0.15)',
          glow:    'rgba(20,184,166,0.4)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          hover:   '#d97706',
          soft:    'rgba(245,158,11,0.15)',
          glow:    'rgba(245,158,11,0.4)',
        },
        rose: {
          soft:    'rgba(244,63,94,0.15)',
          glow:    'rgba(244,63,94,0.4)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-out forwards',
        'fade-in-up':  'fadeInUp 0.5s ease-out forwards',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'teal-sm':  '0 0 20px rgba(20,184,166,0.25)',
        'teal-md':  '0 0 40px rgba(20,184,166,0.35)',
        'amber-sm': '0 0 20px rgba(245,158,11,0.25)',
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-teal':       'radial-gradient(ellipse at 20% 50%, rgba(20,184,166,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.08) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};
