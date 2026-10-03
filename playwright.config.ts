import { defineConfig, devices } from "@playwright/test";

// NFR-09 (P1): asosiy oqimlar smoke-testi. Fixture rejimida — tashqi xizmatlarsiz (Supabase, Telegram).
// Ishga tushirish: pnpm build && pnpm test:e2e
const PORT = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Pixel 7"] },
  webServer: {
    command: `pnpm start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    env: { DATA_SOURCE: "fixture" },
  },
});
