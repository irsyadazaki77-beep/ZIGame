import { test, expect } from '@playwright/test';

const gameRoutes = [
    '2048', 'babaisyou', 'breakout', 'colormatch', 'dinorun', 'flappy',
    'geometry', 'gris', 'hangman', 'hyperlightdrifter', 'katanazero', 'ludo',
    'mathquiz', 'memory', 'minesweeper', 'minimetro', 'pacmaze', 'polybridge3',
    'pong', 'rps', 'sayonarawildhearts', 'simon', 'snake', 'spaceshooter',
    'superhot', 'tetris', 'thumper', 'tictactoe', 'vvvvvv', 'whackamole', 'wordle'
];

test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    const onboardingReady = page.locator('[data-onboard="ok"]');
    await onboardingReady.waitFor({ state: 'visible', timeout: 1500 }).catch(() => {});
    if (await onboardingReady.isVisible()) await onboardingReady.click();
});

test('portal supports search, category, favorite, view, and theme controls', async ({ page }, testInfo) => {
    await page.goto('/index.html');
    const cards = page.locator('.game-card');
    await expect(cards).toHaveCount(32);
    await expect(page.locator('.card-thumb img')).toHaveCount(32);

    await page.locator('#searchInput').fill('snake');
    await expect(page.locator('#visibleCount')).toHaveText(/\b1\b/);
    await expect(cards.filter({ hasText: 'Snake Xenzia' }).first()).toBeVisible();

    await page.locator('#clearSearchBtn').click();
    if (testInfo.project.name === 'mobile') {
        await page.locator('#sideToggle').click();
        await page.locator('#sideCategoryFilters [data-cat="puzzle"]').click();
    } else {
        await page.locator('.nav-pill[data-filter="puzzle"]').click();
    }
    await expect(page.locator('#visibleCount')).not.toHaveText('32');
    await expect(page.locator('.game-card:not(.hidden)').first()).toBeVisible();

    const favoriteCard = page.locator('.game-card:not(.featured)').first();
    await favoriteCard.locator('.fav-btn').click();
    await page.locator('#favOnlyBtn').click();
    await expect(page.locator('#visibleCount')).toHaveText(/\b1\b/);
    await expect(favoriteCard).toBeVisible();

    await page.locator('#prefsToggleBtn').click();
    await page.locator('#viewToggleBtn').click();
    await expect(page.locator('#gameContainer')).toHaveClass(/list-view/);
    await page.locator('#themeToggle').click();
    await expect(page.locator('body')).toHaveClass(/light-mode/);
});

test('portal command center and empty state remain keyboard reachable', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('#cmdBtn').click();
    await expect(page.locator('#cmdOverlay')).toBeVisible();
    await expect(page.locator('#cmdInput')).toBeFocused();
    await page.locator('#cmdInput').fill('random');
    await expect(page.locator('#cmdList')).toContainText(/random/i);
    await page.keyboard.press('Escape');
    await expect(page.locator('#cmdOverlay')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#cmdBtn')).toBeFocused();

    await page.locator('#searchInput').fill('tidak ada game seperti ini');
    await expect(page.locator('#noResult')).toBeVisible();
    await expect(page.locator('#noResultResetBtn')).toBeVisible();
});

test('settings persist theme, density, and motion preferences', async ({ page }) => {
    await page.goto('/settings.html');
    await page.locator('#settingTheme').selectOption('light');
    await page.locator('#settingDensity').selectOption('compact');
    await page.locator('label:has(#settingMotion)').click();
    await page.locator('#saveSettings').click();
    await expect(page.locator('#saveSettings')).toBeVisible();

    await page.goto('/index.html');
    await expect(page.locator('body')).toHaveClass(/light-mode/);
    await expect(page.locator('body')).toHaveClass(/compact-density/);
    await expect(page.locator('html')).toHaveClass(/zi-reduced-motion/);
});

test('portal and game shell do not overflow', async ({ page }, testInfo) => {
    await page.goto('/index.html');
    const portalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(portalOverflow).toBe(false);
    if (testInfo.project.name === 'mobile') await expect(page.locator('.mobile-quickbar')).toBeVisible();

    for (const route of ['snake', 'katanazero', 'thumper', 'superhot']) {
        await page.goto(`/${route}.html`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow, `${route} overflows horizontally`).toBe(false);
        await expect(page.locator('body')).toHaveClass(/zi-modern-game/);
        await expect(page.locator('.zi-shared-back').first()).toHaveAttribute('aria-label', 'Kembali ke portal ZI GAME');
    }
});

test('game start overlay is accessible and releases focus after start', async ({ page }) => {
    await page.goto('/snake.html');
    const overlay = page.locator('#overlay');
    await expect(overlay).toHaveAttribute('role', 'dialog');
    await expect(overlay).toHaveAttribute('aria-modal', 'true');
    await expect(overlay).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#ovBtn')).toBeFocused();

    await page.locator('#ovBtn').click();
    await expect(overlay).toHaveAttribute('aria-hidden', 'true');
    const focusReleased = await page.evaluate(() => {
        const active = document.activeElement;
        return !document.querySelector('#overlay')?.contains(active)
            && active?.getAttribute('tabindex') === '-1';
    });
    expect(focusReleased).toBe(true);
});

test('all game pages boot with shared shell and no page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of gameRoutes) {
        errors.length = 0;
        await page.goto(`/${route}.html`);
        await page.waitForTimeout(120);
        await expect(page.locator('body')).toHaveClass(/zi-modern-game/);
        await expect(page.locator('.zi-shared-back').first()).toHaveAttribute('href', 'index.html');
        expect(errors, `${route} emitted page errors: ${errors.join('; ')}`).toEqual([]);
    }
});
