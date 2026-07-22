import type { Config } from 'tailwindcss';

/**
 * Tema "Editorial Luxury" — los mismos tokens de la plantilla de Vera.
 * Papel crema cálido, tinta espresso, acento terracota, sage y dorado.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF6EF',
        'paper-2': '#F1E9DB',
        card: '#FFFDF8',
        ink: '#211B15',
        'ink-2': '#6E6357',
        'ink-3': '#9C9286',
        clay: '#B65A36',
        'clay-deep': '#97431F',
        sage: '#6E7A5A',
        gold: '#A4824B',
        whatsapp: '#1f7a4d',
        // temperaturas del CRM
        frio: '#5B7E9E',
        tibio: '#C18A3D',
        caliente: '#B65A36',
      },
      fontFamily: {
        serif: ['Zodiak', 'Georgia', 'serif'],
        sans: ['General Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: '1.75rem',
        md: '1.15rem',
        sm: '0.7rem',
      },
      boxShadow: {
        sm: '0 14px 30px -18px rgba(58, 40, 26, 0.25)',
        md: '0 34px 70px -34px rgba(58, 40, 26, 0.30)',
        lg: '0 60px 120px -50px rgba(58, 40, 26, 0.38)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
