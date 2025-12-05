/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        aurora: {
          purple: "#5227FF",
          green: "#7cff67",
          "purple-light": "#7c5aff",
          "purple-dark": "#3d1acc",
          "green-light": "#a0ff8f",
          "green-dark": "#5ce648",
        },
      },
    },
  },
  plugins: [],
};
