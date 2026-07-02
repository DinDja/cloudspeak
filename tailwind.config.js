/** @type {import('tailwindcss').Config} */
import { COLORS } from './src/lib/colors.js'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: COLORS.brand,
        ocean: COLORS.ocean,
        gold: COLORS.gold,
        violet: COLORS.violet,
        sunset: COLORS.sunset,
        coral: COLORS.coral,
        canvas: 'var(--cs-canvas)',
      },
      borderRadius: {
        // Usando valores padrão do Tailwind. Raios grandes removidos para um visual mais nítido.
      },
      boxShadow: {
        'neo-base': '4px 4px 0px #475569',
        'neo-button': '2px 2px 0px #475569',
        'neo-button-active': '1px 1px 0px #475569',
        'neo-base-dark': '4px 4px 0px #CBD5E1',
        'neo-button-dark': '2px 2px 0px #CBD5E1',
        'neo-button-active-dark': '1px 1px 0px #CBD5E1',
        'premium': '0 4px 24px -4px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        'elevated': '0 8px 32px -8px rgba(15, 23, 42, 0.12), 0 2px 8px -2px rgba(15, 23, 42, 0.06)',
        'soft': '0 2px 8px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.02)',
        'float': '0 12px 40px -8px rgba(37, 82, 240, 0.15), 0 4px 16px -4px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2552F0 0%, #7C3AED 100%)',
        'ocean-gradient': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'violet-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        'coral-gradient': 'linear-gradient(135deg, #FA5252 0%, #E03131 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        'premium-gradient': 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        'dot-grid':
          'radial-gradient(circle, rgba(15, 23, 42, 0.18) 1px, transparent 1.5px)',
        'dot-grid-dark':
          'radial-gradient(circle, rgba(255, 255, 255, 0.16) 1px, transparent 1.5px)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'bar-grow': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-gentle': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'glow-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.45)' },
          '50%': { boxShadow: '0 0 0 14px rgba(16, 185, 129, 0)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'slide-up': 'slide-up 0.5s ease-out both',
        'slide-down': 'slide-down 0.4s ease-out both',
        'scale-in': 'scale-in 0.35s ease-out both',
        'float-up': 'float-up 4.2s ease-out forwards',
        'ping-soft': 'ping-soft 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'bar-grow': 'bar-grow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'count-up': 'count-up 0.4s ease-out both',
        'float-gentle': 'float-gentle 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-out infinite',
        'marquee': 'marquee 28s linear infinite',
      },
      letterSpacing: {
        'premium': '-0.025em',
      },
    },
  },
  plugins: [],
}
