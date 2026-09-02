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

// 3. BACKGROUND MUSIC CONTROLLER & MULTI-COLOR WAVE VISUALIZER
function initAudioControls() {
    const audio = document.getElementById('bg-audio');
    const toggleBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    const visBars = document.querySelectorAll('.audio-vis-bar');

    if (!audio || !toggleBtn) return;

    audio.volume = 0.5; // Default volume 50%

    // Assign Multi-Colors and Staggered Animations to Bars
    const waveColors = ['#f59e0b', '#38bdf8', '#4ade80', '#a855f7', '#f43f5e']; // Gold, Cyan, Green, Purple, Red

    visBars.forEach((bar, index) => {
        bar.style.backgroundColor = waveColors[index % waveColors.length];
        bar.style.boxShadow = `0 0 10px ${waveColors[index % waveColors.length]}`;
        bar.style.animationDuration = `${0.4 + Math.random() * 0.5}s`; // Different speed for each bar
        bar.style.animationDelay = `${index * 0.15}s`; // Staggered start times
        bar.style.animationPlayState = 'paused';
    });

    // Inject Equalizer Keyframes
    if (!document.getElementById('eq-style-fix')) {
        const style = document.createElement('style');
        style.id = 'eq-style-fix';
        style.innerHTML = `
            @keyframes multiEqualizer {
                0% { height: 4px; opacity: 0.5; }
                100% { height: 20px; opacity: 1; filter: brightness(1.3); }
            }
        `;
        document.head.appendChild(style);
    }

    // Single central toggle logic
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (audio.paused) {
            audio.play().then(() => {
                if (audioIcon) {
                    audioIcon.classList.remove('fa-volume-xmark');
                    audioIcon.classList.add('fa-volume-high');
                }
                toggleBtn.style.borderColor = 'var(--accent-cyan)';
                toggleBtn.style.boxShadow = '0 0 15px var(--accent-cyan)';
                
                // Play animation
                visBars.forEach(bar => {
                    bar.style.animationName = 'multiEqualizer';
                    bar.style.animationIterationCount = 'infinite';
                    bar.style.animationDirection = 'alternate';
                    bar.style.animationTimingFunction = 'ease-in-out';
                    bar.style.animationPlayState = 'running';
                });
            }).catch(err => console.log("Audio play blocked by browser:", err));
        } else {
            audio.pause();
            if (audioIcon) {
                audioIcon.classList.remove('fa-volume-high');
                audioIcon.classList.add('fa-volume-xmark');
            }
            toggleBtn.style.borderColor = 'rgba(255,255,255,0.15)';
            toggleBtn.style.boxShadow = 'none';
            
            // Stop animation & reset height
            visBars.forEach(bar => {
                bar.style.animationPlayState = 'paused';
                bar.style.height = '4px'; 
            });
        }
    });

    // Auto-play attempt on first user interaction anywhere on the page
    window.addEventListener('click', () => {
        if (audio.paused && !toggleBtn.hasAttribute('data-user-muted')) {
            toggleBtn.click();
        }
    }, { once: true });
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
