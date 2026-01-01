import * as THREE from 'three';

// ========================================
// CONSTANTES
// ========================================
const GRAVITY = 20;
const JUMP_FORCE = 12;
const MOVE_SPEED = 8;
const PLAYER_SIZE = 1;

// ========================================
// DONNÉES DES NIVEAUX
// ========================================
const LEVELS = {
    tutorial: {
        platforms: [
            { x: 0,  y: 0, z: 0, w: 8, h: 1, d: 8 },
            { x: 10, y: 0, z: 0, w: 6, h: 1, d: 6 },
            { x: 18, y: 2, z: 0, w: 4, h: 1, d: 4 },
            { x: 24, y: 4, z: 0, w: 6, h: 1, d: 6 }
        ],
        collectibles: [
            { x: 10, y: 2, z: 0 },
            { x: 18, y: 4, z: 0 },
            { x: 24, y: 6, z: 0 }
        ],
        playerStart: { x: 0, y: 2, z: 0 },
        goal: { x: 24, y: 6, z: 0 }
    }
};

// ========================================
// VARIABLES GLOBALES
// ========================================
let scene, camera, renderer;
let player;
let platforms = [];
let collectibles = [];
let keys = {};
let clock;
let score = 0;
let currentLevel = 'tutorial';

// ========================================
// INITIALISATION
// ========================================
function init() {
    setupThreeJS();
    createPlayer();
    setupLights();
    setupControls();

    loadLevel('tutorial');  // ← Charger le niveau initial

    gameLoop();
}

// ========================================
// SETUP THREE.JS
// ========================================
function setupThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ========================================
// CRÉER LE JOUEUR
// ========================================
function createPlayer() {
    const geometry = new THREE.BoxGeometry(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
    const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    scene.add(mesh);

    player = {
        mesh: mesh,
        velocity: new THREE.Vector3(0, 0, 0),
        isGrounded: false,
        canJump: true
    };
}

// ========================================
// FACTORIES (Création d'objets)
// ========================================
function createPlatform(x, y, z, w, h, d) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshStandardMaterial({ color: 0x6bcfff });
    const platform = new THREE.Mesh(geometry, material);

    platform.position.set(x, y, z);
    platform.receiveShadow = true;
    platform.castShadow = true;

    scene.add(platform);
    platforms.push(platform);

    return platform;
}

function createCollectible(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
    });
    const collectible = new THREE.Mesh(geometry, material);

    collectible.position.set(x, y, z);
    collectible.userData.collected = false;
    collectible.userData.value = 10;

    scene.add(collectible);
    collectibles.push(collectible);

    return collectible;
}

function createGoal(x, y, z) {
    const geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.3
    });
    const goal = new THREE.Mesh(geometry, material);

    goal.position.set(x, y, z);
    goal.userData.isGoal = true;

    scene.add(goal);

    return goal;
}

// ========================================
// GESTION DE NIVEAU
// ========================================
function loadLevel(levelName) {
    clearLevel();

    const data = LEVELS[levelName];
    currentLevel = levelName;
    score = 0;

    // Charger les plateformes
    data.platforms.forEach(p => {
        createPlatform(p.x, p.y, p.z, p.w, p.h, p.d);
    });

    // Charger les collectibles
    data.collectibles.forEach(c => {
        createCollectible(c.x, c.y, c.z);
    });

    // Positionner le joueur
    player.mesh.position.set(
        data.playerStart.x,
        data.playerStart.y,
        data.playerStart.z
    );
    player.velocity.set(0, 0, 0);

    // Créer l'objectif
    createGoal(data.goal.x, data.goal.y, data.goal.z);

    console.log('Niveau chargé:', levelName);
}

function clearLevel() {
    // Retirer toutes les plateformes
    platforms.forEach(p => scene.remove(p));
    platforms = [];

    // Retirer tous les collectibles
    collectibles.forEach(c => scene.remove(c));
    collectibles = [];
}

// ========================================
// ÉCLAIRAGE
// ========================================
function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
}

// ========================================
// CONTRÔLES
// ========================================
function setupControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
}

function handleInput(dt) {
    if (keys['ArrowLeft']) {
        player.velocity.x = -MOVE_SPEED;
    } else if (keys['ArrowRight']) {
        player.velocity.x = MOVE_SPEED;
    } else {
        player.velocity.x *= 0.8;
    }

    if (keys['Space'] && player.isGrounded && player.canJump) {
        player.velocity.y = JUMP_FORCE;
        player.isGrounded = false;
        player.canJump = false;
    }

    if (!keys['Space']) {
        player.canJump = true;
    }
}

// ========================================
// PHYSIQUE
// ========================================
function applyPhysics(dt) {
    player.velocity.y -= GRAVITY * dt;

    player.mesh.position.x += player.velocity.x * dt;
    player.mesh.position.y += player.velocity.y * dt;
    player.mesh.position.z += player.velocity.z * dt;

    if (player.velocity.y < -50) {
        player.velocity.y = -50;
    }
}

// ========================================
// COLLISIONS
// ========================================
function checkCollisions() {
    player.isGrounded = false;

    const playerBox = new THREE.Box3().setFromObject(player.mesh);

    platforms.forEach(platform => {
        const platformBox = new THREE.Box3().setFromObject(platform);

        if (playerBox.intersectsBox(platformBox)) {
            if (player.velocity.y < 0) {
                player.mesh.position.y = platformBox.max.y + PLAYER_SIZE / 2;
                player.velocity.y = 0;
                player.isGrounded = true;
            }
        }
    });

    if (player.mesh.position.y < -10) {
        loadLevel(currentLevel);  // ← Recharger le niveau
    }
}

// ========================================
// UPDATE COLLECTIBLES
// ========================================
function updateCollectibles(dt) {
    collectibles.forEach(item => {
        if (!item.userData.collected) {
            // Animation rotation
            item.rotation.y += 2 * dt;

            // Vérifier collision
            const distance = player.mesh.position.distanceTo(item.position);

            if (distance < 1) {
                item.userData.collected = true;
                item.visible = false;
                score += item.userData.value;
                console.log('Score:', score);
            }
        }
    });
}

// ========================================
// CAMÉRA
// ========================================
function updateCamera() {
    const targetPosition = new THREE.Vector3(
        player.mesh.position.x,
        player.mesh.position.y + 5,
        player.mesh.position.z + 10
    );

    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(player.mesh.position);
}

// ========================================
// GAME LOOP
// ========================================
function gameLoop() {
    requestAnimationFrame(gameLoop);

    const deltaTime = clock.getDelta();

    update(deltaTime);
    render();
}

function update(dt) {
    handleInput(dt);
    applyPhysics(dt);
    checkCollisions();
    updateCollectibles(dt);  // ← Nouvelle fonction
    updateCamera();
}

function render() {
    renderer.render(scene, camera);
}

// ========================================
// DÉMARRAGE
// ========================================
init();