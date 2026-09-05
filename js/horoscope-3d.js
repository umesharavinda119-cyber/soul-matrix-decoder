document.addEventListener('DOMContentLoaded', () => {
    // =============================================================
    // 1. HERO SIDE CANVAS (#zodiac-3d-canvas) - SRI YANTRA / STATUE
    // =============================================================
    const canvas = document.getElementById('zodiac-3d-canvas');
    if (canvas) {
        const scene = new THREE.Scene();
        const size = Math.min(canvas.clientWidth || 400, 400);

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(0, 0, 10);

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffb700, 3.2);
        mainLight.position.set(3, 6, 8);
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
        fillLight.position.set(-4, -4, 5);
        scene.add(fillLight);

        const modelGroup = new THREE.Group();
        scene.add(modelGroup);

        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        gltfLoader.load(
            './assets/zodiac-statue.glb',
            (gltf) => {
                const loadedModel = gltf.scene;

                loadedModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.side = THREE.DoubleSide;
                        if (child.material.metalness !== undefined) child.material.metalness = 0.85;
                        if (child.material.roughness !== undefined) child.material.roughness = 0.25;
                    }
                });

                const box = new THREE.Box3().setFromObject(loadedModel);
                const center = box.getCenter(new THREE.Vector3());
                const modelSize = box.getSize(new THREE.Vector3());

                const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 1;
                const scale = 7.5 / maxDim;

                loadedModel.scale.set(scale, scale, scale);
                loadedModel.position.sub(center.multiplyScalar(scale));

                modelGroup.add(loadedModel);
            },
            undefined,
            (error) => {
                console.error("GLB LOAD ERROR:", error);
            }
        );

        function animateHero() {
            requestAnimationFrame(animateHero);
            if (modelGroup) {
                modelGroup.rotation.z -= 0.008;
            }
            renderer.render(scene, camera);
        }
        animateHero();
    }

    // =============================================================
    // 2. MODAL DUAL 3D GOLD RINGS (#lagna-3d-canvas & #navamsha-3d-canvas)
    // =============================================================
    function createGoldRingScene(canvasId) {
        const ringCanvas = document.getElementById(canvasId);
        if (!ringCanvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(0, 0, 10);

        const renderer = new THREE.WebGLRenderer({ canvas: ringCanvas, alpha: true, antialias: true });
        renderer.setSize(340, 340);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xf59e0b, 3.8);
        sunLight.position.set(5, 5, 10);
        scene.add(sunLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
        rimLight.position.set(-5, -5, 5);
        scene.add(rimLight);

        // Sleek 0.18 Thin Torus Ring - Frames the outer edge without covering the inner blue border
        const geometry = new THREE.TorusGeometry(3.68, 0.18, 32, 100);
        const material = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.92,
            roughness: 0.18,
            emissive: 0x332200
        });
        const ringMesh = new THREE.Mesh(geometry, material);
        scene.add(ringMesh);

        function animateRing() {
            requestAnimationFrame(animateRing);
            ringMesh.rotation.z += 0.003;
            renderer.render(scene, camera);
        }
        animateRing();
    }

    createGoldRingScene('lagna-3d-canvas');
    createGoldRingScene('navamsha-3d-canvas');
});
