import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#101114', bg2: '#18191F', card: '#202127', line: '#2D2D35',
        accent: '#8B5CF6', accent2: '#C084FC', creative: '#EC4899',
        ink: '#F5F5F7', mute: '#A1A1AA',
        ok: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
      },
      fontFamily: {
        head: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
