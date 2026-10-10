/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        ink: '#111111',
        cream: '#FFF4E0',
        pop: {
          yellow: '#FFD23F',
          pink: '#FF8FAB',
          mint: '#7BD389',
          coral: '#FF6B6B',
          sky: '#74B9FF',
        },
        muted: '#5B5346',
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0 0 #111111',
        brutal: '4px 4px 0 0 #111111',
        'brutal-lg': '6px 6px 0 0 #111111',
        'brutal-xl': '8px 8px 0 0 #111111',
      },
    },
  },
  plugins: [],
}
