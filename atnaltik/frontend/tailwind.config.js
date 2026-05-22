/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0c",
        surface: "#16161a",
        primary: "#e63946",
        secondary: "#1d3557",
        accent: "#457b9d",
        muted: "#a8dadc",
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(230, 57, 70, 0.3)',
      }
    },
  },
  plugins: [],
}
