import * as THREE from 'three';

// ========================================
// CONSTANTES
// ========================================
const GRAVITY = 20;
const JUMP_FORCE = 12;
const MOVE_SPEED = 8;
const PLAYER_SIZE = 1;

// Couleurs par type de plateforme
const PLATFORM_COLORS = {
    start: 0x4CAF50,      // Vert
    normal: 0x6bcfff,     // Bleu clair
    'jump-intro': 0x9C27B0, // Violet
    'height-intro': 0xFF9800, // Orange
    rhythm: 0xE91E63,     // Rose
    goal: 0xFFD700        // Or
};

// ========================================
// DONNÉES DES NIVEAUX
// ========================================
const LEVELS = {
    tutorial: {
        name: "Tutoriel",
        platforms: [
            { x: 0,  y: 0, z: 0, w: 10, h: 1, d: 10, type: 'start' },
            { x: 12, y: 0, z: 0, w: 6,  h: 1, d: 6,  type: 'jump-intro' },
            { x: 20, y: 2, z: 0, w: 5,  h: 1, d: 5,  type: 'height-intro' },
            { x: 27, y: 2, z: 0, w: 3,  h: 1, d: 3,  type: 'rhythm' },
            { x: 32, y: 2, z: 0, w: 3,  h: 1, d: 3,  type: 'rhythm' },
            { x: 37, y: 2, z: 0, w: 3,  h: 1, d: 3,  type: 'rhythm' },
            { x: 42, y: 0, z: 0, w: 12, h: 1, d: 12, type: 'goal' }
        ],
        collectibles: [
            { x: 12, y: 2, z: 0 },
            { x: 20, y: 4, z: 0 },
            { x: 32, y: 4, z: 0 },
            { x: 42, y: 3, z: 0 }
        ],
        playerStart: { x: 0, y: 2, z: 0 },
        goal: { x: 42, y: 3, z: 0 }
    },

    level1: {
        name: "Niveau 1 - L'Escalier",
        platforms: [
            { x: 0,  y: 0, z: 0, w: 8, h: 1, d: 8, type: 'start' },
            { x: 10, y: 1, z: 0, w: 4, h: 1, d: 4, type: 'normal' },
            { x: 16, y: 2, z: 0, w: 4, h: 1, d: 4, type: 'normal' },
            { x: 22, y: 3, z: 0, w: 4, h: 1, d: 4, type: 'normal' },
            { x: 28, y: 4, z: 0, w: 4, h: 1, d: 4, type: 'normal' },
            { x: 34, y: 5, z: 0, w: 8, h: 1, d: 8, type: 'goal' }
        ],
        collectibles: [
            { x: 10, y: 3, z: 0 },
            { x: 16, y: 4, z: 0 },
            { x: 22, y: 5, z: 0 },
            { x: 28, y: 6, z: 0 },
            { x: 34, y: 7, z: 0 }
        ],
        playerStart: { x: 0, y: 2, z: 0 },
        goal: { x: 34, y: 7, z: 0 }
    },

    level2: {
        name: "Niveau 2 - Le Zigzag",
        platforms: [
            { x: 0,  y: 0, z: 0,  w: 6, h: 1, d: 6, type: 'start' },
            { x: 8,  y: 1, z: 1,  w: 3, h: 1, d: 3, type: 'normal' },
            { x: 13, y: 2, z: 0, w: 3, h: 1, d: 3, type: 'normal' },
            { x: 18, y: 3, z: -1,  w: 3, h: 1, d: 3, type: 'normal' },
            { x: 23, y: 4, z: 0, w: 3, h: 1, d: 3, type: 'normal' },
            { x: 28, y: 5, z: 0,  w: 8, h: 1, d: 8, type: 'goal' }
        ],
        collectibles: [
            { x: 8,  y: 3, z: 3 },
            { x: 13, y: 4, z: -2 },
            { x: 18, y: 5, z: 3 },
            { x: 23, y: 6, z: -2 }
        ],
        playerStart: { x: 0, y: 2, z: 0 },
        goal: { x: 28, y: 7, z: 0 }
    }
};

// Ordre des niveaux
const LEVEL_ORDER = ['tutorial', 'level1', 'level2'];

// ========================================
// VARIABLES GLOBALES
// ========================================
let scene, camera, renderer;
let player;
let platforms = [];
let collectibles = [];
let goalObject = null;
let keys = {};
let clock;
let score = 0;
let currentLevelIndex = 0;

// ========================================
// INITIALISATION
// ========================================
function init() {
    setupThreeJS();
    createPlayer();
    setupLights();
    setupControls();

    loadLevel(LEVEL_ORDER[0]);

    gameLoop();
}

// ========================================
// SETUP THREE.JS
// ========================================
function setupThreeJS() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    const material = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        roughness: 0.3,
        metalness: 0.5
    });

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
function createPlatform(x, y, z, w, h, d, type = 'normal') {
    const geometry = new THREE.BoxGeometry(w, h, d);

    // Couleur selon le type
    const color = PLATFORM_COLORS[type] || PLATFORM_COLORS.normal;

    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.2
    });

    const platform = new THREE.Mesh(geometry, material);

    platform.position.set(x, y, z);
    platform.receiveShadow = true;
    platform.castShadow = true;
    platform.userData.type = type;

    scene.add(platform);
    platforms.push(platform);

    return platform;
}

function createCollectible(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.8
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
    const geometry = new THREE.CylinderGeometry(1, 1, 3, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7
    });
    const goal = new THREE.Mesh(geometry, material);

    goal.position.set(x, y, z);
    goal.userData.isGoal = true;

    scene.add(goal);
    goalObject = goal;

    return goal;
}

// ========================================
// GESTION DE NIVEAU
// ========================================
function loadLevel(levelName) {
    clearLevel();

    const data = LEVELS[levelName];
    currentLevelIndex = LEVEL_ORDER.indexOf(levelName);
    score = 0;

    console.log('========================================');
    console.log('Chargement:', data.name);
    console.log('========================================');

    // Charger les plateformes avec leurs types
    data.platforms.forEach(p => {
        createPlatform(p.x, p.y, p.z, p.w, p.h, p.d, p.type);
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
}

function clearLevel() {
    // Retirer toutes les plateformes
    platforms.forEach(p => scene.remove(p));
    platforms = [];

    // Retirer tous les collectibles
    collectibles.forEach(c => scene.remove(c));
    collectibles = [];

    // Retirer l'objectif
    if (goalObject) {
        scene.remove(goalObject);
        goalObject = null;
    }
}

function nextLevel() {
    if (currentLevelIndex < LEVEL_ORDER.length - 1) {
        const nextLevelName = LEVEL_ORDER[currentLevelIndex + 1];
        console.log('Niveau suivant:', nextLevelName);

        // Petit délai avant de charger le niveau suivant
        setTimeout(() => {
            loadLevel(nextLevelName);
        }, 1000);
    } else {
        console.log('🎉 FÉLICITATIONS! Tous les niveaux terminés!');
        showVictoryScreen();
    }
}

function resetLevel() {
    const currentLevelName = LEVEL_ORDER[currentLevelIndex];
    loadLevel(currentLevelName);
}

function showVictoryScreen() {
    console.log('========================================');
    console.log('🏆 VICTOIRE TOTALE! 🏆');
    console.log('Score final:', score);
    console.log('========================================');

    // Ici, tu peux ajouter un écran de victoire HTML/CSS
    // ou redémarrer le jeu
    setTimeout(() => {
        currentLevelIndex = 0;
        loadLevel(LEVEL_ORDER[0]);
    }, 3000);
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
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
}

// ========================================
// CONTRÔLES
// ========================================
function setupControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;

        // Raccourci pour tester les niveaux
        if (e.code === 'Digit1') loadLevel('tutorial');
        if (e.code === 'Digit2') loadLevel('level1');
        if (e.code === 'Digit3') loadLevel('level2');
        if (e.code === 'KeyR') resetLevel();
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
}

function handleInput(dt) {
    if (keys['ArrowLeft'] || keys['KeyA'] || keys['KeyQ']) {
        player.velocity.x = -MOVE_SPEED;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velocity.x = MOVE_SPEED;
    } else {
        player.velocity.x *= 0.8;
    }

    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || keys['KeyZ']) && player.isGrounded && player.canJump) {
        player.velocity.y = JUMP_FORCE;
        player.isGrounded = false;
        player.canJump = false;
    }

    if (!keys['Space'] && !keys['ArrowUp'] && !keys['KeyW'] && !keys['KeyZ']) {
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

    // Vérifier collision avec l'objectif
    if (goalObject) {
        const distance = player.mesh.position.distanceTo(goalObject.position);

        if (distance < 2) {
            console.log('🎯 Objectif atteint!');
            nextLevel();
        }
    }

    // Respawn si chute
    if (player.mesh.position.y < -10) {
        console.log('💀 Chute! Redémarrage...');
        resetLevel();
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

            // Animation flottante (bobbing)
            item.position.y += Math.sin(Date.now() * 0.002) * 0.01;

            // Vérifier collision
            const distance = player.mesh.position.distanceTo(item.position);

            if (distance < 1) {
                item.userData.collected = true;
                item.visible = false;
                score += item.userData.value;
                console.log('⭐ Collectible! Score:', score);
            }
        }
    });
}

// ========================================
// UPDATE GOAL (Animation)
// ========================================
function updateGoal(dt) {
    if (goalObject) {
        goalObject.rotation.y += 1 * dt;
        goalObject.position.y += Math.sin(Date.now() * 0.001) * 0.005;
    }
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
    updateCollectibles(dt);
    updateGoal(dt);
    updateCamera();
}

function render() {
    renderer.render(scene, camera);
}

// ========================================
// DÉMARRAGE
// ========================================
init();

