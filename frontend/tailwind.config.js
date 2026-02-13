/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
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
