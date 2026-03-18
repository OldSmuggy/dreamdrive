/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f7f0',
          100: '#dceddc',
          200: '#b9dab9',
          300: '#8cc08c',
          400: '#5fa05f',
          500: '#3d823d',
          600: '#2d682d',
          700: '#245224',
          800: '#1d421d',
          900: '#163516',
          950: '#0a1f0a',
        },
        sand: {
          50:  '#faf8f3',
          100: '#f3ede0',
          200: '#e8d9bc',
          300: '#d9c090',
          400: '#caa668',
          500: '#be8f4a',
          600: '#a8773c',
          700: '#8b5f31',
          800: '#704d2b',
          900: '#5c4026',
        },
        slate: {
          950: '#0a0e13',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'slide-up':  'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        pulseDot: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(0.8)' } },
        slideUp:  { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
