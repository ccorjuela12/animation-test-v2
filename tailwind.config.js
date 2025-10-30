const { round } = require('three/tsl');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // En Tailwind v4 no es necesario `content`, el motor es JIT por defecto.
  theme: {
    extend: {
      colors: {
        primary: '#FF4000',
        background: '#0B0A10',
        neutral600: '#D4D4D4'
      },
      animation: {
        'fade-in': 'fade-in .5s ease-out both',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      screens: {
        '2xl': {'max': '1430px'},
      },
      borderRadius: {
        '5xl': '89.4px',
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const newUtilities = {
        // Utilidad para stroke acento (coincide con los requisitos del SVG #4)
        '.stroke-accent': {
          stroke: theme('colors.primary'),
          'stroke-width': '1',
        },
        // Utilidad para solidificar SVGs (relleno blanco, sin contorno)
        '.svg-solid': {
          fill: '#ffffff',
          stroke: 'none',
        },
        // Texto con contorno (útil para efectos de títulos)
        '.outline-text': {
          color: 'transparent',
          '-webkit-text-stroke': '1px currentColor',
          'text-stroke': '1px currentColor',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};

