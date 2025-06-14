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
      },
      screens: {
        "1000px": "1050px",
        "1100px": "1110px",
        "800px": "800px",
        "1300px": "1300px",
        "400px": "400px",
        "1200px": "1200px",
        "760px": "760px",
        "600px": "600px",
        "500px": "500px",
        "400px": "400px",
        "300px": "300px",
        "200px": "200px",
      },
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
