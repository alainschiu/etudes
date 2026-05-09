import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    env: {
      // Stubs so modules that read import.meta.env at import time don't crash.
      // Tests don't actually hit the network — they exercise pure helpers.
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_GOOGLE_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
    },
  },
});
