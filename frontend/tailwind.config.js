/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        countUp: 'countUp 0.6s ease-out',
        glow: 'glow 2s ease-in-out infinite',
        slideUp: 'slideUp 0.3s ease-out',
      },
      colors: {
        // Dark mode color palette
        dark: {
          bg: '#0a0a0f',
          'bg-elevated': '#12121a',
          'bg-card': 'rgba(255, 255, 255, 0.05)',
          'border': 'rgba(255, 255, 255, 0.1)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          text: '#ffffff',
          'text-secondary': '#9ca3af',
          'text-muted': '#6b7280',
        },
        // Political
        dem: { light: '#dbeafe', DEFAULT: '#3b82f6', dark: '#1e40af' },
        rep: { light: '#fee2e2', DEFAULT: '#ef4444', dark: '#991b1b' },
        // Alignment colors
        aligned: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#065f46',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#92400e',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#991b1b',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
