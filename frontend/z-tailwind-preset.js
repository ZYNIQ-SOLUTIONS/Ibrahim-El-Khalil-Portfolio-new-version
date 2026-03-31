/**
 * ZYNIQ Tailwind CSS Preset — v2.0.0
 * Single source of truth for ALL Tailwind-based frontends.
 *
 * Usage in any tailwind.config.js / .ts:
 *   const zyniqPreset = require('../../core/_z-framework/z-tailwind-preset');
 *   module.exports = { presets: [zyniqPreset], ... };
 */

const ZYNIQ_PRESET_VERSION = '2.0.0';

/** @type {import('tailwindcss').Config} */
const preset = {
  theme: {
    extend: {
      /* ── Colors ─────────────────────────────────────── */
      colors: {
        zyniq: {
          red:   '#EA2323',
          black: '#050505',
          white: '#FFFFFF',
          void:  '#000000',
        },
        brand: {
          red:   '#EA2323',
          black: '#050505',
          white: '#FFFFFF',
          void:  '#000000',
        },
        surface: {
          primary:   '#0a0808',
          secondary: '#0f0f12',
          tertiary:  '#141418',
          elevated:  '#18181b',
          card:      '#1a1111',
          deep:      '#0d0909',
          hover:     '#2a1818',
        },
        glass: {
          light:     'var(--z-glass-light)',
          medium:    'var(--z-glass-medium)',
          heavy:     'var(--z-glass-heavy)',
          red:       'var(--z-glass-red)',
          'red-heavy': 'var(--z-glass-red-heavy)',
        },
        text: {
          primary:   'var(--z-text-primary)',
          secondary: 'var(--z-text-secondary)',
          muted:     'var(--z-text-muted)',
          inverse:   'var(--z-text-inverse)',
          accent:    'var(--z-text-accent)',
        },
        severity: {
          critical: '#ef4444',
          high:     '#f97316',
          medium:   '#eab308',
          low:      '#22c55e',
          info:     '#3b82f6',
        },
        risk: {
          critical: '#dc2626',
          high:     '#ea580c',
          medium:   '#ca8a04',
          low:      '#16a34a',
          none:     '#6b7280',
        },
        gray: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
      },

      /* ── Fonts ──────────────────────────────────────── */
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        display:  ['Space Grotesk', 'sans-serif'],
        inter:    ['Inter', 'system-ui', 'sans-serif'],
        body:     ['Inter', 'system-ui', 'sans-serif'],
        mono:     ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        code:     ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },

      /* ── Font Sizes ─────────────────────────────────── */
      fontSize: {
        'z-xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'z-sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'z-base': ['1rem',     { lineHeight: '1.5rem' }],
        'z-lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'z-xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        'z-2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        'z-3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        'z-4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        'z-5xl':  ['3rem',     { lineHeight: '1' }],
      },

      /* ── Border Radius ─────────────────────────────── */
      borderRadius: {
        'z-sm':   '0.25rem',
        'z-md':   '0.5rem',
        'z-lg':   '0.75rem',
        'z-xl':   '1rem',
        'z-2xl':  '1.5rem',
        'z-full': '9999px',
      },

      /* ── Spacing ────────────────────────────────────── */
      spacing: {
        'z-1':  '0.25rem',
        'z-2':  '0.5rem',
        'z-3':  '0.75rem',
        'z-4':  '1rem',
        'z-5':  '1.25rem',
        'z-6':  '1.5rem',
        'z-8':  '2rem',
        'z-10': '2.5rem',
        'z-12': '3rem',
        'z-16': '4rem',
        'z-20': '5rem',
      },

      /* ── Box Shadow ─────────────────────────────────── */
      boxShadow: {
        'z-sm':   '0 1px 2px rgba(0,0,0,0.4)',
        'z-md':   '0 4px 6px rgba(0,0,0,0.5)',
        'z-lg':   '0 10px 15px rgba(0,0,0,0.6)',
        'z-xl':   '0 20px 25px rgba(0,0,0,0.7)',
        'z-glow': '0 0 20px rgba(234,35,35,0.3)',
        'z-glow-strong': '0 0 40px rgba(234,35,35,0.5)',
        'z-glow-text':   '0 0 10px rgba(234,35,35,0.4)',
        'z-glow-border': '0 0 8px rgba(234,35,35,0.25)',
        'z-inner-glow':  'inset 0 0 20px rgba(234,35,35,0.15)',
      },

      /* ── Z-Index ────────────────────────────────────── */
      zIndex: {
        'dropdown': '1000',
        'sticky':   '1020',
        'fixed':    '1030',
        'backdrop': '1040',
        'modal':    '1050',
        'popover':  '1060',
        'tooltip':  '1070',
        'toast':    '1080',
      },

      /* ── Animations ─────────────────────────────────── */
      animation: {
        'z-fade-in':      'z-fade-in 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'z-fade-in-up':   'z-fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'z-fade-in-down': 'z-fade-in-down 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'z-slide-in-left':  'z-slide-in-left 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'z-slide-in-right': 'z-slide-in-right 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'z-scale-in':    'z-scale-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'z-glow-pulse':  'z-glow-pulse 2s ease-in-out infinite',
        'z-pulse-ring':  'z-pulse-ring 2s ease-out infinite',
        'z-spin-slow':   'spin 3s linear infinite',
        'z-float':       'z-float 6s ease-in-out infinite',
        'z-shimmer':     'z-shimmer 2s linear infinite',
        'z-terminal-blink': 'z-terminal-blink 1s steps(2,start) infinite',
        'z-scan-line':   'z-scan-line 4s linear infinite',
        'z-typing':      'z-typing 3.5s steps(40,end)',
        'z-border-glow': 'z-border-glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'z-fade-in':      { from: { opacity: '0' }, to: { opacity: '1' } },
        'z-fade-in-up':   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'z-fade-in-down': { from: { opacity: '0', transform: 'translateY(-20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'z-slide-in-left':  { from: { opacity: '0', transform: 'translateX(-30px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'z-slide-in-right': { from: { opacity: '0', transform: 'translateX(30px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'z-scale-in':    { from: { opacity: '0', transform: 'scale(0.9)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'z-glow-pulse':  { '0%, 100%': { boxShadow: '0 0 5px rgba(234,35,35,0.2)' }, '50%': { boxShadow: '0 0 20px rgba(234,35,35,0.6)' } },
        'z-pulse-ring':  { '0%': { transform: 'scale(0.8)', opacity: '1' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
        'z-float':       { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'z-shimmer':     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'z-terminal-blink': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        'z-scan-line':   { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(100vh)' } },
        'z-typing':      { from: { width: '0' }, to: { width: '100%' } },
        'z-border-glow': { '0%': { borderColor: 'rgba(234,35,35,0.2)' }, '100%': { borderColor: 'rgba(234,35,35,0.6)' } },
      },

      /* ── Transition Duration ────────────────────────── */
      transitionDuration: {
        'z-fast':   '150ms',
        'z-normal': '250ms',
        'z-slow':   '400ms',
        'z-spring': '600ms',
      },
      transitionTimingFunction: {
        'z-ease':   'cubic-bezier(0.4, 0, 0.2, 1)',
        'z-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
};

module.exports = preset;
module.exports.ZYNIQ_PRESET_VERSION = ZYNIQ_PRESET_VERSION;
