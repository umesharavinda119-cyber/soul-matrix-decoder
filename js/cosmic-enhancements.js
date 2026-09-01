// =================================================================
// ULTIMATE COSMIC ENGINE (PLANETARY WIDGET, SHOCKWAVE, COMPATIBILITY & ALL)
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

        const sunEl = document.getElementById('planet-sun');
        const moonEl = document.getElementById('planet-moon');
        const jupiterEl = document.getElementById('planet-jupiter');

        if (sunEl) sunEl.textContent = `සූර්ය: ${zodiacs[sunIdx]}`;
        if (moonEl) moonEl.textContent = `චන්ද්‍ර: ${zodiacs[moonIdx]}`;
        if (jupiterEl) jupiterEl.textContent = `ගුරු: ${zodiacs[jupiterIdx]}`;
    }

    updatePlanets();
    setInterval(updatePlanets, 60000);
}

// 3. PYTHAGOREAN NUMEROLOGY MATCHING
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

// 4. ATTACH SOUNDS & EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    initPlanetaryWidget();

    document.querySelectorAll('button, input, select').forEach(el => {
        el.addEventListener('click', () => CosmicAudio.playClick());
        el.addEventListener('mouseenter', () => CosmicAudio.playHover());
    });
});
