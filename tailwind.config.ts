import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        'primary-dark': '#4338ca',
        surface: '#111827',
        'surface-2': '#1f2937',
        border: '#334155',
        text: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Comfortaa', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
