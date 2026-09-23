/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213D",
        mint: "#D7F9E9",
        coral: "#FF8066",
      },
    },
  },
  plugins: [],
};
