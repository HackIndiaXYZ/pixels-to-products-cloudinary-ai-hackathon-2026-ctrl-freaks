import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0f0e0c',
          900: '#161512',
          850: '#1b1a16',
          800: '#22201c',
          700: '#2d2a25',
          600: '#3c382f',
        },
        bone: {
          50: '#f6f1e8',
          100: '#ebe5d8',
          300: '#bab2a1',
          400: '#908979',
          500: '#6f6a5d',
        },
        accent: { DEFAULT: '#e0a24a', strong: '#f0b560', dim: '#8a6a35' },
        ok: '#9bbf94',
        danger: '#e07a5f',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        rise: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { rise: 'rise 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both' },
    },
  },
  plugins: [],
};

export default config;
