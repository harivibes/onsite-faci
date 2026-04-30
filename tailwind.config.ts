import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-dm-serif)", "Georgia", "serif"],
        alt:     ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono:    ["var(--font-space-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Brutalist palette — sampled directly from param-ms.netlify.app
        brutal: {
          bg:     "#F5F3EE",   // paper cream canvas
          paper:  "#FAF8F5",   // slightly lighter for panels
          dark:   "#111111",   // ink
          red:    "#C4291E",   // primary accent
          yellow: "#EAB308",   // highlight
          green:  "#16A34A",   // success
          blue:   "#3B82F6",   // info
          cream:  "#FEF9C3",   // soft yellow tint (for "new" badges)
        },
      },
      boxShadow: {
        "brutal-sm": "3px 3px 0 0 #111111",
        "brutal":    "4px 4px 0 0 #111111",
        "brutal-md": "6px 6px 0 0 #111111",
        "brutal-lg": "8px 8px 0 0 #111111",
        "brutal-red": "6px 6px 0 0 #C4291E",
        "brutal-red-sm": "3px 3px 0 0 #C4291E",
        "brutal-yellow": "6px 6px 0 0 #EAB308",
      },
      letterSpacing: {
        eyebrow: "0.18em",
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "0",
      },
    },
  },
  plugins: [],
};

export default config;
