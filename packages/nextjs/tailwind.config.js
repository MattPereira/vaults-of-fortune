/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "scaffoldEthDark",
  // DaisyUI theme colors
  daisyui: {
    themes: [
      // {
      //   scaffoldEth: {
      //     primary: "#93BBFB",
      //     "primary-content": "#212638",
      //     secondary: "#DAE8FF",
      //     "secondary-content": "#212638",
      //     accent: "#93BBFB",
      //     "accent-content": "#212638",
      //     neutral: "#212638",
      //     "neutral-content": "#ffffff",
      //     "base-100": "#ffffff",
      //     "base-200": "#f4f8ff",
      //     "base-300": "#DAE8FF",
      //     "base-content": "#212638",
      //     info: "#93BBFB",
      //     success: "#34EEB6",
      //     warning: "#FFCF72",
      //     error: "#FF8863",
      //     "--rounded-btn": "9999rem",
      //     ".tooltip": {
      //       "--tooltip-tail": "6px",
      //     },
      //     ".link": {
      //       textUnderlineOffset: "2px",
      //     },
      //     ".link:hover": {
      //       opacity: "80%",
      //     },
      //   },
      // },
      {
        main: {
          primary: "#EDF2F7",
          "primary-content": "#040407",
          secondary: "#323f61",
          "secondary-content": "#F9FBFF",
          accent: "#4969A6",
          "accent-content": "#F9FBFF",
          neutral: "#F9FBFF",
          "neutral-content": "#385183",
          // RGBA transparent colors don't work with daisyUI theme, but they do with tw extend colors
          // "base-100": "#FFFFFF",
          // "base-200": "#FFFFFF0F",
          "base-300": "#040407",
          "base-content": "#F9FBFF",
          info: "#385183",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",
          "--rounded-btn": "9999rem",
          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "hsl(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },
  theme: {
    fontFamily: {
      sans: ["Inter", "Tahoma", "Verdana", "sans-serif"],
    },
    extend: {
      colors: {
        secondary: "#FFFFFF3D",
        "base-100": "#FFFFFF0A",
        "base-200": "#FFFFFF0F",
        "base-300": "#040407",
        "base-content": "#FFFFFFCC",
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      fontFamily: {
        cubano: ["cubano", "sans-serif"],
        gothic: ["didact gothic", "sans-serif"],
      },
    },
  },
};
