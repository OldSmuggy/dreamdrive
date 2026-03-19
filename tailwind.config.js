/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: '#3D6B73',
          light:   '#4d7d85',
          dark:    '#2d5158',
        },
        driftwood: {
          DEFAULT: '#8B7355',
        },
        sand: {
          DEFAULT: '#E8CFA0',
          light:   '#f0dbb5',
        },
        dirt: {
          DEFAULT: '#B5573A',
          light:   '#c46a4f',
          dark:    '#9a4830',
        },
        cream: {
          DEFAULT: '#F5F3ED',
        },
        charcoal: {
          DEFAULT: '#2C2C2A',
          light:   '#3a3a38',
        },
        slate: {
          950: '#0a0e13',
        }
      },
      fontFamily: {
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
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
