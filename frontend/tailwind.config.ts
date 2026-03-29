import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './lib/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      // ── Fonts ────────────────────────────────────────────────
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:  ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },

      // ── Colors ───────────────────────────────────────────────
      colors: {
        // Primary brand red
        red: {
          DEFAULT: '#C41E3A',
          deep:    '#8B0000',
          light:   '#fdf0f2',
          mid:     '#e8c0c8',
        },
        // Ink/text scale
        ink: {
          DEFAULT: '#1a1a18',
          muted:   '#5a5a55',
          faint:   '#aaa9a3',
        },
        // Backgrounds
        'off-white': '#FAFAF8',
        border:      '#e8e6e0',
      },

      // ── Letter spacing ────────────────────────────────────────
      letterSpacing: {
        tightest: '-0.03em',
        tighter:  '-0.025em',
        tight:    '-0.02em',
        widest:   '0.18em',
        wider:    '0.12em',
      },

      // ── Border radius ─────────────────────────────────────────
      borderRadius: {
        sm:  '2px',
        md:  '4px',
        lg:  '6px',
        xl:  '8px',
        '2xl': '12px',
      },

      // ── Box shadows ───────────────────────────────────────────
      boxShadow: {
        'red-sm':  '0 4px 18px rgba(196, 30, 58, 0.22)',
        'red-md':  '0 8px 28px rgba(196, 30, 58, 0.30)',
        'red-lg':  '0 12px 40px rgba(196, 30, 58, 0.35)',
        'soft-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'soft-md': '0 8px 40px rgba(0, 0, 0, 0.07)',
        'soft-lg': '0 20px 50px rgba(0, 0, 0, 0.10)',
      },

      // ── Typography sizes ──────────────────────────────────────
      fontSize: {
        'eyebrow': ['0.7rem',  { lineHeight: '1', letterSpacing: '0.18em' }],
        'label':   ['0.65rem', { lineHeight: '1', letterSpacing: '0.14em' }],
        'caption': ['0.72rem', { lineHeight: '1.4' }],
        'body-sm': ['0.82rem', { lineHeight: '1.65' }],
        'body':    ['0.92rem', { lineHeight: '1.7'  }],
        'body-lg': ['1.05rem', { lineHeight: '1.75' }],
      },

      // ── Animations ────────────────────────────────────────────
      keyframes: {
        // Floating stat cards
        float1: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        float2: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(12px)' },
        },
        float3: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-7px)' },
        },
        // Marquee ticker
        ticker: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        // Scroll reveal
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // Loading spinner
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        // Chat bounce dots
        bounce: {
          '0%, 80%, 100%': { transform: 'translateY(0)' },
          '40%':           { transform: 'translateY(-6px)' },
        },
        // Live pulse dot
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        // Add-to-cart button rotate
        'rotate-in': {
          from: { transform: 'rotate(0deg) scale(1)' },
          to:   { transform: 'rotate(90deg) scale(1.1)' },
        },
      },

      animation: {
        'float1': 'float1 5s ease-in-out infinite',
        'float2': 'float2 6s ease-in-out infinite',
        'float3': 'float3 4.5s ease-in-out infinite',
        'ticker': 'ticker 30s linear infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up-delay-1': 'fade-up 0.6s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up-delay-2': 'fade-up 0.6s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up-delay-3': 'fade-up 0.6s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin': 'spin 0.7s linear infinite',
        'bounce-dot-1': 'bounce 1.2s 0s infinite',
        'bounce-dot-2': 'bounce 1.2s 0.2s infinite',
        'bounce-dot-3': 'bounce 1.2s 0.4s infinite',
        'pulse': 'pulse 2s infinite',
      },

      // ── Transitions ───────────────────────────────────────────
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      // ── Spacing extras ────────────────────────────────────────
      spacing: {
        '4vw': '4vw',
        '5vw': '5vw',
      },

      // ── Z-index ───────────────────────────────────────────────
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },

  plugins: [],
};

export default config;