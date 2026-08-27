import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.ZI_GAME_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: true,
    reporter: 'line',
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off'
    },
    webServer: process.env.ZI_GAME_BASE_URL ? undefined : {
        command: 'node scripts/serve.mjs',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 30_000
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
        { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 }, isMobile: true } }
    ]
});
