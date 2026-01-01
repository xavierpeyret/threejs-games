import './style.scss';

import * as THREE from 'three';

// ========================================
// CONSTANTES DE JEU
// ========================================
const GRAVITY = 20;
const JUMP_FORCE = 12;
const MOVE_SPEED = 8;
const PLAYER_SIZE = 1;

// ========================================
// VARIABLES GLOBALES
// ========================================
let scene, camera, renderer;
let player, platforms = [];
let keys = {};
let clock;

// ========================================
// INITIALISATION
// ========================================
function init() {
    setupThreeJS();
    createPlayer();
    createLevel();
    setupLights();
    setupControls();
    gameLoop();
}

// ========================================
// SETUP THREE.JS
// ========================================
function setupThreeJS() {
    // Créer la scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Créer la caméra
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 10);

    // Créer le renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Clock pour delta time
    clock = new THREE.Clock();

    // Responsive
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
    mesh.position.set(0, 5, 0);
    scene.add(mesh);

    player = {
        mesh: mesh,
        velocity: new THREE.Vector3(0, 0, 0),
        isGrounded: false,
        canJump: true
    };
}

// ========================================
// CRÉER LE NIVEAU
// ========================================
function createLevel() {
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x6bcfff });

    // Sol principal
    const groundGeometry = new THREE.BoxGeometry(20, 1, 20);
    const ground = new THREE.Mesh(groundGeometry, platformMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    platforms.push(ground);

    // Plateformes additionnelles
    createPlatform(5, 2, 0, 4, 1, 4);
    createPlatform(10, 4, 0, 3, 1, 3);
    createPlatform(-5, 3, 0, 3, 1, 3);
}

function createPlatform(x, y, z, w, h, d) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    const platform = new THREE.Mesh(geometry, material);

    platform.position.set(x, y, z);
    platform.receiveShadow = true;
    scene.add(platform);
    platforms.push(platform);
}

// ========================================
// ÉCLAIRAGE
// ========================================
function setupLights() {
    // Lumière ambiante
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Lumière directionnelle
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
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
    // Déplacement gauche/droite
    if (keys['ArrowLeft']) {
        player.velocity.x = -MOVE_SPEED;
    } else if (keys['ArrowRight']) {
        player.velocity.x = MOVE_SPEED;
    } else {
        player.velocity.x *= 0.8; // Friction
    }

    // Saut
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
    // Gravité
    player.velocity.y -= GRAVITY * dt;

    // Mise à jour position
    player.mesh.position.x += player.velocity.x * dt;
    player.mesh.position.y += player.velocity.y * dt;
    player.mesh.position.z += player.velocity.z * dt;

    // Limiter vitesse de chute
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

    // Respawn si chute
    if (player.mesh.position.y < -10) {
        player.mesh.position.set(0, 5, 0);
        player.velocity.set(0, 0, 0);
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
    updateCamera();
}

function render() {
    renderer.render(scene, camera);
}

// ========================================
// DÉMARRAGE
// ========================================
init();








