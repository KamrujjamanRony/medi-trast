/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"),
    require("tailwindcss/nesting"),
    require("tw-elements/dist/plugin.cjs")
  ],
  daisyui: {
    themes: ["light", "dark", "cupcake"],
  },
}