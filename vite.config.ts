import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // es2022 keeps optional chaining/nullish intact so we can ship untranspiled modern syntax
    target: 'es2022',
    cssMinify: 'lightningcss',
    // keep the initial payload small: anything under 4KB gets inlined, larger assets stay files
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Split the heavy, long-lived vendors out of the app chunk. Everything else
        // (React, router) is deliberately left for Rollup to co-locate so we don't
        // pay extra round trips just to shave a few kB off the entry.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils'))
            return 'vendor-motion';
          if (id.includes('@tanstack')) return 'vendor-query';
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
