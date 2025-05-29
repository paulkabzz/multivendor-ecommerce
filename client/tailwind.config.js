/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        main: "./src/assets/fonts/SFPRODISPLAYREGULAR.OTF",
      },
      colors: {
        'primary-dark': '#131313',
        'primary-light': '#ddd',
        'link': '#667eea'
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.line-clamp-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
        },
      });
    }
  ],
};
