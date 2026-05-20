import type { Config } from 'tailwindcss'

// ---------------------------------------------------------------------------
// Tailwind configuration — AI App Store dark theme.
//
// Colors are driven by CSS custom properties defined in globals.css so a
// future theme system (user preference, org branding) only needs to swap the
// CSS variables — no class name changes required across components.
// ---------------------------------------------------------------------------

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        // Map Tailwind color names to CSS variables so `bg-background`,
        // `text-muted`, `border-edge`, etc. all work as utility classes.
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface:    'rgb(var(--color-surface)    / <alpha-value>)',
        elevated:   'rgb(var(--color-elevated)   / <alpha-value>)',
        edge:       'rgb(var(--color-edge)        / <alpha-value>)',
        muted:      'rgb(var(--color-muted)       / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent)     / <alpha-value>)',
          dim:     'rgb(var(--color-accent-dim) / <alpha-value>)',
          glow:    'rgb(var(--color-accent-glow)/ <alpha-value>)',
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)',  'ui-monospace', 'monospace'],
      },

      backgroundImage: {
        // Radial glow used behind hero sections
        'glow-violet': 'radial-gradient(ellipse at center, rgb(var(--color-accent) / 0.15), transparent 70%)',
        'glow-cyan':   'radial-gradient(ellipse at center, rgb(34 211 238 / 0.12), transparent 70%)',
        // Subtle grid overlay pattern
        'grid-dark':   "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M0 .5h32M.5 0v32' stroke='%23ffffff08' fill='none'/%3E%3C/svg%3E\")",
      },

      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':     'float 4s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:   { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-14px)' } },
      },
    },
  },

  plugins: [],
}

export default config
