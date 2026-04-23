/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ember: {
          50: '#fdf7ef',
          100: '#f5e6d1',
          200: '#e7c89a',
          300: '#d4a85f',
          400: '#c8903b',
          500: '#a86d27',
          600: '#7c4e20',
          700: '#5d3918',
          800: '#3b2412',
          900: '#1f140c',
        },
        burgundy: {
          50: '#fbf3f5',
          100: '#f2d9df',
          200: '#e1afb9',
          300: '#c87586',
          400: '#a94b62',
          500: '#8b3148',
          600: '#6d2337',
          700: '#541b2a',
          800: '#341118',
          900: '#1b080d',
        },
        midnight: {
          50: '#f6f2ee',
          100: '#ddd6d0',
          200: '#baa9a0',
          300: '#8b776d',
          400: '#62534d',
          500: '#403633',
          600: '#2b2322',
          700: '#1d1717',
          800: '#131011',
          900: '#0a090a',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 24px 60px rgba(5, 4, 4, 0.45)',
        halo: '0 0 0 1px rgba(241, 225, 196, 0.12), 0 18px 40px rgba(123, 36, 58, 0.28)',
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 20% 20%, rgba(214,168,95,0.08), transparent 35%), radial-gradient(circle at 80% 10%, rgba(139,49,72,0.14), transparent 28%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.06), transparent 26%)",
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -14px, 0) scale(1.03)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.65', filter: 'blur(24px)' },
          '50%': { opacity: '1', filter: 'blur(34px)' },
        },
      },
      animation: {
        drift: 'drift 12s ease-in-out infinite',
        glow: 'glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
