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

        function animate() {
            requestAnimationFrame(animate);
            if (modelGroup) modelGroup.rotation.y += 0.008;
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

    if (triggerBtn && inputModal) {
        triggerBtn.addEventListener('click', () => inputModal.classList.add('active'));
    }
    if (closeInputBtn && inputModal) {
        closeInputBtn.addEventListener('click', () => inputModal.classList.remove('active'));
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
                }
            } catch (err) {
                console.error("API ERROR:", err);
            }
        });
    }
});

function renderNumerologyReport(data) {
    const reportModal = document.getElementById('numerology-report-modal');
    const reportContent = document.getElementById('num-report-content');
    if (!reportModal || !reportContent) return;

    // Filtered Output rendering logic will go here
    reportModal.style.display = 'flex';
}
