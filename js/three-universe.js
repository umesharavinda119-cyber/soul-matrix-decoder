// =================================================================
// THREE.JS - REALISTIC ORBITING PLANETS, FLOATING NUMBERS & GLOWING DUST
// =================================================================
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
camera.position.set(0, 15, 100);
camera.lookAt(0, 0, 0);

// CINEMATIC LIGHTING
const ambientLight = new THREE.AmbientLight(0x111122, 0.4); 
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffeedd, 3.5); 
sunLight.position.set(80, 40, 20);
scene.add(sunLight);

// HIGH-RES PROCEDURAL PLANET TEXTURES
function createPlanetTexture(type) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');
    
    if (type === 'gas_giant') {
        for (let y = 0; y < 512; y++) {
            let v = Math.sin(y * 0.04 + Math.sin(y * 0.01) * 6) * 0.5 + 0.5;
            v += (Math.random() - 0.5) * 0.15; 
            ctx.fillStyle = `rgb(${Math.floor(210 + v*30)}, ${Math.floor(160 + v*40)}, ${Math.floor(100 + v*20)})`;
            ctx.fillRect(0, y, 1024, 1);
        }
    } else if (type === 'ice') {
        ctx.fillStyle = '#011c40'; ctx.fillRect(0,0,1024,512);
        for(let i=0; i<1500; i++) {
            ctx.fillStyle = `rgba(100, 200, 255, ${Math.random()*0.05})`;
            ctx.beginPath(); 
            ctx.arc(Math.random()*1024, Math.random()*512, Math.random()*60 + 10, 0, Math.PI*2); 
            ctx.fill();
        }
    } else { 
        ctx.fillStyle = '#5c1414'; ctx.fillRect(0,0,1024,512);
        for(let i=0; i<3000; i++) {
            ctx.fillStyle = `rgba(30, 0, 0, ${Math.random()*0.15})`;
            ctx.beginPath(); 
            ctx.arc(Math.random()*1024, Math.random()*512, Math.random()*15, 0, Math.PI*2); 
            ctx.fill();
            ctx.fillStyle = `rgba(200, 100, 20, ${Math.random()*0.1})`;
            ctx.beginPath(); 
            ctx.arc(Math.random()*1024, Math.random()*512, Math.random()*30, 0, Math.PI*2); 
            ctx.fill();
        }
    }
    const texture = new THREE.CanvasTexture(c);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

// PROCEDURAL REALISTIC RINGS
function createRingTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 1;
    const ctx = c.getContext('2d');
    for(let x=0; x<512; x++) {
        let alpha = Math.random() > 0.4 ? Math.random() * 0.8 : 0;
        ctx.fillStyle = `rgba(200, 160, 100, ${alpha})`;
        ctx.fillRect(x, 0, 1, 1);
    }
    return new THREE.CanvasTexture(c);
}

// PLANET DATA
const planets = [];
const planetData = [
    { r: 2.8, dist: 35, speed: 0.005, type: 'mars', atmColor: 0xff3300, roughness: 0.9 },
    { r: 6.0, dist: 60, speed: 0.002, type: 'gas_giant', atmColor: 0xffaa44, roughness: 0.4, ring: true },
    { r: 4.0, dist: 85, speed: 0.0015, type: 'ice', atmColor: 0x0088ff, roughness: 0.6 }
];

planetData.forEach(pd => {
    const group = new THREE.Group();
    scene.add(group);

    const pathGeo = new THREE.BufferGeometry();
    const pts = [];
    for(let i=0; i<=90; i++) {
        let a = (i/90)*Math.PI*2;
        pts.push(new THREE.Vector3(Math.cos(a)*pd.dist, 0, Math.sin(a)*pd.dist));
    }
    pathGeo.setFromPoints(pts);
    group.add(new THREE.Line(pathGeo, new THREE.LineBasicMaterial({color: 0xffffff, transparent:true, opacity:0.08})));

    const tex = createPlanetTexture(pd.type);
    const mat = new THREE.MeshStandardMaterial({ 
        map: tex, 
        roughness: pd.roughness, 
        metalness: 0.1,
        bumpMap: tex,      
        bumpScale: 0.05    
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(pd.r, 64, 64), mat); 
    mesh.position.x = pd.dist;
    
    const atmMat = new THREE.MeshLambertMaterial({ 
        color: pd.atmColor, 
        transparent: true, 
        opacity: 0.25, 
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const atmMesh = new THREE.Mesh(new THREE.SphereGeometry(pd.r * 1.1, 64, 64), atmMat);
    mesh.add(atmMesh);

    if (pd.ring) {
        const ringTex = createRingTexture();
        const rGeo = new THREE.RingGeometry(pd.r + 2.5, pd.r + 9, 64);
        const pos = rGeo.attributes.position;
        const v3 = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++){
            v3.fromBufferAttribute(pos, i);
            rGeo.attributes.uv.setXY(i, v3.length() < (pd.r + 5) ? 0 : 1, 1);
        }
        const rMat = new THREE.MeshBasicMaterial({ 
            map: ringTex, 
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const ring = new THREE.Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 1.8;
        mesh.add(ring);
    }

    group.add(mesh);
    group.rotation.x = Math.PI * 0.12;
    group.rotation.z = Math.PI * 0.03;

    planets.push({ group, mesh, speed: pd.speed });
});

// =================================================================
// PROCEDURAL SOFT GLOW TEXTURE 
// =================================================================
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');     
    gradient.addColorStop(0.2, 'rgba(168, 85, 247, 0.8)');  
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');           
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

// Glowing Soft Ambient Dust
const dustGeo = new THREE.BufferGeometry();
const dustCount = 800;
const dustPos = new Float32Array(dustCount * 3);
for(let i=0; i<dustCount*3; i++) {
    dustPos[i] = (Math.random() - 0.5) * 400;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustTex = createParticleTexture(); 
const dustMat = new THREE.PointsMaterial({ 
    size: 2.5, 
    map: dustTex, 
    transparent: true, 
    opacity: 0.7,
    blending: THREE.AdditiveBlending, 
    depthWrite: false 
});
const dustField = new THREE.Points(dustGeo, dustMat);
scene.add(dustField);

// 3D Floating Numerology Sprites
function createTextSprite(text, colorStr) {
    const canvasText = document.createElement('canvas');
    canvasText.width = 128; canvasText.height = 128;
    const ctxText = canvasText.getContext('2d');
    ctxText.fillStyle = colorStr; ctxText.font = 'Bold 60px Cinzel, serif';
    ctxText.textAlign = 'center'; ctxText.textBaseline = 'middle';
    ctxText.shadowColor = colorStr; ctxText.shadowBlur = 20;
    ctxText.fillText(text, 64, 64);
    const texture = new THREE.CanvasTexture(canvasText);
    const spriteMat = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true, 
        opacity: 0.8,
        blending: THREE.AdditiveBlending, 
        depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(8, 8, 1);
    return sprite;
}

const numList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22'];
const numSprites = [];
for (let i = 0; i < 35; i++) {
    let numChar = numList[Math.floor(Math.random() * numList.length)];
    let col = Math.random() > 0.5 ? '#06b6d4' : '#a855f7';
    let sprite = createTextSprite(numChar, col);
    sprite.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150);
    scene.add(sprite);
    numSprites.push({ sprite: sprite, speedZ: Math.random() * 0.1 + 0.02 });
}

// Mouse Interactivity
let mouseX = 0, mouseY = 0;
const uniBg = document.getElementById('universe-bg');

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.02;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.02;
    
    if (uniBg) uniBg.style.transform = `scale(1.08) translate(${mouseX * 0.4}px, ${mouseY * 0.4}px)`;
    // Scroll move වෙන එක මෙතනින් ඉවත් කර ඇත
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);

    planets.forEach(p => {
        p.group.rotation.y += p.speed;
        p.mesh.rotation.y += 0.005; 
    });

    dustField.rotation.y += 0.0005;

    numSprites.forEach(n => {
        n.sprite.position.z += n.speedZ;
        if (n.sprite.position.z > 80) n.sprite.position.z = -100;
    });

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}
animate();