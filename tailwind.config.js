/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: { DEFAULT: 'var(--background)' },
        foreground: { DEFAULT: 'var(--foreground)' },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          dark: 'var(--primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: { DEFAULT: 'var(--border)' },
        input: { DEFAULT: 'var(--input)' },
        ring: { DEFAULT: 'var(--ring)' },
        danger: { DEFAULT: 'var(--danger)' },
        warning: { DEFAULT: 'var(--warning)' },
        'bubble-out': { DEFAULT: 'var(--bubble-out)' },
        'bubble-in': { DEFAULT: 'var(--bubble-in)' },
        'sidebar-bg': { DEFAULT: 'var(--sidebar-bg)' },
        'chat-bg': { DEFAULT: 'var(--chat-bg)' },
        'topbar-bg': { DEFAULT: 'var(--topbar-bg)' },
        'input-bg': { DEFAULT: 'var(--input-bg)' },
        'hover-bg': { DEFAULT: 'var(--hover-bg)' },
        'active-bg': { DEFAULT: 'var(--active-bg)' },
        'online-green': { DEFAULT: 'var(--online-green)' },
        'tick-gray': { DEFAULT: 'var(--tick-gray)' },
        'tick-blue': { DEFAULT: 'var(--tick-blue)' },
        'unread-badge': { DEFAULT: 'var(--unread-badge)' },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 4px)',
        lg: 'calc(var(--radius) + 4px)',
        xl: 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      animation: {
        'typing': 'typing-bounce 1.4s infinite ease-in-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'message-in': 'message-slide-in 0.15s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};