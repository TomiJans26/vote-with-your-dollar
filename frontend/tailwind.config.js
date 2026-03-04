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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(114, 9, 183, 0.4), 0 0 40px rgba(131, 56, 236, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(114, 9, 183, 0.6), 0 0 60px rgba(131, 56, 236, 0.4)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        countUp: 'countUp 0.6s ease-out',
        glow: 'glow 2s ease-in-out infinite',
        slideUp: 'slideUp 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
      },
      colors: {
        // Dark mode color palette - VIBRANT & FUN
        dark: {
          bg: '#0a0a0f',
          'bg-elevated': '#12121a',
          'bg-card': 'rgba(255, 255, 255, 0.05)',
          'border': 'rgba(255, 255, 255, 0.1)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          text: '#ffffff',
          'text-secondary': '#c4b5fd', // Light purple instead of gray
          'text-muted': '#8b5cf6', // Purple accent instead of gray
        },
        // Political - PUNCHIER
        dem: { light: '#dbeafe', DEFAULT: '#3b82f6', dark: '#1e40af' },
        rep: { light: '#fee2e2', DEFAULT: '#ef4444', dark: '#991b1b' },
        // Alignment colors - BRIGHT & DOPAMINE-HITTING
        aligned: {
          DEFAULT: '#00f5d4', // Bright cyan instead of boring emerald
          light: '#d1fae5',
          dark: '#06d6a0',
        },
        warning: {
          DEFAULT: '#ffd166', // Electric yellow
          light: '#fef3c7',
          dark: '#f59e0b',
        },
        danger: {
          DEFAULT: '#ff006e', // Hot coral
          light: '#fee2e2',
          dark: '#ef476f',
        },
        // Accent colors for gradients
        accent: {
          purple: '#7209b7',
          violet: '#8338ec',
          pink: '#d946ef',
          cyan: '#00f5d4',
          lime: '#06d6a0',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
