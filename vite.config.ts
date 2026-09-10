import { defineConfig } from 'vite';

export default defineConfig({
  // Polling keeps local previews fresh in macOS sandboxed development sessions.
  server: { watch: { usePolling: true, interval: 500 } },
});
