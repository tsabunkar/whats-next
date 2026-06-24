/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0A0A1A',
        nebula: '#1A1A3E',
        'cosmic-gold': '#F5C518',
        'astral-teal': '#00D4AA',
        stardust: '#A0A8C0',
        pure: '#FFFFFF',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Crimson Text', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 197, 24, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(245, 197, 24, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
