/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          light: '#F3E8FF',
          dark: '#4C1D95',
          muted: '#A78BFA',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          secondary: '#171717',
        },
        muted: '#737373',
        surface: {
          DEFAULT: '#FAFAFA',
          elevated: '#FFFFFF',
        },
        border: '#E5E5E5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
