/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#01696f',
          hover:   '#0c4e54',
          active:  '#0f3638',
          light:   '#cedcd8',
        },
        surface: {
          bg:      '#f7f6f2',
          DEFAULT: '#f9f8f5',
          2:       '#fbfbf9',
          offset:  '#f3f0ec',
          offset2: '#edeae5',
          dynamic: '#e6e4df',
          divider: '#dcd9d5',
          border:  '#d4d1ca',
        },
        dark: {
          bg:      '#171614',
          surface: '#1c1b19',
          surface2:'#201f1d',
          offset:  '#1d1c1a',
          offset2: '#22211f',
          dynamic: '#2d2c2a',
          divider: '#262523',
          border:  '#393836',
        },
        ink: {
          DEFAULT: '#28251d',
          muted:   '#7a7974',
          faint:   '#bab9b4',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(40,37,29,0.06)',
        md: '0 4px 12px rgba(40,37,29,0.08)',
        lg: '0 12px 32px rgba(40,37,29,0.12)',
        'card': '0 1px 3px rgba(40,37,29,0.06), 0 4px 16px rgba(40,37,29,0.04)',
        'card-hover': '0 2px 6px rgba(40,37,29,0.08), 0 8px 24px rgba(40,37,29,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}