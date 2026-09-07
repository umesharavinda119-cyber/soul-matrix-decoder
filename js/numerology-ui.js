document.addEventListener('DOMContentLoaded', () => {
    // =============================================================
    // 1. 3D WIDGET CANVAS (assets/Numerologylogo.glb)
    // =============================================================
    const canvas = document.getElementById('numerology-3d-canvas');
    if (canvas && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        const size = Math.min(canvas.clientWidth || 400, 400);

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(0, 0, 10);

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const dirLight = new THREE.DirectionalLight(0x06b6d4, 3.5);
        dirLight.position.set(3, 6, 8);
        scene.add(dirLight);

        const modelGroup = new THREE.Group();
        scene.add(modelGroup);

        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        gltfLoader.load(
            './assets/Numerologylogo.glb',
            (gltf) => {
                const loadedModel = gltf.scene;
                const box = new THREE.Box3().setFromObject(loadedModel);
                const center = box.getCenter(new THREE.Vector3());
                const modelSize = box.getSize(new THREE.Vector3());

                const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 1;
                const scale = 7.0 / maxDim;

                loadedModel.scale.set(scale, scale, scale);
                loadedModel.position.sub(center.multiplyScalar(scale));
                modelGroup.add(loadedModel);
            },
            undefined,
            (err) => console.error("NUMEROLOGY GLB LOAD ERROR:", err)
        );

        let time = 0;
        function animate() {
            requestAnimationFrame(animate);
            if (modelGroup) {
                time += 0.015;
                modelGroup.rotation.y = Math.sin(time) * 0.45; 
            }
            renderer.render(scene, camera);
        }
        animate();
    }

    // =============================================================
    // 2. MODAL CONTROLS & API FETCH
    // =============================================================
    const triggerBtn = document.getElementById('num-trigger-btn');
    const inputModal = document.getElementById('numerology-input-modal');
    const closeInputBtn = document.getElementById('close-num-input-btn');
    const numForm = document.getElementById('numerology-form');

    const wheelCard = document.getElementById('wheel-card');
    const numWrapper = document.getElementById('numerology-app-wrapper');
    const horoWrapper = document.getElementById('horoscope-app-wrapper');

    window.hideCenterAndSideWidgets = function() {
        if (wheelCard) { wheelCard.style.opacity = '0'; wheelCard.style.pointerEvents = 'none'; }
        if (numWrapper) { numWrapper.style.opacity = '0'; numWrapper.style.pointerEvents = 'none'; }
        if (horoWrapper) { horoWrapper.style.opacity = '0'; horoWrapper.style.pointerEvents = 'none'; }
    };

    window.restoreCenterAndSideWidgets = function() {
        if (wheelCard) { wheelCard.style.opacity = '1'; wheelCard.style.pointerEvents = 'all'; }
        if (numWrapper) { numWrapper.style.opacity = '1'; numWrapper.style.pointerEvents = 'all'; }
        if (horoWrapper) { horoWrapper.style.opacity = '1'; horoWrapper.style.pointerEvents = 'all'; }
    };

    if (triggerBtn && inputModal) {
        triggerBtn.addEventListener('click', () => {
            inputModal.classList.add('active');
            window.hideCenterAndSideWidgets();
        });
    }
    if (closeInputBtn && inputModal) {
        closeInputBtn.addEventListener('click', () => {
            inputModal.classList.remove('active');
            window.restoreCenterAndSideWidgets();
        });
    }

    if (numForm) {
        numForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameEn = document.getElementById('num-name-en').value;
            const nameSi = document.getElementById('num-name-si').value;
            const dob = document.getElementById('num-dob').value;

            if (!dob) return;
            const [year, month, day] = dob.split('-').map(Number);

            try {
                const res = await fetch('/api/numerology', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name_en: nameEn,
                        full_name_si: nameSi,
                        year, month, day
                    })
                });

                const result = await res.json();
                if (result.status === 'success') {
                    inputModal.classList.remove('active');
                    renderNumerologyReport(result.data);
                } else {
                    window.restoreCenterAndSideWidgets();
                }
            } catch (err) {
                console.error("API ERROR:", err);
                window.restoreCenterAndSideWidgets();
            }
        });
    }
});

// Close Report Modal and restore center card
function closeNumerologyReportModal() {
    const reportModal = document.getElementById('numerology-report-modal');
    if (reportModal) reportModal.style.display = 'none';
    if (typeof window.restoreCenterAndSideWidgets === 'function') {
        window.restoreCenterAndSideWidgets();
    }
}

// =============================================================
// 3. RESULT REPORT RENDERER & WHATSAPP REDIRECT
// =============================================================
function renderNumerologyReport(data) {
    const reportModal = document.getElementById('numerology-report-modal');
    const reportContent = document.getElementById('num-report-content');
    if (!reportModal || !reportContent) return;

    const planetMap = {
        1: { name: 'රවි', desc: 'නායකත්වය සහ පෞරුෂය', color: 'තැඹිලි / රතු', day: 'ඉරිදා' },
        2: { name: 'සඳු', desc: 'සංවේදීතාව සහ නිර්මාණශීලීත්වය', color: 'සුදු / රිදී', day: 'සඳුදා' },
        3: { name: 'ගුරු', desc: 'ඥානය සහ ගෞරවය', color: 'කහ / රන්වන්', day: 'බ්‍රහස්පතින්දා' },
        4: { name: 'රාහු', desc: 'තාක්ෂණය සහ තියුණු බුද්ධිය', color: 'දුම් අළු', day: 'සෙනසුරාදා' },
        5: { name: 'බුධ', desc: 'බුද්ධිය සහ සන්නිවේදනය', color: 'කොළ', day: 'බදාදා' },
        6: { name: 'සිකුරු', desc: 'කලාව සහ ආකර්ෂණය', color: 'සුදු / ලා නිල්', day: 'සික්රාදා' },
        7: { name: 'කේතු', desc: 'ආධ්‍යාත්මය සහ පර්යේෂණ', color: 'තද අළු / මෝස්තර', day: 'අඟහරුවාදා' },
        8: { name: 'ශනි', desc: 'කැපවීම සහ විනය', color: 'තද නිල් / කළු', day: 'සෙනසුරාදා' },
        9: { name: 'කුජ', desc: 'ශක්තිය සහ ධෛර්යය', color: 'රතු', day: 'අඟහරුවාදා' }
    };

    const careerMap = {
        1: 'ව්‍යාපාර කළමනාකරණය, රාජ්‍ය නායකත්ව තනතුරු',
        2: 'කලාව, උපදේශනය, මානසික සෞඛ්‍ය ක්ෂේත්‍ර',
        3: 'අධ්‍යාපනය, නීතිය, මූල්‍ය උපදේශනය',
        4: 'තොරතුරු තාක්ෂණය, ඉංජිනේරු, පර්යේෂණ',
        5: 'ව්‍යාපාර, සන්නිවේදනය, මාධ්‍ය සහ අලෙවිකරණය',
        6: 'සැලසුම් නිර්මාණය, විලාසිතා, ආගන්තුක සත්කාර',
        7: 'විද්‍යාත්මක පර්යේෂණ, දාර්ශනික/ආධ්‍යාත්මික ක්ෂේත්‍ර',
        8: 'ව්‍යාපාර සංවර්ධනය, ඉදිකිරීම්, විශාල ව්‍යාපෘති',
        9: 'ආරක්ෂක අංශ, ක්‍රීඩා, ඉංජිනේරු විද්‍යාව'
    };

    const expPlanet = planetMap[data.expression_number] || planetMap[5];
    const driverPlanet = planetMap[data.driver_number] || planetMap[1];

    const waPhone = "94757290085";
    const waText = encodeURIComponent(
        `මගේ අංක විද්‍යාත්මක වාර්තාවේ සම්පූර්ණ ප්‍රතිකර්ම ලබාගැනීමට අවශ්‍යයි.\n\n` +
        `• නම: ${data.full_name_en} (${data.full_name_si})\n` +
        `• උපන්දිනය: ${data.dob}\n` +
        `• Life Code: ${data.life_code}\n` +
        `• Driver / Lifepath: ${data.driver_number} / ${data.lifepath_number}`
    );
    const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

    const scorePercentage = Math.min(Math.round((data.total_points / 45) * 100), 100);

    reportContent.innerHTML = `
        <button class="num-close-btn" onclick="closeNumerologyReportModal()" style="position: absolute; top: 15px; right: 20px;">&times;</button>
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #06b6d4; font-family: 'Orbitron', sans-serif; font-size: 1.6rem; margin-bottom: 5px;">
                ${data.full_name_si || data.full_name_en}
            </h2>
            <p style="color: #9ca3af; font-size: 0.9rem; margin-bottom: 15px;">උපන්දිනය: ${data.dob}</p>
            <div style="display: inline-block; background: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; padding: 8px 20px; border-radius: 20px;">
                <span style="color: #fff; font-size: 0.85rem;">DIGIT LIFE CODE: </span>
                <strong style="color: #f59e0b; font-family: 'Orbitron', sans-serif; font-size: 1.1rem; letter-spacing: 2px;">${data.life_code}</strong>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin-bottom: 25px;">
            <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; border-left: 3px solid #06b6d4;">
                <h4 style="color: #06b6d4; margin-bottom: 8px; font-size: 0.95rem;">නාම කම්පනය (Name Vibration)</h4>
                <p style="color: #fff; font-size: 0.9rem; margin: 0;">
                    නාම අංකය: <strong style="color: #f59e0b;">${data.expression_number}</strong> - ${expPlanet.name} (${expPlanet.desc})
                </p>
            </div>

            <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; border-left: 3px solid #f59e0b;">
                <h4 style="color: #f59e0b; margin-bottom: 8px; font-size: 0.95rem;">මූලික අංක (Core Numbers)</h4>
                <p style="color: #fff; font-size: 0.9rem; margin: 0;">
                    ජීවන අංකය (Lifepath): <strong style="color: #06b6d4;">${data.lifepath_number}</strong> (${driverPlanet.desc})
                </p>
            </div>
        </div>

        <div style="background: rgba(255,255,255,0.02); padding: 18px; border-radius: 12px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.08);">
            <h4 style="color: #fff; font-size: 1rem; margin-bottom: 12px;">ක්ෂණික තොරතුරු (Quick Insights)</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px;">
                    <span style="color: #9ca3af; font-size: 0.75rem; display: block;">ශුභ වර්ණ</span>
                    <strong style="color: #4ade80; font-size: 0.85rem;">${driverPlanet.color}</strong>
                </div>
                <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px;">
                    <span style="color: #9ca3af; font-size: 0.75rem; display: block;">ශුභ දින</span>
                    <strong style="color: #06b6d4; font-size: 0.85rem;">${driverPlanet.day}</strong>
                </div>
                <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px;">
                    <span style="color: #9ca3af; font-size: 0.75rem; display: block;">ශුභ පළඳනා</span>
                    <strong style="color: #f59e0b; font-size: 0.85rem;">${data.gemstone_info.split('-')[0]}</strong>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <h4 style="color: #fff; font-size: 0.95rem; margin-bottom: 8px;">වෘත්තීය ගැළපීම (Career Profile)</h4>
            <p style="color: #d1d5db; font-size: 0.9rem; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin: 0;">
                🎯 ${careerMap[data.driver_number] || 'ව්‍යාපාර සහ කළමනාකරණ ක්ෂේත්‍ර'}
            </p>
        </div>

        <div style="margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #fff; font-size: 0.9rem;">නවග්‍රහ බල මට්ටම (Matrix Score)</span>
                <strong style="color: #06b6d4; font-size: 0.9rem;">${data.total_points} / 45 Points</strong>
            </div>
            <div style="width: 100%; background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
                <div style="width: ${scorePercentage}%; background: linear-gradient(90deg, #06b6d4, #f59e0b); height: 100%; border-radius: 5px;"></div>
            </div>
        </div>

        <div style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(245, 158, 11, 0.1)); border: 1px solid rgba(245, 158, 11, 0.4); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <p style="color: #f3f4f6; font-size: 0.92rem; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
                "ඔබේ නම සහ උපන්දිනය හුදු අහඹුවක් නොවේ; එය විශ්වය ඔබට ලබා දුන් අනන්‍ය ජීවන කේතයයි. ඉහතින් දිස්වන්නේ ඔබේ හැකියාවන්ගේ මතුපිට ස්වභාවය පමණි. නමුත් ඔබේ සාර්ථකත්වය ප්‍රමාද කරන නොපෙනෙන කර්ම බාධක, ඉදිරියේදී පැමිණෙන දශා හැරවුම් ලක්ෂ්‍යයන් සහ ඒ සියල්ල ජයගත හැකි ප්‍රබල ආධ්‍යාත්මික ප්‍රතිකර්ම තවමත් ඔබෙන් සැඟවී පවතී. ඔබේ ඉරණම වෙනස් කළ හැකි ඒ ගැඹුරු රහස්‍ය විශ්ලේෂණය දැන්ම විවෘත කරන්න."
            </p>
            <a href="${waUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #25D366, #128C7E); color: #fff; text-decoration: none; padding: 15px 20px; border-radius: 30px; font-family: 'Orbitron', sans-serif; font-weight: 800; font-size: 0.95rem; box-shadow: 0 0 25px rgba(37, 211, 102, 0.4); transition: transform 0.2s ease;">
                🔒 සම්පූර්ණ රහස්‍ය වාර්තාව සහ ප්‍රතිකර්ම අගුළු හරින්න (Unlock My Premium Report)
            </a>
        </div>
    `;

    reportModal.style.display = 'flex';
}
