/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        paper: "#F9F7F1",
        ink: {
          DEFAULT: "#2C3E50",
          light: "#5D6D7E",
        },
        gold: "#B89C66",
        highlight: {
          yellow: "#FEF3C7",
          green: "#D1FAE5",
          red: "#FEE2E2",
        },
        pencil: "#4B5563",
      },
      fontFamily: {
        sketch: ['"Architects Daughter"', "cursive"],
        body: ['"Patrick Hand"', "cursive"],
        code: ['"JetBrains Mono"', "monospace"],
        heading: ['"Playfair Display"', "serif"],
        ui: ['"Montserrat"', "sans-serif"],
      },
      backgroundImage: {
        "grid-paper":
          "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
      },
      boxShadow: {
        sketch: "4px 4px 0px 0px rgba(44, 62, 80, 0.2)",
        "sketch-hover": "6px 6px 0px 0px rgba(44, 62, 80, 0.2)",
      },
    },
  },
  plugins: [],
};
