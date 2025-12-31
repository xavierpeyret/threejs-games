import './style.scss';

import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {velocity} from "three/tsl";


// RENDER
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas
});
renderer.setSize(windowWidth, windowHeight);
renderer.setClearColor(new THREE.Color('#041115'), 1);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// CAMERA
const fov = 75;
const aspect = windowWidth / windowHeight;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.x = 0.2;
camera.position.y = 1.2;
camera.position.z = 3;

// SCENE
const scene = new THREE.Scene();

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
scene.add(controls);

// OBJECT
class Box extends THREE.Mesh {
    constructor({
                    width,
                    height,
                    depth,
                    color = "#00ff00",
                    velocity = {x: 0, y: 0, z: 0},
                    position = {x: 0, y: 0, z: 0},
                    accelerationZ = false,
                }) {
        super(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({color: color})
        );
        this.castShadow = true;
        this.receiveShadow = true;
        this.accelerationZ = accelerationZ;
        this.height = height;
        this.width = width;
        this.depth = depth;
        this.position.set(position.x, position.y, position.z);
        this.updateBoundaries();
        this.velocity = velocity;
        this.gravity = -0.005;
    }

    update(group = null) {
        this.updateBoundaries();

        if (this.accelerationZ) {
            this.velocity.z += 0.0005;
        }
        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;
        this.applyGravity(group);
    }

    applyGravity(group = null) {
        this.velocity.y += this.gravity;
        if (boxCollision({
                box1: this,
                box2: group
            }
        )) {
            this.velocity.y *= 0.5;
            this.velocity.y = -this.velocity.y;
        } else {
            this.position.y += this.velocity.y;
        }
    }

    updateBoundaries() {
        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;
        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;
        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;
    }

}


class World extends Box {
    duplicate(player) {

        console.log(this.position.z, player.position.z);

       // player has 80% position z of world create a new world
        if (this.position.z > player.position.z * 0.8) {
            const world = new World({
                width: this.width,
                height: this.height,
                depth: this.depth,
                color: this.color,
                position: {x: this.position.x, y: this.position.y, z: this.position.z},
                velocity: {x: this.velocity.x, y: this.velocity.y, z: this.velocity.z},
            })
            scene.add(world);
        }


    }
}

class Player extends Box {

}

function boxCollision({box1, box2}) {
    if (!box2) return false;

    const collisionX = box1.right >= box2.left && box1.left <= box2.right;
    const collisionY = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
    const collisionZ = box1.front >= box2.back && box1.back <= box2.front;

    return collisionX && collisionY && collisionZ;
}

const cube = new Player({
    width: 1,
    height: 1,
    depth: 1,
    color: '#627257',
    velocity: {x: 0, y: -0.05, z: 0},
});
scene.add(cube);

const ground = new World({
    width: 3,
    height: 1,
    depth: 10,
    color: '#06232c',
    position: {x: 0, y: -2, z: -4},
    velocity: {x: 0, y: 0, z: 0.01},
})
scene.add(ground);


const enemies = []

// light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
 scene.add(ambientLight);

// const pointLight = new THREE.PointLight( 0xffffff, 1, 100 );
// pointLight.position.set(-0.5, 0.5, 1);
// pointLight.castShadow = true;
// scene.add( pointLight );

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-1, 0.5, 0.5);
light.castShadow = true;
scene.add(light);

// scene.fog = new THREE.FogExp2( '#041115', 0.1 );

// Player position

let currentLane = 1;
const lanes = [-1, 0, 1];


// Keys control
const keys = {
    z: {
        pressed: false,
    },
    s: {
        pressed: false,
    },
    q: {
        pressed: false,
    },
    d: {
        pressed: false,
    }
}
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
            keys.z.pressed = true;
            break;
        case 'KeyS':
            keys.s.pressed = true;
            break;
        case 'KeyA':
            keys.q.pressed = true;
            if (currentLane > 0) {
                currentLane -= 1;
            }

            break;
        case 'KeyD':
            if (currentLane < lanes.length - 1) {
                currentLane += 1;
            }

            keys.d.pressed = true;
            break;
        case 'Space':
            cube.velocity.y = 0.12;
            break;
        default:
            break;
    }

})
window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
            keys.z.pressed = false;
            break;
        case 'KeyS':
            keys.s.pressed = false;
            break;
        case 'KeyA':
            keys.q.pressed = false;
            break;
        case 'KeyD':
            keys.d.pressed = false;
            break;
        default:
            break;
    }
})

function updatePlayerLane() {
    const targetX = lanes[currentLane]; // Position cible sur l'axe X
    const speed = 0.1; // Vitesse de déplacement

    // Déplacement fluide vers la position du couloir
    if (Math.abs(cube.position.x - targetX) > 0.01) {
        cube.position.x += (targetX - cube.position.x) * speed; // Interpolation
    } else {
        cube.position.x = targetX; // Verrouille à la position exacte
    }
}

// ANIMATION
let frames = 0;
let spawnRate = 0;
function animate() {
    const animationId = requestAnimationFrame(animate)
    controls.enabled = true;

    updatePlayerLane()

    cube.update(ground);

    ground.update();
    ground.duplicate(cube);
    //ground.duplicate(cube);


    enemies.forEach(enemy => {
        enemy.update(ground);
        if (boxCollision({
            box1: cube,
            box2: enemy,
        })) {
            window.cancelAnimationFrame(animationId);
            console.log('game over');
        }
    })

    if (frames % 50 === 0) {
        const enemy = new Box({
            width: 1,
            height: 1,
            depth: 1,
            position: {
                x: Math.random() * 10 - 5,
                y: 0,
                z: -20
            },
            velocity: {x: 0, y: 0, z: 0.005},
            color: '#8f1212',
            accelerationZ: true,
        });
        // scene.add(enemy);
        // enemies.push(enemy);
    }

    frames++;
    renderer.render(scene, camera);
}

animate();











