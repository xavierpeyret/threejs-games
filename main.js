import './style.scss';
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
        movingPlatforms: [
            { x: 8, y: 1, z: 0, w: 4, h: 1, d: 4, type: 'horizontal', speed: 1, range: 3 },
            { x: 16, y: 1, z: 0, w: 4, h: 1, d: 4, type: 'vertical', speed: 1.5, range: 2 },
            { x: 24, y: 2, z: 0, w: 4, h: 1, d: 4, type: 'circular', speed: 0.8, range: 3 }
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
let movingPlatforms = [];
let collectibles = [];
let goalObject = null;
let keys = {};
let clock;
let score = 0;
let currentLevelIndex = 0;
let totalCollectibles = 0;
let collectedCount = 0;
let debugFrameCount = 0;
let debugMode = false; // Activer/désactiver avec la touche 'D'

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

function createMovingPlatform(x, y, z, w, h, d, config) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshStandardMaterial({
        color: 0xff6b9d,  // Rose pour identifier
        roughness: 0.7,
        metalness: 0.3
    });

    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(x, y, z);
    platform.receiveShadow = true;
    platform.castShadow = true;

    // Données pour le mouvement
    platform.userData = {
        isMoving: true,
        type: config.type || 'horizontal',
        speed: config.speed || 2,
        range: config.range || 5,
        startPos: new THREE.Vector3(x, y, z),
        direction: 1,  // 1 ou -1
        time: 0
    };

    scene.add(platform);
    platforms.push(platform);
    movingPlatforms.push(platform);

    return platform;
}

// ========================================
// GESTION DE NIVEAU
// ========================================
function loadLevel(levelName) {
    clearLevel();

    const data = LEVELS[levelName];
    currentLevelIndex = LEVEL_ORDER.indexOf(levelName);

    // Reset score et compteurs
    score = 0;
    collectedCount = 0;
    totalCollectibles = data.collectibles.length;

    console.log('========================================');
    console.log('Chargement:', data.name);
    console.log('========================================');

    // Charger les plateformes avec leurs types
    data.platforms.forEach(p => {
        createPlatform(p.x, p.y, p.z, p.w, p.h, p.d, p.type);
    });

    // Charger les plateformes mobiles
    if (data.movingPlatforms) {
        data.movingPlatforms.forEach(p => {
            createMovingPlatform(p.x, p.y, p.z, p.w, p.h, p.d, {
                type: p.type,
                speed: p.speed,
                range: p.range
            });
        });
    }

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

    // Mettre à jour le HUD
    updateHUD();
}

function clearLevel() {
    // Retirer toutes les plateformes
    platforms.forEach(p => scene.remove(p));
    platforms = [];
    movingPlatforms = [];

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
// UPDATE HUD
// ========================================
function updateHUD() {
    // Mettre à jour le score
    document.getElementById('score-value').textContent = score;

    // Mettre à jour les collectibles
    document.getElementById('collectibles-value').textContent =
        `${collectedCount} / ${totalCollectibles}`;

    // Mettre à jour le nom du niveau
    const levelData = LEVELS[LEVEL_ORDER[currentLevelIndex]];
    if (levelData && levelData.name) {
        document.getElementById('level-name').querySelector('h2').textContent =
            levelData.name;
    }
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

        // Toggle debug mode avec la touche 'P'
        if (e.code === 'KeyP') {
            debugMode = !debugMode;
            console.log('🐛 [DEBUG MODE]', debugMode ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌');
        }
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
        // DÉTACHER du parent avant de sauter
        if (player.mesh.parent !== scene) {
            console.log('🚀 [JUMP] Détachement avant saut');
            const worldPos = new THREE.Vector3();
            player.mesh.getWorldPosition(worldPos);
            console.log('🚀 [JUMP] Position mondiale avant détachement:', worldPos.toArray().map(v => v.toFixed(2)));

            scene.attach(player.mesh);

            const worldPosAfter = new THREE.Vector3();
            player.mesh.getWorldPosition(worldPosAfter);
            console.log('🚀 [JUMP] Position mondiale après détachement:', worldPosAfter.toArray().map(v => v.toFixed(2)));
            console.log('🚀 [JUMP] Position locale après détachement:', player.mesh.position.toArray().map(v => v.toFixed(2)));
        }

        player.velocity.y = JUMP_FORCE;
        player.isGrounded = false;
        player.canJump = false;
        console.log('🚀 [JUMP] Saut! Velocity.y =', JUMP_FORCE);
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
    let standingOnPlatform = null;

    const playerBox = new THREE.Box3().setFromObject(player.mesh);
    const playerWorldPos = new THREE.Vector3();
    player.mesh.getWorldPosition(playerWorldPos);

    platforms.forEach(platform => {
        const platformBox = new THREE.Box3().setFromObject(platform);

        if (playerBox.intersectsBox(platformBox)) {
            if (player.velocity.y < 0) {
                // Vérifier si le joueur est bien au-dessus de la plateforme (horizontalement)
                let isAbovePlatform = false;

                // Si le joueur est attaché à cette plateforme, vérifier en coordonnées locales
                if (player.mesh.parent === platform) {
                    const platformWidth = platform.geometry.parameters.width;
                    const platformDepth = platform.geometry.parameters.depth;
                    const localPos = player.mesh.position;

                    isAbovePlatform =
                        localPos.x >= -platformWidth / 2 &&
                        localPos.x <= platformWidth / 2 &&
                        localPos.z >= -platformDepth / 2 &&
                        localPos.z <= platformDepth / 2;

                    if (debugMode && !isAbovePlatform) {
                        console.log('⚠️ [SKIP] Joueur hors limites locales');
                        console.log('  Local X:', localPos.x.toFixed(2), '| Limites: [', (-platformWidth/2).toFixed(2), ',', (platformWidth/2).toFixed(2), ']');
                        console.log('  Local Z:', localPos.z.toFixed(2), '| Limites: [', (-platformDepth/2).toFixed(2), ',', (platformDepth/2).toFixed(2), ']');
                    }
                } else {
                    // Sinon vérifier en coordonnées mondiales
                    isAbovePlatform =
                        playerWorldPos.x >= platformBox.min.x &&
                        playerWorldPos.x <= platformBox.max.x &&
                        playerWorldPos.z >= platformBox.min.z &&
                        playerWorldPos.z <= platformBox.max.z;
                }

                // Ne considérer comme grounded que si au-dessus horizontalement
                if (!isAbovePlatform) {
                    if (debugMode && player.mesh.parent !== platform) {
                        console.log('⚠️ [SKIP] Collision ignorée : joueur pas au-dessus de la plateforme');
                    }
                    return; // Ignorer cette plateforme
                }

                player.velocity.y = 0;
                player.isGrounded = true;

                // Retenir sur quelle plateforme on est
                standingOnPlatform = platform;

                // Debug: position avant manipulation
                if (debugMode) {
                    const worldPosBefore = new THREE.Vector3();
                    player.mesh.getWorldPosition(worldPosBefore);
                    console.log('🔍 [COLLISION] Position mondiale avant:', worldPosBefore.toArray().map(v => v.toFixed(2)));
                    console.log('🔍 [COLLISION] Parent actuel:', player.mesh.parent === scene ? 'SCENE' : 'PLATFORM');
                }

                // SI plateforme mobile ET pas encore attaché → attacher (une seule fois)
                if (platform.userData.isMoving && player.mesh.parent !== platform) {
                    // Le joueur n'est pas encore attaché à cette plateforme
                    if (debugMode) {
                        console.log('📎 [ATTACH] Premier attachement à plateforme mobile type:', platform.userData.type);
                    }

                    // S'assurer que le joueur est dans la scène avant de positionner
                    if (player.mesh.parent !== scene) {
                        scene.attach(player.mesh);
                    }

                    // Positionner en coordonnées mondiales
                    const targetY = platformBox.max.y + PLAYER_SIZE / 2;
                    player.mesh.position.y = targetY;

                    if (debugMode) {
                        const worldPosBeforeAttach = new THREE.Vector3();
                        player.mesh.getWorldPosition(worldPosBeforeAttach);
                        console.log('📎 [ATTACH] Position mondiale avant attach:', worldPosBeforeAttach.toArray().map(v => v.toFixed(2)));
                    }

                    // Attacher à la plateforme (préserve la position mondiale)
                    platform.attach(player.mesh);

                    if (debugMode) {
                        const worldPosAfterAttach = new THREE.Vector3();
                        player.mesh.getWorldPosition(worldPosAfterAttach);
                        console.log('📎 [ATTACH] Position mondiale après attach:', worldPosAfterAttach.toArray().map(v => v.toFixed(2)));
                        console.log('📎 [ATTACH] Position locale après attach:', player.mesh.position.toArray().map(v => v.toFixed(2)));
                    }
                } else if (player.mesh.parent === platform) {
                    // Déjà attaché à cette plateforme : juste ajuster la position locale Y
                    // Calculer la position locale Y correcte
                    const platformHeight = platform.geometry.parameters.height;
                    const localY = platformHeight / 2 + PLAYER_SIZE / 2;
                    player.mesh.position.y = localY;

                    if (debugMode) {
                        console.log('🔧 [ADJUST] Ajustement position locale Y:', localY.toFixed(2));
                    }
                } else {
                    // Plateforme normale (non mobile)
                    const targetY = platformBox.max.y + PLAYER_SIZE / 2;
                    if (debugMode) console.log('🎯 [POSITION] Y cible:', targetY.toFixed(2), '| Y plateforme:', platformBox.max.y.toFixed(2));
                    player.mesh.position.y = targetY;
                }
            }
        }
    });

    // Détacher du parent si on n'est plus sur aucune plateforme
    if (!standingOnPlatform && player.mesh.parent !== scene) {
        if (debugMode) {
            console.log('⚠️ [FALL] Joueur ne touche plus aucune plateforme, détachement');
            const worldPos = new THREE.Vector3();
            player.mesh.getWorldPosition(worldPos);
            console.log('⚠️ [FALL] Position avant détachement:', worldPos.toArray().map(v => v.toFixed(2)));
        }

        scene.attach(player.mesh);

        if (debugMode) {
            const worldPosAfter = new THREE.Vector3();
            player.mesh.getWorldPosition(worldPosAfter);
            console.log('⚠️ [FALL] Position après détachement:', worldPosAfter.toArray().map(v => v.toFixed(2)));
        }
    }

    // Vérifier collision avec l'objectif
    if (goalObject) {
        // Utiliser la position mondiale du joueur
        const playerWorldPos = new THREE.Vector3();
        player.mesh.getWorldPosition(playerWorldPos);

        const distance = playerWorldPos.distanceTo(goalObject.position);

        if (distance < 2) {
            console.log('🎯 Objectif atteint!');
            nextLevel();
        }
    }

    // Respawn si chute (utiliser position mondiale)
    const playerWorldY = new THREE.Vector3();
    player.mesh.getWorldPosition(playerWorldY);

    if (playerWorldY.y < -10) {
        console.log('💀 Chute! Redémarrage...');
        resetLevel();
    }
}

// ========================================
// UPDATE COLLECTIBLES
// ========================================
function updateCollectibles(dt) {
    // Position mondiale du joueur (calculée une fois)
    const playerWorldPos = new THREE.Vector3();
    player.mesh.getWorldPosition(playerWorldPos);

    collectibles.forEach(item => {
        if (!item.userData.collected) {
            // Animation rotation
            item.rotation.y += 2 * dt;

            // Animation flottante (bobbing)
            item.position.y += Math.sin(Date.now() * 0.002) * 0.01;

            // Vérifier collision (utiliser position mondiale)
            const distance = playerWorldPos.distanceTo(item.position);

            if (distance < 1) {
                item.userData.collected = true;
                item.visible = false;

                // Ajouter au score
                score += item.userData.value;
                collectedCount++;

                // Mettre à jour le HUD
                updateHUD();

                console.log('⭐ Collectible! Score:', score);
            }
        }
    });
}

// ========================================
// UPDATE MOVING PLATFORMS
// ========================================
function updateMovingPlatforms(dt) {
    movingPlatforms.forEach((platform, index) => {
        const data = platform.userData;
        data.time += dt;

        const oldPos = platform.position.clone();

        if (data.type === 'horizontal') {
            // Mouvement horizontal (axe X)
            const offset = Math.sin(data.time * data.speed) * data.range;
            platform.position.x = data.startPos.x + offset;

        } else if (data.type === 'vertical') {
            // Mouvement vertical (axe Y)
            const offset = Math.sin(data.time * data.speed) * data.range;
            platform.position.y = data.startPos.y + offset;

        } else if (data.type === 'circular') {
            // Mouvement circulaire
            const angle = data.time * data.speed;
            platform.position.x = data.startPos.x + Math.cos(angle) * data.range;
            platform.position.z = data.startPos.z + Math.sin(angle) * data.range;
        }

        // Debug: afficher le mouvement toutes les 120 frames
        if (debugFrameCount % 1200=== 0) {
            const delta = platform.position.clone().sub(oldPos);
            console.log(`🔄 [PLATFORM ${index}] Type: ${data.type} | Pos: [${platform.position.toArray().map(v => v.toFixed(2))}] | Delta: [${delta.toArray().map(v => v.toFixed(2))}]`);
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
// DEBUG
// ========================================
function debugPlayer() {
    debugFrameCount++;

    // Afficher tous les 60 frames (environ 1 fois par seconde à 60fps)
    if (debugFrameCount % 60 === 0) {
        const worldPos = new THREE.Vector3();
        player.mesh.getWorldPosition(worldPos);

        const parentName = player.mesh.parent === scene ? 'SCENE' :
                          player.mesh.parent.userData.isMoving ? `PLATFORM(${player.mesh.parent.userData.type})` :
                          'UNKNOWN';

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 [DEBUG] État du joueur');
        console.log('   Position mondiale:', worldPos.toArray().map(v => v.toFixed(2)));
        console.log('   Position locale:  ', player.mesh.position.toArray().map(v => v.toFixed(2)));
        console.log('   Parent:', parentName);
        console.log('   Grounded:', player.isGrounded);
        console.log('   Velocity:', player.velocity.toArray().map(v => v.toFixed(2)));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
}

// ========================================
// CAMÉRA
// ========================================
function updateCamera() {
    // Toujours utiliser la position mondiale du joueur pour la caméra
    const playerWorldPos = new THREE.Vector3();
    player.mesh.getWorldPosition(playerWorldPos);

    const targetPosition = new THREE.Vector3(
        playerWorldPos.x,
        playerWorldPos.y + 5,
        playerWorldPos.z + 10
    );

    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(playerWorldPos);
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
    updateMovingPlatforms(dt);
    updateGoal(dt);
    updateCamera();
    debugPlayer();
}

function render() {
    renderer.render(scene, camera);
}

// ========================================
// DÉMARRAGE
// ========================================
init();

