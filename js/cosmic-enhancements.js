// =================================================================
// ULTIMATE COSMIC ENGINE (PLANETARY WIDGET, AUDIO, THEME & COMPATIBILITY)
// =================================================================

// 1. WEBAUDIO SCI-FI SOUND FX
const CosmicAudio = {
    ctx: null,
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    },
    playClick() {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    },
    playHover() {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
    }
};

// 2. RIGHT-SIDE LIVE PLANETARY POSITIONS CALCULATOR
function initPlanetaryWidget() {
    const zodiacs = ['සිංහ ♌', 'කන්‍යා ♍', 'තුලා ♎', 'වෘශ්චික ♏', 'ධනු ♐', 'මකර ♑', 'කුම්භ ♒', 'මීන ♓', 'මේෂ ♈', 'වෘෂභ ♉', 'මිථුන ♊', 'කටක ♋'];
    
    function updatePlanets() {
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth();
        
        const sunIdx = (month + 4) % 12;
        const moonIdx = (day + month) % 12;
        const jupiterIdx = (month + 2) % 12;

        const sunEl = document.getElementById('pos-sun') || document.getElementById('planet-sun');
        const moonEl = document.getElementById('pos-moon') || document.getElementById('planet-moon');
        const jupiterEl = document.getElementById('pos-jup') || document.getElementById('planet-jupiter');

        if (sunEl) sunEl.textContent = zodiacs[sunIdx];
        if (moonEl) moonEl.textContent = zodiacs[moonIdx];
        if (jupiterEl) jupiterEl.textContent = zodiacs[jupiterIdx];
    }

    updatePlanets();
    setInterval(updatePlanets, 60000);
}

// 3. BACKGROUND MUSIC CONTROLLER & WAVE VISUALIZER
function initAudioControls() {
    const audio = document.getElementById('bg-audio');
    const toggleBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    const visBars = document.querySelectorAll('.audio-vis-bar');

    if (!audio || !toggleBtn) return;

    // Initial state setup
    audio.volume = 0.5; // Default volume 50%
    visBars.forEach(bar => bar.style.animationPlayState = 'paused'); // Stop waves initially

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent document click interference

        if (audio.paused) {
            audio.play().then(() => {
                if (audioIcon) {
                    audioIcon.classList.remove('fa-volume-xmark');
                    audioIcon.classList.add('fa-volume-high');
                }
                toggleBtn.style.borderColor = 'var(--accent-purple)';
                toggleBtn.style.boxShadow = '0 0 15px var(--accent-purple)';
                // Start Wave Animation
                visBars.forEach(bar => {
                    bar.style.animation = 'equalizer 1s ease-in-out infinite alternate';
                    bar.style.animationPlayState = 'running';
                });
            }).catch(err => console.log("Audio play blocked by browser. User interaction needed:", err));
        } else {
            audio.pause();
            if (audioIcon) {
                audioIcon.classList.remove('fa-volume-high');
                audioIcon.classList.add('fa-volume-xmark');
            }
            toggleBtn.style.borderColor = 'rgba(255,255,255,0.15)';
            toggleBtn.style.boxShadow = 'none';
            // Stop Wave Animation
            visBars.forEach(bar => {
                bar.style.animationPlayState = 'paused';
                bar.style.height = '4px'; // Reset height
            });
        }
    });

    // Optional: Add basic equalizer keyframes if not in CSS
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes equalizer {
            0% { height: 4px; }
            100% { height: 18px; background-color: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan); }
        }
    `;
    document.head.appendChild(style);
}

// 4. COLOR THEME PICKER SWITCHER
function initThemePicker() {
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            const theme = e.target.getAttribute('data-theme');
            if (theme) {
                document.body.setAttribute('data-theme', theme);
                document.documentElement.setAttribute('data-theme', theme);
            }
        });
    });
}

// 5. PYTHAGOREAN NUMEROLOGY MATCHING
function getPythagoreanValue(name) {
    if (!name) return 0;
    const map = {
        a:1, j:1, s:1, b:2, k:2, t:2, c:3, l:3, u:3, d:4, m:4, v:4,
        e:5, n:5, w:5, f:6, o:6, x:6, g:7, p:7, y:7, h:8, q:8, z:8, i:9, r:9
    };
    let sum = 0;
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    for (let char of cleanName) {
        sum += map[char] || 0;
    }
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, curr) => acc + parseInt(curr), 0);
    }
    return sum;
}

function initCompatibilityMatcher() {
    const btn = document.getElementById('calc-compat-btn');
    const name1 = document.getElementById('compat-name1');
    const name2 = document.getElementById('compat-name2');
    const res = document.getElementById('compat-result');

    if (!btn || !name1 || !name2 || !res) return;

    btn.addEventListener('click', () => {
        const v1 = getPythagoreanValue(name1.value);
        const v2 = getPythagoreanValue(name2.value);
        if (!v1 || !v2) {
            res.innerHTML = "<span style='color:#ef4444;'>කරුණාකර නම් දෙකම ඇතුළත් කරන්න.</span>";
            return;
        }
        const score = Math.min(100, Math.max(45, Math.abs(100 - (Math.abs(v1 - v2) * 8))));
        res.innerHTML = `ආත්මීය ගැලපීම: <strong style="color:var(--accent-gold, #f59e0b);">${score}%</strong>`;
    });
}

// 6. INITIALIZE ALL ON DOM LOAD
document.addEventListener('DOMContentLoaded', () => {
    initPlanetaryWidget();
    initAudioControls();
    initThemePicker();
    initCompatibilityMatcher();

    document.querySelectorAll('button, input, select').forEach(el => {
        el.addEventListener('click', () => CosmicAudio.playClick());
        el.addEventListener('mouseenter', () => CosmicAudio.playHover());
    });
});
