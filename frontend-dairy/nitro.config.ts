import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
  preset: process.env.NITRO_PRESET || (process.env.VERCEL ? 'vercel' : 'node-server'),
  routeRules: {
    '/api/**': {
      proxy: 'https://jharanai-backend.onrender.com/api/**',
    },
  },
});
