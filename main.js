import './style.scss';
import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ========================================
// CONSTANTES
// ========================================
const GRAVITY = 20;
const JUMP_FORCE = 12;
const MOVE_SPEED = 6;
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

// Constantes pour les ennemis
const ENEMY_COLORS = {
    static: 0xff4444,    // Rouge clair
    patrol: 0xff8800,    // Orange
    flying: 0xaa00ff,    // Violet
    chaser: 0xff0088     // Rose
};

const ENEMY_SIZES = {
    static: 0.5,
    patrol: 0.6,
    flying: 0.5,
    chaser: 0.7
};

const ENEMY_COLLISION_RADIUS = 1.0;

// ========================================
// VARIABLES GLOBALES
// ========================================
let scene, camera, renderer;
let player;
let platforms = [];
let movingPlatforms = [];
let enemies = [];
let collectibles = [];
let goalObject = null;
let keys = {};
let clock;
let score = 0;
let currentLevelIndex = 0;
let totalCollectibles = 0;
let collectedCount = 0;
let debugFrameCount = 0;
let debugMode = false;
let editorMode = false; // Mode éditeur activé par défaut
let orbitControls = null;

// ========================================
// DONNÉES DES NIVEAUX
// ========================================
const LEVELS = {
    tutorial: {
        name: "Tutoriel",
        platforms: [
            { x: 0,  y: 0, z: 0, w: 10, h: 1, d: 5, type: 'start' },
            { x: 32, y: 2, z: 0, w: 3,  h: 1, d: 3,  type: 'rhythm' },
            { x: 42, y: 0, z: 0, w: 12, h: 1, d: 5, type: 'goal' }
        ],
        movingPlatforms: [
            { x: 8, y: 1, z: 0, w: 4, h: 1, d: 4, type: 'horizontal', speed: 1, range: 3 },
            { x: 16, y: 1, z: 0, w: 4, h: 1, d: 4, type: 'vertical', speed: 1.5, range: 2 },
            { x: 24, y: 2, z: 0, w: 4, h: 1, d: 4, type: 'circular', speed: 0.8, range: 3 }
        ],
        enemies: [
            { x: 12, y: 2, z: 0, type: 'static' },
            { x: 20, y: 1, z: 0, type: 'patrol', range: 4, speed: 1.5 },
            { x: 28, y: 4, z: 0, type: 'flying', range: 3, speed: 1, height: 2 },
            { x: 38, y: 2, z: 0, type: 'chaser', speed: 3, chaseRadius: 10 }
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

    // Position initiale de la caméra selon le mode
    camera.position.set(0, 5, 10); // Vue du joueur

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);



    // En mode éditeur, pointer vers le centre de la scène
    if (editorMode) {
        camera.position.set(20, 10, 10); // Vue d'ensemble pour l'édition
        // Configurer OrbitControls pour le mode éditeur
        orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;
        orbitControls.screenSpacePanning = false;
        orbitControls.minDistance = 3;
        orbitControls.maxDistance = 150;
        orbitControls.maxPolarAngle = Math.PI / 2;
        orbitControls.enabled = editorMode; // Activé selon editorMode
        orbitControls.target.set(20, 0, 0); // Centre approximatif du niveau
        orbitControls.update();
    }

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
// ENNEMIS
// ========================================

class Enemy {
    constructor(x, y, z, type, config = {}) {
        this.type = type;
        this.startPos = new THREE.Vector3(x, y, z);
        this.isActive = true;
        this.time = 0;
        this.direction = 1;

        this.config = {
            speed: config.speed || 2,
            range: config.range || 5,
            height: config.height || 2,
            chaseRadius: config.chaseRadius || 15,
            ...config
        };

        this.createMesh();
    }

    createMesh() {
        const size = ENEMY_SIZES[this.type] || 0.5;
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: ENEMY_COLORS[this.type] || 0xff0000,
            emissive: ENEMY_COLORS[this.type] || 0xff0000,
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.6
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.startPos);
        this.mesh.castShadow = true;
        this.mesh.userData.enemy = this;

        scene.add(this.mesh);

        this.createDirectionIndicator();
    }

    createDirectionIndicator() {
        if (this.type === 'patrol' || this.type === 'chaser') {
            const coneGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
            const coneMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.5
            });

            this.directionIndicator = new THREE.Mesh(coneGeometry, coneMaterial);
            this.directionIndicator.rotation.x = Math.PI / 2;
            this.directionIndicator.position.set(0, 0, 0.3);
            this.mesh.add(this.directionIndicator);
        }
    }

    update(dt) {
        if (!this.isActive) return;

        this.time += dt;

        switch(this.type) {
            case 'static':
                this.updateStatic(dt);
                break;
            case 'patrol':
                this.updatePatrol(dt);
                break;
            case 'flying':
                this.updateFlying(dt);
                break;
            case 'chaser':
                this.updateChaser(dt);
                break;
        }

        this.updateVisuals(dt);
    }

    updateVisuals(dt) {
        // Rotation continue
        this.mesh.rotation.y += dt * 2;

        // Pulsation d'intensité émissive
        const pulse = Math.sin(this.time * 3) * 0.15 + 0.3;
        this.mesh.material.emissiveIntensity = pulse;
    }

    updateStatic(dt) {
        // Flottement vertical
        const bobbing = Math.sin(this.time * 2) * 0.15;
        this.mesh.position.y = this.startPos.y + bobbing;
        this.mesh.position.x = this.startPos.x;
        this.mesh.position.z = this.startPos.z;
    }

    updatePatrol(dt) {
        // Mouvement horizontal sinusoïdal
        const offset = Math.sin(this.time * this.config.speed) * this.config.range;
        this.mesh.position.x = this.startPos.x + offset;
        this.mesh.position.y = this.startPos.y;
        this.mesh.position.z = this.startPos.z;

        // Orienter l'indicateur
        if (this.directionIndicator) {
            const currentDirection = Math.cos(this.time * this.config.speed);
            if (currentDirection > 0.1) {
                this.directionIndicator.rotation.y = -Math.PI / 2;
            } else if (currentDirection < -0.1) {
                this.directionIndicator.rotation.y = Math.PI / 2;
            }
        }
    }

    updateFlying(dt) {
        // Mouvement circulaire + variation hauteur
        const angle = this.time * this.config.speed;
        this.mesh.position.x = this.startPos.x + Math.cos(angle) * this.config.range;
        this.mesh.position.z = this.startPos.z + Math.sin(angle) * this.config.range;

        const heightVariation = Math.sin(this.time * 1.5) * this.config.height;
        this.mesh.position.y = this.startPos.y + heightVariation;

        // Inclinaison
        this.mesh.rotation.z = Math.sin(angle) * 0.2;
        this.mesh.rotation.x = Math.cos(angle) * 0.2;
    }

    updateChaser(dt) {
        if (!player) return;

        const playerWorldPos = new THREE.Vector3();
        player.mesh.getWorldPosition(playerWorldPos);

        const direction = new THREE.Vector3()
            .subVectors(playerWorldPos, this.mesh.position)
            .normalize();

        const distanceToPlayer = this.mesh.position.distanceTo(playerWorldPos);

        if (distanceToPlayer < this.config.chaseRadius) {
            // Poursuivre
            this.mesh.position.x += direction.x * this.config.speed * dt;
            this.mesh.position.z += direction.z * this.config.speed * dt;
            this.mesh.position.y = this.startPos.y;

            // Orienter indicateur
            if (this.directionIndicator) {
                const angleToPlayer = Math.atan2(direction.z, direction.x);
                this.directionIndicator.rotation.y = -angleToPlayer;
            }
        } else {
            // Retourner à la position de départ
            const returnDirection = new THREE.Vector3()
                .subVectors(this.startPos, this.mesh.position)
                .normalize();

            this.mesh.position.x += returnDirection.x * this.config.speed * 0.5 * dt;
            this.mesh.position.z += returnDirection.z * this.config.speed * 0.5 * dt;
            this.mesh.position.y = this.startPos.y;
        }
    }

    checkCollisionWithPlayer() {
        if (!this.isActive || !player) return false;

        const playerWorldPos = new THREE.Vector3();
        player.mesh.getWorldPosition(playerWorldPos);

        const distance = this.mesh.position.distanceTo(playerWorldPos);
        return distance < ENEMY_COLLISION_RADIUS;
    }

    destroy() {
        this.isActive = false;

        if (this.directionIndicator) {
            this.mesh.remove(this.directionIndicator);
            this.directionIndicator.geometry.dispose();
            this.directionIndicator.material.dispose();
        }

        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

function createEnemy(x, y, z, type, config) {
    const enemy = new Enemy(x, y, z, type, config);
    enemies.push(enemy);
    return enemy;
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        enemy.update(dt);

        if (enemy.checkCollisionWithPlayer()) {
            handlePlayerDeath();
        }
    });
}

function handlePlayerDeath() {
    console.log('💀 Mort! Contact avec un ennemi');

    player.mesh.visible = false;

    setTimeout(() => {
        player.mesh.visible = true;
        resetLevel();
    }, 1000);
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

    // Charger les ennemis
    if (data.enemies) {
        data.enemies.forEach(e => {
            createEnemy(e.x, e.y, e.z, e.type, {
                speed: e.speed,
                range: e.range,
                height: e.height,
                chaseRadius: e.chaseRadius
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

    // Retirer tous les ennemis
    enemies.forEach(enemy => enemy.destroy());
    enemies = [];

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
            scene.attach(player.mesh);
        }

        player.velocity.y = JUMP_FORCE;
        player.isGrounded = false;
        player.canJump = false;

        // ANIMATION DE SAUT
        // Rotation complète
        gsap.to(player.mesh.rotation, {
            x: player.mesh.rotation.x + Math.PI * 2,
            duration: 0.6,
            ease: "power2.out"
        });

        // Léger stretch vertical
        gsap.to(player.mesh.scale, {
            x: 0.85,
            y: 1.2,
            z: 0.85,
            duration: 0.15,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
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
// COLLISION HELPERS
// ========================================
function calculateOverlapX(boxA, boxB) {
    const overlapMin = Math.max(boxA.min.x, boxB.min.x);
    const overlapMax = Math.min(boxA.max.x, boxB.max.x);
    return Math.max(0, overlapMax - overlapMin);
}

function calculateOverlapY(boxA, boxB) {
    const overlapMin = Math.max(boxA.min.y, boxB.min.y);
    const overlapMax = Math.min(boxA.max.y, boxB.max.y);
    return Math.max(0, overlapMax - overlapMin);
}

function calculateOverlapZ(boxA, boxB) {
    const overlapMin = Math.max(boxA.min.z, boxB.min.z);
    const overlapMax = Math.min(boxA.max.z, boxB.max.z);
    return Math.max(0, overlapMax - overlapMin);
}

function getBoxCenter(box) {
    return new THREE.Vector3(
        (box.min.x + box.max.x) / 2,
        (box.min.y + box.max.y) / 2,
        (box.min.z + box.max.z) / 2
    );
}

function isPlayerAbovePlatform(playerWorldPos, platformBox, player, platform) {
    // Si le joueur est attaché à cette plateforme, vérifier en coordonnées locales
    if (player.mesh.parent === platform) {
        const platformWidth = platform.geometry.parameters.width;
        const platformDepth = platform.geometry.parameters.depth;
        const localPos = player.mesh.position;

        return localPos.x >= -platformWidth / 2 &&
               localPos.x <= platformWidth / 2 &&
               localPos.z >= -platformDepth / 2 &&
               localPos.z <= platformDepth / 2;
    }

    // Sinon vérifier en coordonnées mondiales
    return playerWorldPos.x >= platformBox.min.x &&
           playerWorldPos.x <= platformBox.max.x &&
           playerWorldPos.z >= platformBox.min.z &&
           playerWorldPos.z <= platformBox.max.z;
}

// ========================================
// COLLISION RESOLUTION
// ========================================
function resolveVerticalCollision(platform, platformBox, playerWorldPos) {
    // Vérifier si le joueur est bien au-dessus de la plateforme horizontalement
    const isAbove = isPlayerAbovePlatform(playerWorldPos, platformBox, player, platform);

    if (!isAbove) {
        return false; // Pas une collision verticale valide
    }

    player.velocity.y = 0;
    player.isGrounded = true;

    // Gérer l'attachement aux plateformes mobiles
    if (platform.userData.isMoving && player.mesh.parent !== platform) {
        // S'assurer que le joueur est dans la scène avant de repositionner
        if (player.mesh.parent !== scene) {
            scene.attach(player.mesh);
        }

        // Positionner au sommet de la plateforme en coordonnées mondiales
        const targetY = platformBox.max.y + PLAYER_SIZE / 2;
        player.mesh.position.y = targetY;

        // Attacher à la plateforme (préserve la position mondiale)
        platform.attach(player.mesh);

    } else if (player.mesh.parent === platform) {
        // Déjà attaché : juste ajuster la position locale Y
        const platformHeight = platform.geometry.parameters.height;
        const localY = platformHeight / 2 + PLAYER_SIZE / 2;
        player.mesh.position.y = localY;

    } else {
        // Plateforme statique : juste définir la position Y
        const targetY = platformBox.max.y + PLAYER_SIZE / 2;
        player.mesh.position.y = targetY;
    }

    return true;
}

function resolveHorizontalCollisionX(playerBox, platformBox, platform) {
    const playerCenter = getBoxCenter(playerBox);
    const platformCenter = getBoxCenter(platformBox);

    const overlap = calculateOverlapX(playerBox, platformBox);

    // Déterminer la direction de repoussement
    const pushDirection = (playerCenter.x < platformCenter.x) ? -1 : 1;
    const pushAmount = overlap * pushDirection;

    // Gérer les coordonnées locales vs mondiales
    if (player.mesh.parent === scene) {
        // Cas simple : joueur dans l'espace mondial
        player.mesh.position.x += pushAmount;
    } else {
        // Cas complexe : joueur attaché à une plateforme
        // Détacher, ajuster la position mondiale, réattacher si nécessaire
        const worldPos = new THREE.Vector3();
        player.mesh.getWorldPosition(worldPos);
        worldPos.x += pushAmount;

        const currentParent = player.mesh.parent;
        scene.attach(player.mesh);
        player.mesh.position.copy(worldPos);

        // Réattacher si était sur une plateforme mobile
        if (currentParent !== scene && currentParent.userData?.isMoving) {
            currentParent.attach(player.mesh);
        }
    }

    // Annuler la vélocité X
    player.velocity.x = 0;
}

function resolveHorizontalCollisionZ(playerBox, platformBox, platform) {
    const playerCenter = getBoxCenter(playerBox);
    const platformCenter = getBoxCenter(platformBox);

    const overlap = calculateOverlapZ(playerBox, platformBox);

    const pushDirection = (playerCenter.z < platformCenter.z) ? -1 : 1;
    const pushAmount = overlap * pushDirection;

    if (player.mesh.parent === scene) {
        player.mesh.position.z += pushAmount;
    } else {
        // Gérer le joueur attaché
        const worldPos = new THREE.Vector3();
        player.mesh.getWorldPosition(worldPos);
        worldPos.z += pushAmount;

        const currentParent = player.mesh.parent;
        scene.attach(player.mesh);
        player.mesh.position.copy(worldPos);

        if (currentParent !== scene && currentParent.userData?.isMoving) {
            currentParent.attach(player.mesh);
        }
    }

    player.velocity.z = 0;
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
            // Vérifier d'abord si le joueur est au-dessus de la plateforme (horizontalement)
            const isAbove = isPlayerAbovePlatform(playerWorldPos, platformBox, player, platform);

            if (isAbove) {
                // Le joueur est au-dessus : ne traiter QUE la collision verticale
                if (player.velocity.y < 0) {
                    const resolved = resolveVerticalCollision(platform, platformBox, playerWorldPos);
                    if (resolved) {
                        standingOnPlatform = platform;
                    }
                }
            } else {
                // Le joueur est sur le CÔTÉ : traiter les collisions horizontales
                const overlapX = calculateOverlapX(playerBox, platformBox);
                const overlapY = calculateOverlapY(playerBox, platformBox);
                const overlapZ = calculateOverlapZ(playerBox, platformBox);

                const minOverlap = Math.min(overlapX, overlapY, overlapZ);

                if (minOverlap === overlapX) {
                    // COLLISION HORIZONTALE (axe X - gauche/droite)
                    resolveHorizontalCollisionX(playerBox, platformBox, platform);
                } else if (minOverlap === overlapZ) {
                    // COLLISION HORIZONTALE (axe Z - avant/arrière)
                    resolveHorizontalCollisionZ(playerBox, platformBox, platform);
                } else if (minOverlap === overlapY) {
                    // COLLISION VERTICALE depuis le bas (plafond)
                    // Pour l'instant on ne gère pas les collisions de plafond
                    // mais on pourrait arrêter la vélocité Y positive ici
                }
            }
        }
    });

    // Détacher du parent si on n'est plus sur aucune plateforme
    if (!standingOnPlatform && player.mesh.parent !== scene) {
        scene.attach(player.mesh);
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
    movingPlatforms.forEach(platform => {
        const data = platform.userData;
        data.time += dt;

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
            platform.position.y = data.startPos.y + Math.sin(angle) * data.range;
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

    // Afficher tous les 60 frames (environ 1 fois par seconde à 60fps) si debugMode activé
    if (debugMode && debugFrameCount % 600 === 0) {
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
    // En mode éditeur, OrbitControls gère la caméra
    if (editorMode) {
        orbitControls.update();
        return;
    }

    // Toujours utiliser la position mondiale du joueur pour la caméra
    const playerWorldPos = new THREE.Vector3();
    player.mesh.getWorldPosition(playerWorldPos);

    const targetPosition = new THREE.Vector3(
        playerWorldPos.x - 1,
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
    updateMovingPlatforms(dt);  // Déplacer les plateformes AVANT la physique
    applyPhysics(dt);
    checkCollisions();
    updateCollectibles(dt);
    updateEnemies(dt);
    updateGoal(dt);
    debugPlayer();
    // La caméra se met à jour dans tous les cas (gère OrbitControls en mode éditeur)
    updateCamera();
}

function render() {
    renderer.render(scene, camera);
}

// ========================================
// DÉMARRAGE
// ========================================
init();

