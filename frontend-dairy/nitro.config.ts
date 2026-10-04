import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
  preset: 'node-server',
  routeRules: {
    '/api/**': {
      proxy: 'https://jharanai-backend.onrender.com/api/**',
    },
  },
});
