/* ============================================
   ZI GAME — MAIN APPLICATION LOGIC
   ============================================ */

// === PARTICLE SYSTEM ===
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.hue = Math.random() > 0.5 ? 180 : 260;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue},80%,70%,${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `hsla(200,60%,60%,${0.08 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        drawLines();
        requestAnimationFrame(animate);
    }
    animate();
})();


// === STATS MANAGER ===
const StatsManager = {
    KEY: 'arcadeNexusStats',
    getStats() {
        const fallback = {
            totalScore: 0,
            gamesPlayed: 0,
            streak: 0,
            lastPlayed: null,
            highScores: {},
            achievements: []
        };
        try {
            const data = localStorage.getItem(this.KEY);
            const parsed = data ? JSON.parse(data) : fallback;
            return {
                ...fallback,
                ...parsed,
                totalScore: Number(parsed?.totalScore) || 0,
                gamesPlayed: Number(parsed?.gamesPlayed) || 0,
                highScores: parsed?.highScores && typeof parsed.highScores === 'object' ? parsed.highScores : {},
                achievements: Array.isArray(parsed?.achievements) ? parsed.achievements : []
            };
        } catch (_) {
            return fallback;
        }
    },
    save(stats) {
        try { localStorage.setItem(this.KEY, JSON.stringify(stats)); } catch (_) { }
    },
    addScore(game, score) {
        const stats = this.getStats();
        const numericScore = Math.max(0, Number(score) || 0);
        stats.totalScore += numericScore;
        stats.gamesPlayed++;
        const today = new Date().toDateString();
        if (stats.lastPlayed === today) {
            // same day
        } else if (stats.lastPlayed === new Date(Date.now() - 86400000).toDateString()) {
            stats.streak++;
        } else {
            stats.streak = 1;
        }
        stats.lastPlayed = today;
        if (!stats.highScores[game] || numericScore > stats.highScores[game]) {
            stats.highScores[game] = numericScore;
        }
        this.save(stats);
        this.updateUI();
        this.checkAchievements(stats);
    },
    updateUI() {
        const stats = this.getStats();
        const el = (id) => document.getElementById(id);
        if (el('totalScoreDisplay')) animateNumber(el('totalScoreDisplay'), stats.totalScore);
        if (el('gamesPlayedDisplay')) animateNumber(el('gamesPlayedDisplay'), stats.gamesPlayed);
        if (el('streakDisplay')) el('streakDisplay').textContent = stats.streak;
        // Update high scores on cards
        document.querySelectorAll('.high-score').forEach(span => {
            const game = span.dataset.game;
            if (stats.highScores[game]) {
                span.textContent = stats.highScores[game];
            }
        });
        this.renderAchievements(stats);
    },
    checkAchievements(stats) {
        const defs = [
            { id: 'first_game', icon: '🎮', title: 'Pemain Pertama', desc: 'Mainkan game pertamamu', check: s => s.gamesPlayed >= 1 },
            { id: 'score_100', icon: '💯', title: 'Centurion', desc: 'Raih total 100 skor', check: s => s.totalScore >= 100 },
            { id: 'score_500', icon: '🌟', title: 'Bintang Bersinar', desc: 'Raih total 500 skor', check: s => s.totalScore >= 500 },
            { id: 'games_10', icon: '🏆', title: 'Veteran', desc: 'Mainkan 10 game', check: s => s.gamesPlayed >= 10 },
            { id: 'streak_3', icon: '🔥', title: 'On Fire!', desc: 'Streak 3 hari berturut', check: s => s.streak >= 3 },
            { id: 'score_1000', icon: '👑', title: 'Game Master', desc: 'Raih total 1000 skor', check: s => s.totalScore >= 1000 },
        ];
        defs.forEach(a => {
            if (!stats.achievements.includes(a.id) && a.check(stats)) {
                stats.achievements.push(a.id);
                this.save(stats);
                showToast(`🏅 Pencapaian Baru: ${a.title}!`);
            }
        });
    },
    renderAchievements(stats) {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        const defs = [
            { id: 'first_game', icon: '🎮', title: 'Pemain Pertama', desc: 'Mainkan game pertamamu' },
            { id: 'score_100', icon: '💯', title: 'Centurion', desc: 'Raih total 100 skor' },
            { id: 'score_500', icon: '🌟', title: 'Bintang Bersinar', desc: 'Raih total 500 skor' },
            { id: 'games_10', icon: '🏆', title: 'Veteran', desc: 'Mainkan 10 game' },
            { id: 'streak_3', icon: '🔥', title: 'On Fire!', desc: 'Streak 3 hari berturut' },
            { id: 'score_1000', icon: '👑', title: 'Game Master', desc: 'Raih total 1000 skor' },
        ];
        const unlocked = defs.filter(a => stats.achievements.includes(a.id));
        if (unlocked.length === 0) {
            container.innerHTML = '<div class="achievement-empty">Mainkan game untuk membuka pencapaian! 🎯</div>';
            return;
        }
        container.innerHTML = unlocked.map(a => `
            <div class="achievement-card">
                <div class="ach-icon">${a.icon}</div>
                <div class="ach-title">${a.title}</div>
                <div class="ach-desc">${a.desc}</div>
            </div>
        `).join('');
    }
};

function animateNumber(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) { el.textContent = target; return; }
    const diff = target - current;
    const duration = 600; // ms
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        el.textContent = Math.round(current + diff * progress);
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

// === TOAST SYSTEM ===
function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// === SEARCH ===
(function initSearch() {
    const input = document.getElementById('searchInput');
    const cards = document.querySelectorAll('.game-card');
    if (!input) return;

    input.addEventListener('input', function () {
        const q = this.value.toLowerCase().trim();
        cards.forEach(card => {
            const title = card.querySelector('.game-title').textContent.toLowerCase();
            const desc = card.querySelector('.game-desc').textContent.toLowerCase();
            if (title.includes(q) || desc.includes(q)) {
                card.classList.remove('hidden-card');
            } else {
                card.classList.add('hidden-card');
            }
        });
    });

    // Ctrl+K shortcut
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
})();


// === CATEGORY FILTERS ===
(function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.game-card');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const cat = btn.dataset.category;
            cards.forEach(card => {
                if (cat === 'all' || card.dataset.category === cat) {
                    card.classList.remove('hidden-card');
                } else {
                    card.classList.add('hidden-card');
                }
            });
        });
    });
})();


// === 3D TILT EFFECT & MOUSE TRACKING ===
(function initTilt() {
    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rx = ((y - cy) / cy) * -10;
            const ry = ((x - cx) / cx) * 10;
            card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px) scale(1.02)`;
            
            // Set CSS variables for gradient glow
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease';
            card.style.transform = '';
            setTimeout(() => card.style.transition = '', 500);
        });
    });
})();

// === NAVBAR SCROLL EFFECT ===
(function initNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(5,5,16,0.92)';
            nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)';
        } else {
            nav.style.background = 'rgba(5,5,16,0.7)';
            nav.style.boxShadow = 'none';
        }
    });
})();


// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    StatsManager.updateUI();
});

// Make StatsManager global for game pages
window.StatsManager = StatsManager;
