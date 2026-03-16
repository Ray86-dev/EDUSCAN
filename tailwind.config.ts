import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        primary: {
          DEFAULT: "#476550",
          container: "#7d9d85",
          fixed: "#c9ebd0",
          "fixed-dim": "#adcfb5",
        },
        "on-primary": {
          DEFAULT: "#ffffff",
          container: "#173422",
          fixed: "#032110",
          "fixed-variant": "#304d39",
        },
        "inverse-primary": "#adcfb5",

        // Secondary
        secondary: {
          DEFAULT: "#3f627f",
          container: "#b7dbfd",
          fixed: "#cce5ff",
          "fixed-dim": "#a7caec",
        },
        "on-secondary": {
          DEFAULT: "#ffffff",
          container: "#3d617e",
          fixed: "#001e31",
          "fixed-variant": "#254a66",
        },

        // Tertiary
        tertiary: {
          DEFAULT: "#5f604b",
          container: "#979780",
          fixed: "#e5e4ca",
          "fixed-dim": "#c8c8af",
        },
        "on-tertiary": {
          DEFAULT: "#ffffff",
          container: "#2e2f1e",
          fixed: "#1c1d0c",
          "fixed-variant": "#474835",
        },

        // Error
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        "on-error": {
          DEFAULT: "#ffffff",
          container: "#93000a",
        },

        // Surface system
        surface: {
          DEFAULT: "#fbf9f5",
          dim: "#dcdad6",
          bright: "#fbf9f5",
          "container-lowest": "#ffffff",
          "container-low": "#f6f3ef",
          container: "#f0edea",
          "container-high": "#eae8e4",
          "container-highest": "#e4e2df",
          variant: "#e4e2df",
          tint: "#476550",
        },
        "on-surface": {
          DEFAULT: "#1b1c1a",
          variant: "#424843",
        },
        "inverse-surface": "#30302e",
        "inverse-on-surface": "#f3f0ed",

        // Outline
        outline: {
          DEFAULT: "#727972",
          variant: "#c2c8c1",
        },

        // Background
        background: "#fbf9f5",
        "on-background": "#1b1c1a",
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-public-sans)", "sans-serif"],
        label: ["var(--font-public-sans)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "0.75rem",
        "3xl": "1rem",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)", width: "40%" },
          "50%": { transform: "translateX(60%)", width: "60%" },
          "100%": { transform: "translateX(200%)", width: "40%" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "soft-pulse": "soft-pulse 2s ease-in-out infinite",
        "progress-indeterminate": "progress-indeterminate 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
