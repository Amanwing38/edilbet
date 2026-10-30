/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        surface: '#161b22',
        card: '#21262d',
        accent: {
          green: '#00E676',
          greenHover: '#00c853',
          gold: '#FFD700',
          red: '#FF3D00'
        }
      }
    },
  },
  plugins: [],
}
