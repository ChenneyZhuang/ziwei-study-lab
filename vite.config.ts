import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/lucide-react')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/iztro')) {
            return 'iztro-vendor';
          }
          if (id.includes('node_modules/lunar-javascript')) {
            return 'lunar-vendor';
          }
          if (
            id.includes('/src/reading-plain') ||
            id.includes('/src/reading-knowledge') ||
            id.includes('/src/classic-plain')
          ) {
            return 'reading-corpus';
          }
        },
      },
    },
  },
});
