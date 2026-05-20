/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfcfb',
          100: '#f9f6f3',
          200: '#f3ece6',
          300: '#e8ddd3',
          400: '#d9c9b8',
          500: '#c4ad96',
        },
        slate: {
          850: '#1a2332',
          950: '#0d1117',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
