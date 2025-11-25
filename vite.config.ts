import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
  plugins: [react()],
  define: {
        'process.env.API_KEY': JSON.stringify(env.ARKAIOS_API_KEY || env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.ARKAIOS_API_KEY': JSON.stringify(env.ARKAIOS_API_KEY),
        'process.env.ARKAIOS_BASE_URL': JSON.stringify(env.ARKAIOS_BASE_URL),
        'process.env.ARKAIOS_MODEL_ID': JSON.stringify(env.ARKAIOS_MODEL_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
