/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--c-page)",
        fg: "var(--c-fg)",
        muted: "var(--c-muted)",
        line: "var(--c-line)",
      },
      fontFamily: {
        anton: ["Anton", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        antonio: ["Antonio", "sans-serif"],
      },
      keyframes: {
        orbit: {
          "0%": { transform: "rotateX(16deg) rotateY(0deg)" },
          "100%": { transform: "rotateX(16deg) rotateY(360deg)" },
        },
      },
      animation: {
        orbit: "orbit 50s linear infinite",
      },
    },
  },
  plugins: [],
};
