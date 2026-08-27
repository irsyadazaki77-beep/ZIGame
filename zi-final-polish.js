(function () {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const storage = {
        recent: 'ziGame:recent',
        favorites: 'ziGame:favorites',
        achievements: 'ziGame:achievements',
        onboarded: 'ziGame:onboardedFinal',
        lastFilter: 'ziGame:lastFilter',
        lastSort: 'ziGame:lastSort',
        volume: 'ziGame:musicVolume'
    };

    const textFixes = new Map([
        ['âŒ˜K', 'Ctrl+K'],
        ['â‡…', 'Sort'],
        ['â­ ', '★'],
        ['ðŸŽ²', '🎲'],
        ['âŒ¨ï¸ ', '⌘'],
        ['âš™ï¸ ', '⚙'],
        ['ðŸ”„', '↻'],
        ['â†’', '→'],
        ['â†‘', '↑'],
        ['â™¥', '♥'],
        ['â™¡', '♡'],
        ['â˜…', '★'],
        ['â˜†', '☆'],
        ['âš¡', '⚡'],
        ['âš”ï¸ ', '⚔'],
        ['â Œ', 'X'],
        ['ðŸŸ¥', '■'],
        ['ðŸ•¹ï¸ ', '🎮'],
        ['ðŸŽµ', '♪'],
        ['ðŸŽ®', '🎮'],
        ['ðŸ‘¾', '👾'],
        ['ðŸ§©', '🧩'],
        ['â™Ÿï¸ ', '♟'],
        ['&mdash;', '-']
    ]);

    function fixMojibake(root = document.body) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            let value = node.nodeValue;
            textFixes.forEach((to, from) => {
                value = value.split(from).join(to);
            });
            node.nodeValue = value;
        });
    }

    function storageGet(key, fallback = '') {
        try { return window.localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
    }

    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (_) { }
    }

    function readJSON(key, fallback) {
        try {
            const parsed = JSON.parse(storageGet(key, ''));
            return parsed == null ? fallback : parsed;
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        storageSet(key, JSON.stringify(value));
    }

    function toast(message) {
        const stack = $('#toastStack');
        if (!stack) return;
        const item = document.createElement('div');
        item.className = 'toast show';
        item.textContent = message;
        stack.appendChild(item);
        window.setTimeout(() => {
            item.classList.remove('show');
            window.setTimeout(() => item.remove(), 260);
        }, 2200);
    }

    function cardTitle(card) {
        return $('.card-title', card)?.textContent?.trim() || card.dataset.title || 'Game';
    }

    function cardHref(card) {
        return $('.play-btn', card)?.getAttribute('href') || '#';
    }

    function cardThumbnailSrc(card) {
        const href = cardHref(card).split('#')[0].split('?')[0];
        const route = href.split('/').pop() || '';
        if (!route.endsWith('.html')) return '';
        return `assets/game-thumbs/${route.slice(0, -5)}.jpg`;
    }

    function cardCategory(card) {
        return card.dataset.category || 'game';
    }

    function cards() {
        return $$('.game-card');
    }

    function visibleCards() {
        return cards().filter(card => !card.classList.contains('hidden'));
    }

    function favorites() {
        const value = readJSON(storage.favorites, []);
        return new Set(Array.isArray(value) ? value : []);
    }

    function normalizeButtons() {
        // Safe check for light mode
        let lightModeActive = false;
        try { lightModeActive = document.body.classList.contains('light-mode'); } catch(e) {}
        
        $('#themeToggle') && ($('#themeToggle').textContent = lightModeActive ? '☾' : '☀');
        $('#randomBtn') && ($('#randomBtn').textContent = '🎲');
        $('#cmdBtn') && ($('#cmdBtn').textContent = '⌘');
        $('#prefsToggleBtn') && ($('#prefsToggleBtn').textContent = '⚙');
        $('#toTop') && ($('#toTop').textContent = '↑');
        $$('.fav-btn').forEach(btn => {
            btn.textContent = btn.classList.contains('active') ? '♥' : '♡';
        });
    }

    function addHeroCtas() {
        const hero = $('#homeSection');
        const desc = $('.hero-desc', hero);
        if (!hero || !desc || $('.hero-cta-row', hero)) return;
        const row = document.createElement('div');
        row.className = 'hero-cta-row';
        row.innerHTML = [
            '<button class="hero-cta primary" type="button" data-final-action="random">🎲 Main Random</button>',
            '<button class="hero-cta" type="button" data-final-action="continue">Lanjutkan Terakhir</button>',
            '<button class="hero-cta" type="button" data-final-action="favorite">♥ Lihat Favorite</button>'
        ].join('');
        desc.insertAdjacentElement('afterend', row);
        row.addEventListener('click', event => {
            const button = event.target.closest('[data-final-action]');
            if (!button) return;
            const action = button.dataset.finalAction;
            if (action === 'random') {
                $('#randomBtn')?.click();
            }
            if (action === 'continue') {
                const recent = window.ZIGameRuntime?.getRecent?.() || readJSON(storage.recent, []);
                if (recent[0]?.href) {
                    window.location.href = recent[0].href;
                } else {
                    toast('Belum ada riwayat. Mulai dari game random dulu.');
                }
            }
            if (action === 'favorite') {
                $('#favOnlyBtn')?.click();
                $('#librarySection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function addSearchHint() {
        const panel = $('.console-panel');
        if (!panel || $('#searchResultHint')) return;
        const hint = document.createElement('div');
        hint.id = 'searchResultHint';
        hint.className = 'search-result-hint';
        hint.setAttribute('role', 'status');
        hint.setAttribute('aria-live', 'polite');
        hint.textContent = 'Semua genre';
        panel.insertAdjacentElement('afterend', hint);
    }

    function addCardVisuals() {
        cards().forEach((card, index) => {
            if (!$('.card-thumb', card)) {
                const title = cardTitle(card);
                const thumb = document.createElement('div');
                thumb.className = 'card-thumb';
                thumb.setAttribute('aria-hidden', 'true');
                const thumbImage = document.createElement('img');
                thumbImage.src = cardThumbnailSrc(card);
                thumbImage.alt = '';
                thumbImage.loading = 'lazy';
                thumbImage.decoding = 'async';
                thumbImage.addEventListener('error', () => thumb.classList.add('is-fallback'), { once: true });
                thumb.appendChild(thumbImage);
                const thumbLabel = document.createElement('span');
                thumbLabel.className = 'card-thumb-label';
                thumbLabel.textContent = `${cardCategory(card)} / ${String(index + 1).padStart(2, '0')}`;
                thumb.appendChild(thumbLabel);
                const body = $('.card-body', card);
                const featuredLeft = $('.featured-left', card);
                if (featuredLeft) {
                    featuredLeft.insertAdjacentElement('afterbegin', thumb);
                } else if (body) {
                    body.insertAdjacentElement('afterbegin', thumb);
                }
                card.setAttribute('aria-label', `${title}, kategori ${cardCategory(card)}`);
            }
            if (!$('.card-a11y-meta', card)) {
                const players = $('.card-players', card)?.textContent?.replace(/\s+/g, ' ').trim() || 'Aktif';
                const meta = document.createElement('div');
                meta.className = 'card-a11y-meta';
                const difficulty = card.classList.contains('featured') ? 'Intense' : ['Chill', 'Medium', 'Fast'][index % 3];
                meta.innerHTML = `<span>${difficulty}</span><span>${players}</span>`;
                $('.card-desc', card)?.insertAdjacentElement('afterend', meta);
            }
        });
    }

    function updateCategoryCounts() {
        const counts = cards().reduce((acc, card) => {
            const category = cardCategory(card);
            acc.all += 1;
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, { all: 0 });

        $$('.nav-pill, .side-cat-btn').forEach(button => {
            const key = button.dataset.filter || button.dataset.cat;
            if (!key) return;
            if (!button.dataset.filterLabel) {
                button.dataset.filterLabel = button.textContent.trim().replace(/\d+$/, '').trim();
            }
            let badge = $('.cat-count', button);
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cat-count';
                button.appendChild(badge);
            }
            badge.textContent = counts[key] || 0;
            button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
            button.setAttribute('aria-label', `${button.dataset.filterLabel} (${badge.textContent} game)`);
        });
    }

    function restoreLastControls() {
        const lastSort = storageGet(storage.lastSort);
        const sortSelect = $('#sortSelect');
        if (sortSelect && lastSort && Array.from(sortSelect.options).some(option => option.value === lastSort)) {
            sortSelect.value = lastSort;
            sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        sortSelect?.addEventListener('change', () => storageSet(storage.lastSort, sortSelect.value));

        const lastFilter = storageGet(storage.lastFilter);
        if (lastFilter) {
            const nav = $$('.nav-pill').find(button => button.dataset.filter === lastFilter);
            if (nav) window.setTimeout(() => nav.click(), 0);
        }
        $$('.nav-pill, .side-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter || btn.dataset.cat || 'all';
                storageSet(storage.lastFilter, filter);
                window.setTimeout(updateCategoryCounts, 0);
            });
        });
    }

    function improveRecentClear() {
        const clear = $('#clearRecentBtn');
        if (!clear || clear.dataset.finalConfirm === '1') return;
        clear.dataset.finalConfirm = '1';
        clear.addEventListener('click', event => {
            if (clear.dataset.confirmed === '1') {
                clear.dataset.confirmed = '0';
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            showConfirm('Hapus riwayat?', 'Riwayat terakhir dimainkan akan dikosongkan dari browser ini.', () => {
                clear.dataset.confirmed = '1';
                clear.click();
                toast('Riwayat sudah dibersihkan.');
            });
        }, true);
    }

    function showConfirm(title, body, onConfirm) {
        $('.confirm-panel')?.remove();
        const panel = document.createElement('div');
        panel.className = 'confirm-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.innerHTML = `
            <h3>${title}</h3>
            <p>${body}</p>
            <div class="confirm-actions">
                <button class="zi-mini-btn" type="button" data-confirm="cancel">Batal</button>
                <button class="zi-mini-btn primary" type="button" data-confirm="ok">Hapus</button>
            </div>
        `;
        document.body.appendChild(panel);
        panel.addEventListener('click', event => {
            const action = event.target.closest('[data-confirm]')?.dataset.confirm;
            if (action === 'cancel') panel.remove();
            if (action === 'ok') {
                panel.remove();
                onConfirm();
            }
        });
        $('[data-confirm="cancel"]', panel)?.focus();
    }

    function addOnboarding() {
        if (storageGet(storage.onboarded) === '1') return;
        window.setTimeout(() => {
            if (storageGet(storage.onboarded) === '1') return;
            const panel = document.createElement('div');
            panel.className = 'onboard-panel';
            panel.setAttribute('role', 'dialog');
            panel.innerHTML = `
                <h3>Selamat datang di ZI GAME</h3>
                <p>Gunakan search untuk cari cepat, Ctrl+K untuk command center, dan tombol random kalau ingin langsung main.</p>
                <div class="onboard-actions">
                    <button class="zi-mini-btn" type="button" data-onboard="later">Nanti</button>
                    <button class="zi-mini-btn primary" type="button" data-onboard="ok">Siap</button>
                </div>
            `;
            document.body.appendChild(panel);
            panel.addEventListener('click', event => {
                const action = event.target.closest('[data-onboard]')?.dataset.onboard;
                if (!action) return;
                if (action === 'ok') storageSet(storage.onboarded, '1');
                panel.remove();
            });
        }, 900);
    }

    function addAchievementsPanel() {
        const profile = $('#profileSection .meta-panels');
        if (!profile || $('#achievementGrid')) return;
        const unlocked = readJSON(storage.achievements, []);
        const catalog = [
            ['first-favorite', 'First Pick', 'Tambah favorite pertama'],
            ['collector-5', 'Collector x5', 'Simpan 5 favorite'],
            ['random-first', 'Chaos Player', 'Main dari random'],
            ['command-open', 'Command Pilot', 'Buka command center'],
            ['five-plays', 'Arcade Warmup', 'Main 5 kali sehari'],
            ['final-polish', 'Portal Ready', 'UI/UX final aktif']
        ];
        if (!unlocked.includes('final-polish')) {
            unlocked.push('final-polish');
            writeJSON(storage.achievements, unlocked);
        }
        const wrap = document.createElement('div');
        wrap.className = 'meta-card';
        wrap.innerHTML = `
            <div class="meta-head">
                <span class="meta-title">Achievement</span>
                <span class="meta-pill">${unlocked.length}/${catalog.length} unlocked</span>
            </div>
            <div class="achievement-grid" id="achievementGrid">
                ${catalog.map(([id, title, desc]) => `
                    <div class="achievement-tile ${unlocked.includes(id) ? 'is-unlocked' : ''}">
                        <strong>${unlocked.includes(id) ? '✓' : '○'} ${title}</strong>
                        <span>${desc}</span>
                    </div>
                `).join('')}
            </div>
        `;
        profile.insertAdjacentElement('afterend', wrap);
    }

    function enhanceCommandCenter() {
        const cmdInput = $('#cmdInput');
        const cmdList = $('#cmdList');
        if (!cmdInput || !cmdList) return;
        cmdInput.addEventListener('input', () => {
            const query = cmdInput.value.trim().toLowerCase();
            if (!query) return;
            const matches = cards().filter(card => cardTitle(card).toLowerCase().includes(query)).slice(0, 5);
            if (!matches.length) return;
            const gameRows = matches.map(card => `<button class="cmd-item final-game-command" data-href="${cardHref(card)}"><span>Main ${cardTitle(card)}</span><small>${cardCategory(card)}</small></button>`).join('');
            cmdList.insertAdjacentHTML('beforeend', gameRows);
            $$('.final-game-command', cmdList).forEach(button => {
                button.addEventListener('click', () => {
                    window.location.href = button.dataset.href;
                });
            });
        });
    }

    function addFooterStats() {
        const footer = $('.footer');
        if (!footer || $('.footer-stat', footer)) return;
        const date = new Date(document.lastModified);
        const stamp = Number.isNaN(date.getTime()) ? 'Final' : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        footer.insertAdjacentHTML('beforeend', `<span class="footer-stat">${cards().length} game</span><span class="footer-stat">Update ${stamp}</span>`);
    }

    function persistAudioVolume() {
        const volume = $('#mp-vol');
        const audio = $('#bgm-audio');
        if (!volume) return;
        const saved = storageGet(storage.volume);
        if (saved != null) {
            volume.value = saved;
            if (audio) audio.volume = Number(saved);
        }
        volume.addEventListener('input', () => storageSet(storage.volume, volume.value));
    }

    function placePortalMusicPlayer() {
        const player = $('#music-player');
        const hero = $('#homeSection');
        if (!player || !hero || player.parentElement === hero) return;
        // Keep the player close to the discovery controls so mobile can place
        // it in normal flow instead of covering the library or quickbar.
        hero.appendChild(player);
    }

    function stickySearchState() {
        const panel = $('.console-panel');
        if (!panel) return;
        const update = () => panel.classList.toggle('is-stuck', window.scrollY > panel.offsetTop + 10);
        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    function improveAccessibility() {
        $('#searchInput')?.setAttribute('aria-label', 'Cari game');
        $('#sortSelect')?.setAttribute('aria-label', 'Urutkan game');
        $('#bgm-select')?.setAttribute('aria-label', 'Pilih musik latar');
        $('#mp-vol')?.setAttribute('aria-label', 'Volume musik');
        $$('.play-btn').forEach(button => {
            const card = button.closest('.game-card');
            if (card) button.setAttribute('aria-label', `Main ${cardTitle(card)}`);
        });
    }

    function watchLevelUp() {
        const levelText = $('#profileLevelText');
        if (!levelText) return;
        let last = levelText.textContent;
        const observer = new MutationObserver(() => {
            const current = levelText.textContent;
            if (current && current !== last) {
                last = current;
                const panel = document.createElement('div');
                panel.className = 'level-modal';
                panel.innerHTML = `<h3>Level naik</h3><p>${current} terbuka. Progress kamu tersimpan otomatis.</p><button class="zi-mini-btn primary" type="button">Mantap</button>`;
                document.body.appendChild(panel);
                $('button', panel)?.addEventListener('click', () => panel.remove());
                window.setTimeout(() => panel.remove(), 3200);
            }
        });
        observer.observe(levelText, { childList: true, characterData: true, subtree: true });
    }

    /* ========================================================================
       PREMIUM ENHANCEMENTS: CURSOR, FILTERING, & THEME TOGGLE
       ======================================================================== */

    function setupPremiumCursor() {
        const oldDot = document.getElementById('cur-dot');
        const oldRing = document.getElementById('cur-ring');
        
        // Hide original cursor
        if (oldDot) oldDot.style.setProperty('display', 'none', 'important');
        if (oldRing) oldRing.style.setProperty('display', 'none', 'important');

        // Create new premium spring-physics cursor elements
        const newDot = document.createElement('div');
        newDot.id = 'cur-dot-new';
        const newRing = document.createElement('div');
        newRing.id = 'cur-ring-new';
        document.body.appendChild(newDot);
        document.body.appendChild(newRing);

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;
        let ringVx = 0;
        let ringVy = 0;
        
        // Spring friction parameters
        const stiffness = 0.088;
        const damping = 0.71;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Safe mobile verification
        const isTouch = window.matchMedia('(pointer: coarse)').matches;
        if (isTouch) {
            newDot.style.display = 'none';
            newRing.style.display = 'none';
            return;
        }

        let lastX = ringX;
        let lastY = ringY;

        function updateCursor() {
            // Immediate translate for inner dot
            newDot.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;

            // Spring motion for outer ring
            const ax = (mouseX - ringX) * stiffness;
            const ay = (mouseY - ringY) * stiffness;
            ringVx += ax;
            ringVy += ay;
            ringVx *= damping;
            ringVy *= damping;
            ringX += ringVx;
            ringY += ringVy;

            // Velocity vectors for stretch deformer
            const dx = ringX - lastX;
            const dy = ringY - lastY;
            const velocity = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Stretch ring proportional to speed
            const stretch = 1 + Math.min(velocity * 0.045, 0.5);
            const shrink = 1 - Math.min(velocity * 0.022, 0.25);

            if (velocity > 0.3) {
                newRing.style.transform = `translate3d(${ringX - 19}px, ${ringY - 19}px, 0) rotate(${angle}rad) scale(${stretch}, ${shrink})`;
            } else {
                newRing.style.transform = `translate3d(${ringX - 19}px, ${ringY - 19}px, 0) scale(1)`;
            }

            lastX = ringX;
            lastY = ringY;
            requestAnimationFrame(updateCursor);
        }
        updateCursor();

        // Cursor fade bounds
        document.addEventListener('mouseenter', () => {
            newDot.style.opacity = '1';
            newRing.style.opacity = '1';
        });
        document.addEventListener('mouseleave', () => {
            newDot.style.opacity = '0';
            newRing.style.opacity = '0';
        });

        // Hover delegator
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('a, button, input, select, textarea, [role="button"], .trend-tag, .side-chip, .game-card, .trending-chips button');
            if (target) {
                newRing.classList.add('hover');
            } else {
                newRing.classList.remove('hover');
            }
        });
    }

    function setupPremiumThemeToggle() {
        // Theme state is owned by the inline portal controller. The previous
        // enhancement replaced its buttons and could not access that script's
        // lexical `isLightMode`, which made the second toggle ineffective.
        // Leave the original listeners intact so both directions stay in sync
        // with localStorage and the sidebar control.
    }

    function setupPremiumFiltering() {
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        const favOnlyBtn = document.getElementById('favOnlyBtn');
        const visibleCount = document.getElementById('visibleCount');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const searchResultHint = document.getElementById('searchResultHint');
        const noResult = document.getElementById('noResult');
        
        const allCards = Array.from(document.querySelectorAll('.game-card'));
        const favorites = () => new Set(readJSON(storage.favorites, []));

        function cardId(card) {
            const href = card.querySelector('.play-btn')?.getAttribute('href') || '';
            return href || card.dataset.title;
        }
        function cardTitle(card) {
            return card.querySelector('.card-title')?.textContent?.trim() || 'Game';
        }
        function cardCategory(card) {
            return card.dataset.category || '';
        }
        function cardPlayers(card) {
            const raw = card.querySelector('.card-players')?.textContent || '0';
            const m = raw.replace(/\./g, '').match(/\d[\d,]*/);
            if (!m) return 0;
            return parseInt(m[0].replace(/,/g, ''), 10) || 0;
        }
        
        function updateSpotlight() {
            const spotlightTitle = document.getElementById('spotlightTitle');
            const spotlightDesc = document.getElementById('spotlightDesc');
            const spotlightPlay = document.getElementById('spotlightPlay');
            
            const visible = allCards.filter(card => !card.classList.contains('hidden'));
            if (!visible.length || !spotlightTitle || !spotlightDesc || !spotlightPlay) return;
            const pick = visible.reduce((best, card) => cardPlayers(card) > cardPlayers(best) ? card : best, visible[0]);
            spotlightTitle.textContent = cardTitle(pick);
            spotlightDesc.textContent = pick.querySelector('.card-desc')?.textContent?.trim() || 'Rekomendasi dari koleksi yang sedang tampil.';
            spotlightPlay.href = pick.querySelector('.play-btn')?.getAttribute('href') || '#';
        }

        function updateSidebarStats() {
            const sideVisibleCount = document.getElementById('sideVisibleCount');
            const sideFavCount = document.getElementById('sideFavCount');
            const sideRecentCount = document.getElementById('sideRecentCount');
            const raw = readJSON(storage.recent, []);
            const recents = window.ZIGameRuntime?.cleanRecent?.(raw) || (Array.isArray(raw) ? raw : []);

            if (sideVisibleCount) {
                sideVisibleCount.textContent = allCards.filter(card => !card.classList.contains('hidden')).length;
            }
            if (sideFavCount) sideFavCount.textContent = favorites().size;
            if (sideRecentCount) sideRecentCount.textContent = recents.length;
        }

        // Override window.updateCards with a smooth filtering transition
        window.updateCards = function() {
            const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
            
            let filterVal = 'all';
            try { filterVal = currentFilter; } catch(e) {
                if (window.currentFilter) filterVal = window.currentFilter;
            }

            let favOnlyVal = false;
            try { favOnlyVal = showFavOnly; } catch(e) {
                if (window.showFavOnly) favOnlyVal = window.showFavOnly;
            }

            const favs = favorites();
            let vis = 0;

            const toShow = [];
            const toHide = [];

            allCards.forEach(card => {
                const title = card.dataset.title || cardTitle(card).toLowerCase();
                const cat = cardCategory(card);
                const favMatch = !favOnlyVal || favs.has(cardId(card));
                const match = (!q || title.includes(q)) && (filterVal === 'all' || cat === filterVal) && favMatch;

                if (match) {
                    toShow.push(card);
                    vis++;
                } else {
                    toHide.push(card);
                }
            });

            // Animate Hiding Cards
            toHide.forEach(card => {
                if (!card.classList.contains('hidden')) {
                    card.classList.add('card-animating-out');
                    card.classList.remove('card-animating-in');
                    
                    setTimeout(() => {
                        if (card.classList.contains('card-animating-out')) {
                            card.classList.add('hidden');
                            card.classList.remove('card-animating-out');
                        }
                    }, 280);
                }
            });

            // Animate Showing Cards
            toShow.forEach((card, index) => {
                if (card.classList.contains('hidden')) {
                    card.classList.remove('hidden');
                    card.classList.add('card-animating-in');
                    card.classList.remove('card-animating-out');
                    
                    card.style.setProperty('--card-order', index);
                    
                    setTimeout(() => {
                        card.classList.remove('card-animating-in');
                    }, 320);
                } else {
                    card.style.setProperty('--card-order', index);
                }
            });

            if (noResult) {
                noResult.classList.toggle('show', vis === 0);
            }
            if (visibleCount) {
                visibleCount.textContent = vis + ' game' + (vis !== 1 ? 's' : '');
            }
            if (clearSearchBtn) {
                clearSearchBtn.classList.toggle('show', !!q);
            }
            if (searchResultHint) {
                const filterText = filterVal === 'all' ? 'Semua genre' : filterVal.charAt(0).toUpperCase() + filterVal.slice(1);
                searchResultHint.textContent = q ? `Hasil untuk "${q}" - ${filterText}` : filterText;
            }

            updateSpotlight();
            updateSidebarStats();
        };
    }

    /* ========================================================================
       INITIALIZATION FLOW
       ======================================================================== */

    function init() {
        // Run premium visual upgrades first
        setupPremiumCursor();
        setupPremiumThemeToggle();
        setupPremiumFiltering();

        fixMojibake();
        addSearchHint();
        addHeroCtas();
        addCardVisuals();
        updateCategoryCounts();
        normalizeButtons();
        restoreLastControls();
        improveRecentClear();
        addOnboarding();
        addAchievementsPanel();
        enhanceCommandCenter();
        addFooterStats();
        persistAudioVolume();
        placePortalMusicPlayer();
        stickySearchState();
        improveAccessibility();
        watchLevelUp();
        toast('UI/UX final aktif.');
        document.addEventListener('click', () => window.setTimeout(normalizeButtons, 20));
        window.setTimeout(normalizeButtons, 150);
        window.setTimeout(updateCategoryCounts, 250);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
