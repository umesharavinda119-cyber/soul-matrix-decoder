// =================================================================
// DOMContentLoaded - සම්පූර්ණයෙන් Load වූ පසු ක්‍රියාත්මක වීම
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. AUDIO ENGINE (Music & UI Soft Clicks) ---
    const audio = document.getElementById('bg-audio');
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    let isAudioPlaying = false;

    let audioCtx;
    function playClickSound() {
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime); 
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.warn("Audio Context Blocked by Browser.");
        }
    }

    document.addEventListener('click', (e) => {
        if(e.target.closest('button') || e.target.closest('.order-btn') || e.target.closest('.tab-btn')) {
            playClickSound();
        }
    });

    function playToneAudio() {
        try {
            if (audio && !isAudioPlaying) {
                audio.play().then(() => {
                    if (audioIcon) audioIcon.className = 'fa-solid fa-volume-high';
                    if (audioBtn) {
                        audioBtn.style.borderColor = 'var(--accent-purple)';
                        audioBtn.style.boxShadow = '0 0 15px var(--accent-purple)';
                    }
                    isAudioPlaying = true;
                }).catch(() => {});
            }
        } catch(e) {}
    }
    window.addEventListener('click', playToneAudio, { once: true });
    window.addEventListener('keypress', playToneAudio, { once: true });

    if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                if (audio.paused) {
                    audio.play(); 
                    if (audioIcon) audioIcon.className = 'fa-solid fa-volume-high'; 
                    audioBtn.style.borderColor = 'var(--accent-purple)'; 
                    audioBtn.style.boxShadow = '0 0 15px var(--accent-purple)'; 
                    isAudioPlaying = true;
                } else {
                    audio.pause(); 
                    if (audioIcon) audioIcon.className = 'fa-solid fa-volume-xmark'; 
                    audioBtn.style.borderColor = 'rgba(255,255,255,0.15)'; 
                    audioBtn.style.boxShadow = 'none'; 
                    isAudioPlaying = false;
                }
            } catch(e) {}
        });
    }

    // --- 2. CLOCK LOGIC ---
    setInterval(() => { 
        const clockEl = document.getElementById('clock-display');
        if(clockEl) clockEl.innerText = new Date().toLocaleTimeString(); 
    }, 1000);

    // --- 3. KEYBOARD ACCESSIBILITY ---
    const birthdateInput = document.getElementById('birthdate');
    const decodeBtn = document.getElementById('decode-btn');

    if (birthdateInput && decodeBtn) {
        birthdateInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { 
                e.preventDefault(); 
                decodeBtn.click(); 
            }
        });
    }
    
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'INPUT') { 
            e.target.click(); 
        }
    });

    // --- 4. LASER SCAN & DECODER LOGIC ---
    if (decodeBtn) {
        decodeBtn.addEventListener('click', () => {
            const dateVal = birthdateInput ? birthdateInput.value : null;
            if (!dateVal) { alert('කරුණාකර උපන් දිනය තෝරන්න!'); return; }
            
            playToneAudio();
            const inputGroup = document.getElementById('input-group');
            if(inputGroup) inputGroup.style.opacity = '0';
            
            const overlay = document.getElementById('scanner');
            const progText = document.getElementById('scan-prog');
            if(overlay) overlay.style.display = 'flex';
            
            let progress = 0;
            let interval = setInterval(() => {
                progress += 4; 
                if(progText) progText.innerText = progress + '%';
                if (progress >= 100) {
                    clearInterval(interval); 
                    if(overlay) overlay.style.display = 'none';
                    if(inputGroup) {
                        inputGroup.style.opacity = '1';
                        inputGroup.style.display = 'none'; 
                    }
                    renderTeaserResult(dateVal);

                    // Decode වූ පසු ජන්ම පත්‍ර සැකසීම Icon/Button එක Display කිරීම
                    const horoscopeAppWrapper = document.getElementById('horoscope-app-wrapper');
                    if (horoscopeAppWrapper) {
                        horoscopeAppWrapper.style.display = 'block';
                    }
                }
            }, 50);
        });
    }

    function renderTeaserResult(dateVal) {
        const digits = dateVal.replace(/-/g, '').split('').map(Number);
        let sum = digits.reduce((a, b) => a + b, 0);
        while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
            sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
        }
        
        const hooks = {
            1: "ඔබ රවිගේ බලපෑම හිමි නායකත්වයේ සහ ස්වාධීනත්වයේ ප්‍රබල කම්පනයක් සහිත ආත්මයකි.",
            2: "ඔබ සඳුගේ ශක්තිය හිමි අතිශය සංවේදී, අනුන්ගේ දුක හඳුනන මෘදු හදවතක් ඇති අයෙකි.",
            3: "ඔබ ගුරුගේ ශක්තියෙන් පෝෂණය වූ අධ්‍යාපන සහ උපදේශන ක්ෂේත්‍රයන්ට දක්ෂයෙකි.",
            4: "ඔබ රාහුගේ බලපෑම මත ඕනෑම අභියෝගයක් වෙනස්ම විදිහට ජයගන්නා ක්‍රමවත් අයෙකි.",
            5: "ඔබ බුධගේ ශක්තිය හිමි ව්‍යාපාරික දැනුම සහ වේගවත් සන්නිවේදන හැකියාව ඇති අයෙකි.",
            6: "ඔබ සිකුරුගේ ආකර්ෂණය සහ කලාත්මක බව හිමි සමාජයේ කැපී පෙනෙන චරිතයකි.",
            7: "ඔබ කේතුගේ බලපෑමෙන් යුත් ගැඹුරු අභ්‍යන්තර ඉවක් සහ ගුප්ත නුවණක් සහිත අයෙකි.",
            8: "ඔබ ශනිගේ කර්මජ පාලනය යටතේ දැවැන්ත කැපකිරීම් වලින් ඉහළටම යන ප්‍රබලයෙකි.",
            9: "ඔබ කුජගේ ගින්න හිමි නොසැලෙන ධෛර්යය සහ පරමාදර්ශී පෞරුෂයක් ඇති අයෙකි.",
            11: "ඔබ Master Energy (11) හිමි අතිශය දුර්ලභ, අධ්‍යාත්මික ඉවක් සහ බලයක් ඇති ආත්මයකි!",
            22: "ඔබ Master Builder (22) හිමි ලෝකය වෙනස් කිරීමේ හැකියාව ඇති අති ප්‍රබල ආත්මයකි!"
        };
        
        const resNum = document.getElementById('res-number');
        const resHook = document.getElementById('res-hook');
        const resBox = document.getElementById('result-box');
        
        if(resNum) resNum.innerText = sum;
        if(resHook) resHook.innerText = hooks[sum] || hooks[9];
        if(resBox) resBox.style.display = 'block';
    }

    // --- 5. TAB SWITCHING LOGIC ---
    const packageDetails = {
        'pkg-1': `<li><i class="fa-solid fa-check"></i> එක් ප්‍රධාන ගැටලුවකට පමණක් අංක විද්‍යාත්මක පිළිතුරු.</li><li><i class="fa-solid fa-check"></i> ජන්ම පත්‍රයේ පවතින ප්‍රධානම ග්‍රහ දෝෂය හඳුනා ගැනීම.</li><li class="note">මෙහිදි කලයුතු වත්පිළිවෙත් විස්තරාත්මක ලබා දීමක් සිදු නොවේ.</li>`,
        'pkg-2': `<li><i class="fa-solid fa-check"></i> 2026 වසර සඳහා පූර්ණ පලාපල සහ පවතින බාධක.</li><li><i class="fa-solid fa-check"></i> ඔබේ ජන්ම අංකයට අදාළ වාසනාවන්ත වර්ණ, අංක සහ මූලික ශාන්තිකර්ම.</li>`,
        'pkg-3': `<li><i class="fa-solid fa-fire"></i> ඔබේ ඡායාරූපය හරහා Aura (ප්‍රභා මණ්ඩල) පරීක්ෂාව.</li><li><i class="fa-solid fa-fire"></i> ඔබේ සැඟවුණු ක්වන්ටම් කේතය සහ ප්‍රාථමික සත්ව ආවේගය.</li><li><i class="fa-solid fa-fire"></i> වයස 35 න් පසු D9 නවාංශක පෙරළිය සහ කර්ම බාධක.</li><li><i class="fa-solid fa-fire"></i> පැළඳිය යුතු මැණික්, යන්ත්‍ර සහ ධන ආකර්ෂණ ප්‍රතිකර්ම.</li>`,
        'pkg-4': `<p style="font-size:0.85rem; font-weight:bold; margin-bottom:10px; color:#fbbf24;">('Soul Blueprint' වාර්තාවේ සියලුම සේවාවන් ඇතුළත් වේ)</p><li><i class="fa-solid fa-crown"></i> <b>Bhoomi Check:</b> භූමියේ/නිවසේ දෝෂ පරීක්ෂාව.</li><li><i class="fa-solid fa-crown"></i> <b>Family Check:</b> පවුලේ තවත් අයෙකුගේ පරීක්ෂාව (නොමිලේ).</li><li><i class="fa-solid fa-crown"></i> <b>Direct Access:</b> පෞද්ගලික ගැටලු 05 කට සෘජු විසඳුම් සහ පසු සහාය.</li>`
    };

    const viewPkgsBtn = document.getElementById('view-packages-btn');
    if (viewPkgsBtn) {
        viewPkgsBtn.addEventListener('click', () => {
            document.getElementById('initial-decoder').style.display = 'none';
            document.getElementById('main-tabs').style.display = 'flex';
            window.openTab('pkg-1', document.querySelectorAll('.tab-btn')[1]);
        });
    }

    // Window Object එකට සම්බන්ධ කිරීම
    window.openTab = function(tabId, btnElement) {
        const contents = document.querySelectorAll('.tab-content');
        contents.forEach(content => { if(content.id !== 'initial-decoder') content.style.display = 'none'; });
        
        const buttons = document.querySelectorAll('.tab-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        const selectedTab = document.getElementById(tabId);
        if(selectedTab) selectedTab.style.display = 'block';
        if(btnElement) btnElement.classList.add('active');

        const scrollWrapper = document.getElementById('master-scroll');
        const scrollClipper = document.querySelector('.scroll-clipper');
        const scrollContent = document.getElementById('scroll-content-list');

        if (packageDetails[tabId]) {
            if(scrollWrapper) scrollWrapper.style.display = 'block';
            if(scrollContent) scrollContent.innerHTML = packageDetails[tabId]; 
            
            if(scrollClipper) {
                scrollClipper.style.animation = 'none';
                scrollClipper.offsetHeight; 
                scrollClipper.style.animation = 'unrollSmooth 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
            }
        } else {
            if(scrollWrapper) scrollWrapper.style.display = 'none';
        }
    };

    window.goHome = function() {
        const contents = document.querySelectorAll('.tab-content');
        contents.forEach(c => c.style.display = 'none');
        
        const mainTabs = document.getElementById('main-tabs');
        if(mainTabs) mainTabs.style.display = 'none';
        
        const scrollWrapper = document.getElementById('master-scroll');
        if(scrollWrapper) scrollWrapper.style.display = 'none'; 
        
        const inputGrp = document.getElementById('input-group');
        if(inputGrp) {
            inputGrp.style.display = 'flex';
            inputGrp.style.opacity = '1';
        }
        
        const resBox = document.getElementById('result-box');
        if(resBox) resBox.style.display = 'none';
        
        const bDay = document.getElementById('birthdate');
        if(bDay) bDay.value = '';
        
        const initDecoder = document.getElementById('initial-decoder');
        if(initDecoder) initDecoder.style.display = 'block';
    };

    // --- 6. 3D HOVER EFFECT ---
    let mouseX = 0, mouseY = 0;
    const uniBg = document.getElementById('universe-bg');
    const calcCard = document.querySelector('.calc-card');

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.02;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.02;
        
        if (uniBg) uniBg.style.transform = `scale(1.08) translate(${mouseX * 0.4}px, ${mouseY * 0.4}px)`;
        if (calcCard) calcCard.style.transform = `perspective(1000px) rotateY(${mouseX * 0.8}deg) rotateX(${-mouseY * 0.8}deg)`;
    });

    // Close Horoscope Modal Event
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('horoscope-modal');
            if (modal) modal.style.display = 'none';
        });
    }

}); // End DOMContentLoaded

// --- 7. 3D HOROSCOPE RINGS ENGINE (FORCED INLINE OVERLAY ENGINE) ---
function open3DHoroscopeRings() {
    const modal = document.getElementById('horoscope-modal');
    if (modal) {
        // Dynamic Force Display & High Z-Index Styling
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        modal.style.backdropFilter = 'blur(10px)';
        modal.style.zIndex = '999999';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        const card = modal.querySelector('.horoscope-modal-card');
        if (card) {
            card.style.background = 'linear-gradient(135deg, #140f05, #05050c)';
            card.style.border = '2px solid #d4af37';
            card.style.borderRadius = '16px';
            card.style.padding = '30px';
            card.style.maxWidth = '850px';
            card.style.width = '90%';
            card.style.color = '#ffffff';
            card.style.textAlign = 'center';
            card.style.boxShadow = '0 0 50px rgba(245, 158, 11, 0.5)';
            card.style.position = 'relative';
        }

        initSingleRing('lagna-3d-canvas');
        initSingleRing('navamsha-3d-canvas');
    }
}
window.open3DHoroscopeRings = open3DHoroscopeRings; // Export to Global Window Scope

function initSingleRing(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(280, 280);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambLight);

    const goldLight = new THREE.PointLight(0xffd700, 3, 20);
    goldLight.position.set(2, 2, 4);
    scene.add(goldLight);

    const geometry = new THREE.TorusGeometry(1.8, 0.12, 16, 100);
    const material = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.9,
        roughness: 0.2,
    });
    const ringMesh = new THREE.Mesh(geometry, material);
    scene.add(ringMesh);

    function animate() {
        requestAnimationFrame(animate);
        ringMesh.rotation.z += 0.003;
        renderer.render(scene, camera);
    }
    animate();
}
