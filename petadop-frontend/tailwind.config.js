/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0e14",
        foreground: "#e6e6e6",
        card: "#121722",
        cardForeground: "#e6e6e6",
        muted: "#1a2130",
        mutedForeground: "#b8c2cc",
        primary: "#7aa2f7",
        primaryForeground: "#0b0e14",
        accent: "#a6e3a1",
        warning: "#f9e2af",
        danger: "#f38ba8"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,.25)"
      }
    },
  },
  plugins: [],
}
