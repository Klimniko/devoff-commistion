/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Helvetica", "Arial"],
      },
      colors: {
        brand: { DEFAULT: "#6366f1", light: "#a5b4fc", dark: "#4f46e5" },
      },
    },
  },
  plugins: [],
};
