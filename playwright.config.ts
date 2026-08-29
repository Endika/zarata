import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://127.0.0.1:4173',
    // Served from the root here; on Pages it lives under /zarata/, and a build made for
    // one and served at the other is a blank page.
    env: { VITE_BASE_PATH: '/' },
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
