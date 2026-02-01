/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
  primary: "#5B1742",
  soft: "#F6EAF0",
  pinky: "#FF4D7D"
},

      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
