/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        blush: '#FDEDF3',
        coral: '#FF6F91',
        mint: '#B8F2E6',
        lilac: '#C9B6E4',
        ink: '#3D3D3D',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
