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
    const zodiacs = ['සිංහ ♌', 'කන්‍යා ♍', 'තුලා ♎', 'වෘශ්චික ♏', 'ධනු ♐', 'මකර ♑', 'කුම්භ පෙර පිළිතුරේදී කෝඩ් එක මැදින් කැඩී යාම නිසා සිදු වූ පැටලැවිල්ලට කණගාටුයි. 

එතනදී සිදු වුණේ **Soul Compatibility Matcher** එක සඳහා අකුරුවල අනුරූප සංඛ්‍යාත්මක අගයන් (Pythagorean Name Numerology: A=1, B=2 ... Z=8) පදනම් කරගෙන නම් දෙක අතර ඇති ආත්මීය කම්පන ගැළපීම (%) නිවැරදිවම ගණනය කරන **`getPythagoreanValue()`** ශ්‍රිතය එකතු කිරීමයි.

ඔබගේ **`js/cosmic-enhancements.js`** ෆයිල් එකේ ඇති පරණ කෝඩ් එක මකා, පහත දැක්වෙන සම්පූර්ණ කෝඩ් එක Paste කර සේව් (**Ctrl + S**) කරගන්න:

```javascript
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
    const zodiacs = ['සිංහ ♌', 'කන්‍යා ♍', 'තුලා ♎', 'වෘශ්චික ♏', 'ධනු ♐', 'මකර ♑', 'කුම්භ ♒', 'මීන