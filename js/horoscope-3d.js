document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('zodiac-3d-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 460 / 400, 0.1, 1000);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(460, 400);
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
    modelGroup.rotation.set(0, 0, 0); 
    scene.add(modelGroup);

    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('[https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/](https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/)');

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
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z) || 1;
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
