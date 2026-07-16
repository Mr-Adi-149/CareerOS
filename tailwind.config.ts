import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        saffron: {
          50: '#fff9ed', 100: '#fff1d4', 200: '#ffe0a9', 300: '#ffc971',
          400: '#ffaa33', 500: '#ff900c', 600: '#f07406', 700: '#c75807',
          800: '#9e440e', 900: '#7f390f', 950: '#451a05'
        },
        indiaGreen: {
          50: '#f2fcf3', 100: '#e1f8e4', 200: '#c3efca', 300: '#93e0a1',
          400: '#5bc971', 500: '#35ad4f', 600: '#238e3a', 700: '#1d7131',
          800: '#1a5929', 900: '#154a24', 950: '#0b2812'
        },
        navy: {
          50: '#f4f6f8', 100: '#e4e8f0', 200: '#c9d3e1', 300: '#a1b3cb',
          400: '#728db1', 500: '#506f96', 600: '#3e577c', 700: '#334665',
          800: '#2c3b54', 900: '#273347', 950: '#0b132b'
        },
        ivory: {
          50: '#ffffff', 100: '#fdfbf7', 200: '#f8f5ee', 300: '#f4efe4',
          400: '#e5c48b', 500: '#dcb069', 600: '#d1984c', 700: '#ae7839',
          800: '#8c6033', 900: '#714e2c', 950: '#3d2914'
        },
        ink: '#0b132b',
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(11, 19, 43, 0.05), 0 0 3px rgba(11, 19, 43, 0.02)',
        'premium-hover': '0 12px 30px -4px rgba(11, 19, 43, 0.08), 0 0 4px rgba(11, 19, 43, 0.03)',
        'glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6), 0 4px 16px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'chakra-spin': 'chakra-spin 3.6s linear infinite',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        }
        ,
        'chakra-spin': {
          '100%': { transform: 'rotate(360deg)' },
        },
      }
    }
  },
  plugins: [],
};
export default config;
