document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('zodiac-3d-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();

    // PERFECT 1:1 SQUARE ASPECT RATIO FIX
    const size = Math.min(canvas.clientWidth || 400, 400);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000); // 1:1 Aspect Ratio
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

    // GOOGLE STABLE DRACO DECODER CDN
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

    function animate() {
        requestAnimationFrame(animate);
        if (modelGroup) {
            modelGroup.rotation.z -= 0.008;
        }
        renderer.render(scene, camera);
    }
    animate();
});
