/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta ejecutiva: fondo neutro, azul marino como color de marca
        canvas: '#F4F5F7',
        surface: '#FFFFFF',
        border: '#E2E5EA',
        ink: '#1F2937',
        muted: '#6B7280',
        brand: {
          DEFAULT: '#14213D',
          light: '#1F2E52',
          accent: '#2F6FED',
        },
        success: '#15803D',
        warning: '#B45309',
        danger: '#B91C1C',
        // Se mantienen para no romper clases existentes en los componentes
        blush: '#F4F5F7',
        coral: '#14213D',
        mint: '#E7F3EA',
        lilac: '#E8EBF5',
      },
      borderRadius: {
        xl2: '0.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
