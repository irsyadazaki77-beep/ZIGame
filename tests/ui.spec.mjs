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

    const favoriteCard = page.locator('.game-card:not(.featured):not(.hidden)').first();
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

test('mobile sidebar keeps keyboard focus inside the drawer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Drawer focus behavior is mobile-only.');
    await page.goto('/index.html');
    await page.locator('#sideToggle').click();
    await expect(page.locator('#portalSidebar')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#sideCollapseBtn')).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    const lastDrawerControl = await page.evaluate(() => {
        const sidebar = document.getElementById('portalSidebar');
        const items = Array.from(sidebar.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'))
            .filter(item => item.getClientRects().length > 0);
        return items.at(-1)?.id || items.at(-1)?.textContent?.trim();
    });
    expect(await page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.trim())).toBe(lastDrawerControl);

    await page.keyboard.press('Tab');
    await expect(page.locator('#sideCollapseBtn')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#portalSidebar')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#sideToggle')).toBeFocused();
});

test('portal loading, offline feedback, and game audio controls are resilient', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#portalLoading')).toBeHidden();
    await page.evaluate(() => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
        window.dispatchEvent(new Event('offline'));
    });
    await expect(page.locator('.zi-connection-status')).toContainText('offline');

    await page.goto('/snake.html');
    await expect(page.locator('#ziAudioToggle')).toBeVisible();
    await page.locator('#ziAudioToggle').click();
    await expect(page.locator('#ziAudioPanel')).toBeVisible();
    await page.locator('#ziMusicVolume').evaluate(input => {
        input.value = '0.65';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.locator('#ziSfxVolume').evaluate(input => {
        input.value = '0.25';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(() => page.evaluate(() => ({
        music: localStorage.getItem('ziGame:musicVolume'),
        sfx: localStorage.getItem('ziGame:sfxVolume')
    }))).toEqual({ music: '0.65', sfx: '0.25' });

    await page.locator('#ziGameHelpToggle').click();
    await expect(page.locator('#ziGameHelp')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.zi-game-help-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#ziGameHelp')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#ziGameHelpToggle')).toBeFocused();
});

test('shared audio mute stays synchronized with custom game controls', async ({ page }) => {
    for (const route of ['ludo', 'sayonarawildhearts', 'vvvvvv', 'thumper']) {
        await page.goto(`/${route}.html`);
        await expect(page.locator('#muteToggle')).toBeVisible();
        await page.locator('#muteToggle').click();
        await expect.poll(() => page.evaluate(() => localStorage.getItem('arcadeNexusMuted'))).toBe('1');

        const customMute = page.locator(route === 'sayonarawildhearts' ? '#btn-mute' : '#muteBtn');
        if (await customMute.count()) {
            if (route === 'ludo') await page.locator('#setupOv .start-btn').click();
            if (route === 'sayonarawildhearts') await page.locator('#ov-start .btn-start-big').click();
            if (route === 'thumper') await page.locator('#screen-menu .btn-start').click();
            await expect(customMute).toHaveAttribute('aria-pressed', 'true');
            // Some game-over overlays intentionally sit above the in-game controls;
            // exercise the control handler without depending on that visual layer.
            await customMute.evaluate(button => button.click());
            await expect.poll(() => page.evaluate(() => localStorage.getItem('arcadeNexusMuted'))).toBe('0');
            await expect(page.locator('#muteToggle')).toHaveAttribute('aria-pressed', 'false');
        } else {
            await page.locator('#muteToggle').click();
        }
    }
});

test('portal and game shell reflow at an effective 200 percent zoom width', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'The desktop project supplies the reference viewport.');
    // 200% zoom on a 1440 CSS-pixel desktop produces an effective ~720px
    // layout viewport. Exercise that reflow width directly and verify the
    // primary discovery and play surfaces remain usable.
    await page.setViewportSize({ width: 720, height: 900 });
    await page.goto('/index.html');
    await expect(page.locator('#searchInput')).toBeVisible();
    await expect(page.locator('.game-card').first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth > 1)).toBe(false);

    await page.goto('/snake.html');
    await expect(page.locator('#ziGameHelpToggle')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth > 1)).toBe(false);
});

test('settings persist theme, density, and motion preferences', async ({ page }) => {
    await page.goto('/settings.html');
    await page.locator('#settingTheme').selectOption('light');
    await page.locator('#settingDensity').selectOption('compact');
    await page.locator('label:has(#settingMotion)').click();
    await page.locator('#settingVolume').evaluate(input => {
        input.value = '0.7';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.locator('#settingSfxVolume').evaluate(input => {
        input.value = '0.2';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.locator('#saveSettings').click();
    await expect(page.locator('#saveSettings')).toBeVisible();

    await page.goto('/index.html');
    await expect(page.locator('body')).toHaveClass(/light-mode/);
    await expect(page.locator('body')).toHaveClass(/compact-density/);
    await expect(page.locator('html')).toHaveClass(/zi-reduced-motion/);
    await expect.poll(() => page.evaluate(() => ({
        music: localStorage.getItem('ziGame:musicVolume'),
        sfx: localStorage.getItem('ziGame:sfxVolume')
    }))).toEqual({ music: '0.7', sfx: '0.2' });
});

test('risky settings actions ask for confirmation', async ({ page }) => {
    await page.goto('/settings.html');
    const messages = [];
    page.on('dialog', async dialog => {
        messages.push(dialog.message());
        await dialog.dismiss();
    });
    await page.locator('#clearRecent').click();
    await page.locator('#clearFavorites').click();
    expect(messages).toEqual([
        'Hapus seluruh riwayat game dari browser ini?',
        'Hapus semua game favorit dari browser ini?'
    ]);
});

test('portal and game shell do not overflow', async ({ page }, testInfo) => {
    await page.goto('/index.html');
    const portalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth > 1);
    expect(portalOverflow).toBe(false);
    if (testInfo.project.name === 'mobile') await expect(page.locator('.mobile-quickbar')).toBeVisible();

    for (const route of ['snake', 'katanazero', 'thumper', 'superhot']) {
        await page.goto(`/${route}.html`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth > 1);
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

test('all game pages boot with shared shell and no page errors', async ({ page }, testInfo) => {
    // Loading every game sequentially is intentionally broader than a single-page smoke test.
    // Keep this budget stable when the desktop and mobile projects run in parallel.
    test.setTimeout(60_000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of gameRoutes) {
        errors.length = 0;
        await page.goto(`/${route}.html`);
        await page.waitForTimeout(120);
        await expect(page.locator('body')).toHaveClass(/zi-modern-game/);
        await expect(page.locator('.zi-shared-back').first()).toHaveAttribute('href', 'index.html');
        await expect(page.locator('#ziGameHelpToggle')).toBeVisible();
        await expect(page.locator('#ziAudioToggle')).toBeVisible();
        await expect(page.locator('#muteToggle')).toHaveAttribute('aria-label', /suara/i);
        await page.locator('#ziGameHelpToggle').click();
        await expect(page.locator('.zi-game-help-action').filter({ hasText: 'Mulai ulang' })).toBeVisible();
        await page.keyboard.press('Escape');
        const visibleScreens = await page.locator('.overlay, .game-overlay, .overlay-screen, .screen, [id$="-screen"], [id$="Screen"], [id$="Overlay"], [id^="screen-"]:not(#screen-flash)').evaluateAll(elements => elements
            .filter(element => {
                const style = getComputedStyle(element);
                return style.display !== 'none' && style.visibility !== 'hidden'
                    && style.pointerEvents !== 'none' && !element.hidden
                    && !element.classList.contains('hidden');
            })
            .map(element => ({
                id: element.id,
                role: element.getAttribute('role'),
                hidden: element.getAttribute('aria-hidden'),
                labelledBy: element.getAttribute('aria-labelledby'),
                label: element.getAttribute('aria-label')
            })));
        expect(visibleScreens.filter(screen => screen.role !== 'dialog' || screen.hidden !== 'false' || (!screen.labelledBy && !screen.label)), `${route} has an inaccessible visible game screen`).toEqual([]);
        const unnamedControls = await page.locator('button, [role="button"], input, select, textarea').evaluateAll(elements => elements
            .filter(element => {
                const style = getComputedStyle(element);
                return style.display !== 'none' && style.visibility !== 'hidden'
                    && element.getClientRects().length > 0;
            })
            .filter(element => {
                const labelledBy = element.getAttribute('aria-labelledby');
                const referenced = labelledBy ? labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ') : '';
                const associatedLabel = element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent || '' : '';
                return !(element.getAttribute('aria-label') || referenced || element.getAttribute('title')
                    || element.textContent?.replace(/\s+/g, ' ').trim() || associatedLabel);
            })
            .map(element => ({ tag: element.tagName, id: element.id, className: String(element.className) })));
        expect(unnamedControls, `${route} has visible controls without an accessible name`).toEqual([]);
        const visibleText = await page.locator('body').innerText();
        expect(visibleText, `${route} contains corrupted visible text`).not.toMatch(/(?:â|ðŸ|Ã|`r`n)/);
        if (testInfo.project.name === 'mobile') {
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth > 1);
            expect(overflow, `${route} overflows horizontally on mobile`).toBe(false);
        }
        expect(errors, `${route} emitted page errors: ${errors.join('; ')}`).toEqual([]);
    }
});
