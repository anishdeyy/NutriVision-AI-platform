/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#020409",
        bg2: "#080c18",
        card: "rgba(10, 16, 35, 0.85)",
        cardSolid: "#0b1222",
        border: "rgba(80, 130, 200, 0.15)",
        borderGlow: "rgba(59, 158, 255, 0.35)",
        accent: "#3b9eff",
        accent2: "#7c5cfc",
        accent3: "#00e5a0",
        accent4: "#ff8c42",
        accent5: "#ff4d8d",
        accent6: "#ffd60a",
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        sans: ["DM Sans", "Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
