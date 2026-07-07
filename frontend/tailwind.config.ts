import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: "var(--color-lavender-whisper)",
        forest: "var(--color-forest-ink)",
        ember: "var(--color-ember-glow)",
        vast: "var(--color-vast-ink)",
        cream: "var(--color-lumen-cream)",
        stone: "var(--color-lumen-stone)",
        fog: "var(--color-fog)",
        charcoal: "var(--color-charcoal)",
      },
      fontFamily: {
        serif: ["var(--font-eb-garamond)"],
        sans: ["var(--font-figtree)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
