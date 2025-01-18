import { type Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gaming: {
          400: '#4F46E5',
          500: '#4338CA',
          600: '#3730A3',
          700: '#1E1A78',
          800: '#1A1F2C',
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-dir")(),
  ],
} satisfies Config;
