/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
      colors: {
        dem: { light: '#dbeafe', DEFAULT: '#3b82f6', dark: '#1e40af' },
        rep: { light: '#fee2e2', DEFAULT: '#ef4444', dark: '#991b1b' },
        good: { light: '#d1fae5', DEFAULT: '#10b981', dark: '#065f46' },
        bad: { light: '#fee2e2', DEFAULT: '#f43f5e', dark: '#9f1239' },
      },
    },
  },
  plugins: [],
};
