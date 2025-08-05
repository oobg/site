/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c7c7ff',
          300: '#a5a5ff',
          400: '#8181ff',
          500: '#646cff',
          600: '#535bf2',
          700: '#4a4ae8',
          800: '#3f3fd1',
          900: '#3737a8',
        },
        raven: {
          primary: 'var(--color-raven-primary)',
          secondary: 'var(--color-raven-secondary)',
          accent: 'var(--color-raven-accent)',
          gold: 'var(--color-raven-gold)',
        },
        background: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          card: 'var(--color-bg-card)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          accent: 'var(--color-text-accent)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          glow: 'var(--color-border-glow)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
        },
        glow: {
          DEFAULT: 'var(--color-glow)',
          secondary: 'var(--color-glow-secondary)',
        },
        neon: {
          DEFAULT: 'var(--color-neon)',
          purple: 'var(--color-neon-purple)',
        },
      },
      fontFamily: {
        'apple': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 1s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite alternate',
        'shimmer': 'shimmer 3s infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%': { boxShadow: '0 0 10px rgba(128, 90, 213, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(128, 90, 213, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'apple': '0 20px 40px rgba(0, 0, 0, 0.3)',
        'apple-glow': '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(128, 90, 213, 0.2)',
        'mystical': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(128, 90, 213, 0.3)',
        'glow-lg': '0 0 30px rgba(128, 90, 213, 0.5)',
      },
    },
  },
  plugins: [],
}
