/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  important: true,
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      xlg: "1150px",
    },
    extend: {
      dropShadow: {
        "3xl": "0 100px 100px rgba(0, 0, 0, 0.75)",
        "4xl": "0 175px 250px rgba(0, 0, 0, 0.9)",
        "3.5xl": "0 90px 90px rgba(0, 0, 0, 1)",
      },
      colors: {
        text: "#D9D9D9",
        "text-inactive": "#96A7BF",
        background: "#031525",
        "background-secondary": "#0D2136",
        "background-accent": "#FFD058",
        secondary: "#071321",
        border: "#BEC8D0",
        "border-secondary": "#285678",
        "button-secondary": "#828282",
        "button-primary": "#F7A305",
        "button-accent": "#005DBF",
        "tick-green": "#41D195",
        card: "#C4BEB7",
        "chart-background": "#203958",
        primary: "#142246",
        accent: "#0F55B0",
        "primary-grad": "#091021",
        "background-primary": "#09132b",
        "gradient-left": "#6BA6FE",
        "gradient-right": "#F9D1FF",
        "border-gradient-left": "#88E7F4",
        "border-gradient-right": "#3879DB",
        "pie-color": "#4DFFFF",
        "pie-color-bg": "#142753",
        "head-gradient-top": "#1D3752",
        "head-gradient-bottom": "#41A3B8",
        field: "#0e1831",
        "verify-border": "#D99BF7",
        "verify-bg": "#142245",
        "verify-error": "#FF1B5F",
        "face-bg": "#152343",
        "text-gradient": "#6E56CF",
      },
      fontFamily: {
        roboto: ['"Roboto"', "mono"],
        sora: ['"Sora"', "mono"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
