/** @type {import('tailwindcss').Config} */
import { COLORS } from './src/lib/colors.js'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: COLORS.brand,
        ocean: COLORS.ocean,
        gold: COLORS.gold,
        canvas: 'var(--cs-canvas)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(15, 23, 42, 0.08), 0 4px 16px -4px rgba(15, 23, 42, 0.06)',
        card: '0 4px 24px -8px rgba(15, 23, 42, 0.12), 0 2px 8px -2px rgba(15, 23, 42, 0.06)',
        float: '0 18px 50px -12px rgba(11, 95, 174, 0.22), 0 8px 24px -8px rgba(15, 23, 42, 0.12)',
        glow: '0 0 24px -4px rgba(18, 181, 165, 0.45)',
      },
      backgroundImage: {
        'grid-soft':
          'linear-gradient(to right, rgba(11,95,174,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,95,174,0.06) 1px, transparent 1px)',
        'brand-gradient': 'linear-gradient(135deg, #0B5FAE 0%, #073A6B 100%)',
        'ocean-gradient': 'linear-gradient(135deg, #12B5A5 0%, #0B7268 100%)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float-up': {
          '0%': { transform: 'translateY(100px) scale(0.5)', opacity: '0' },
          '12%': { opacity: '1', transform: 'translateY(40px) scale(1.2)' },
          '38%': { transform: 'translateY(-220px) scale(1) rotate(6deg)' },
          '62%': { transform: 'translateY(-460px) scale(1.1) rotate(-6deg)' },
          '80%': { transform: 'translateY(-620px) scale(1.2) rotate(10deg)', opacity: '1' },
          '88%': { transform: 'translateY(-760px) scale(1.1) rotate(14deg)', opacity: '1' },
          '93%': { transform: 'translateY(-780px) scale(1.9) rotate(16deg)', opacity: '1' },
          '100%': { transform: 'translateY(-790px) scale(0.08) rotate(16deg)', opacity: '0' },
        },
        'pop-burst': {
          '0%,88%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.3)' },
          '92%': { opacity: '0.95', transform: 'translate(-50%, -50%) scale(1.15)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(1.85)' },
        },
        'pop-spark': {
          '0%,89%': { opacity: '0', transform: 'translate(0, 0) scale(0.2)' },
          '93%': { opacity: '1', transform: 'var(--spark-end) scale(1)' },
          '100%': { opacity: '0', transform: 'var(--spark-fade) scale(0.2)' },
        },
        'ping-soft': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '75%,100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'slide-up': 'slide-up 0.5s ease-out both',
        'slide-down': 'slide-down 0.4s ease-out both',
        'scale-in': 'scale-in 0.35s ease-out both',
        'float-up': 'float-up 4.2s ease-out forwards',
        'ping-soft': 'ping-soft 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}
