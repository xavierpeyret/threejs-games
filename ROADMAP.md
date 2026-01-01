# 🗺️ ROADMAP - JEU DE PLATEFORME 3D

---

## 📅 PLAN D'IMPLÉMENTATION

### **Phase 1 : UI & Scoring** (2-3h)
### **Phase 2 : Plateformes Mobiles** (2h)
### **Phase 3 : Système d'Ennemis** (4-5h)
### **Phase 4 : Particules** (2-3h)

**Total estimé : 10-13 heures**

---

# 📍 PHASE 1 : UI & SCORING (2-3h)

## 🎯 Objectifs
- Afficher le score en temps réel
- Afficher le nom du niveau
- Créer un HUD propre et lisible

---

## 📝 Étape 1.1 : HTML/CSS pour le HUD (30 min)

### **À ajouter dans le HTML**

```html
<!-- HUD Container -->
<div id="hud">
    <!-- Nom du niveau -->
    <div id="level-name">
        <h2>Tutorial</h2>
    </div>
    
    <!-- Score -->
    <div id="score-display">
        <span class="label">Score:</span>
        <span id="score-value">0</span>
    </div>
    
    <!-- Collectibles -->
    <div id="collectibles-counter">
        <span class="label">⭐</span>
        <span id="collectibles-value">0 / 5</span>
    </div>
</div>
```

### **Styles CSS**

```css
#hud {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
    z-index: 1000;
    font-family: 'Arial', sans-serif;
    pointer-events: none;
}

#level-name h2 {
    margin: 0;
    font-size: 28px;
    color: #00ffcc;
    text-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
}

#score-display,
#collectibles-counter {
    background: rgba(0, 0, 0, 0.7);
    padding: 10px 20px;
    border-radius: 8px;
    border: 2px solid #00ffcc;
    font-size: 20px;
}

.label {
    color: #aaa;
    margin-right: 10px;
}

#score-value,
#collectibles-value {
    color: #ffd700;
    font-weight: bold;
}
```

---

## 📝 Étape 1.2 : Système de Score JavaScript (1h)

### **Variables globales à ajouter**

```javascript
// Score et stats
let score = 0;
let totalCollectibles = 0;
let collectedCount = 0;
```

### **Fonction updateHUD()**

```javascript
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
```

### **Modifier loadLevel()**

```javascript
function loadLevel(levelName) {
    clearLevel();
    
    const data = LEVELS[levelName];
    currentLevelIndex = LEVEL_ORDER.indexOf(levelName);
    
    // Reset score et compteurs
    score = 0;
    collectedCount = 0;
    totalCollectibles = data.collectibles.length;
    
    // Charger plateformes
    data.platforms.forEach(p => {
        createPlatform(p.x, p.y, p.z, p.w, p.h, p.d, p.type);
    });
    
    // Charger collectibles
    data.collectibles.forEach(c => {
        createCollectible(c.x, c.y, c.z);
    });
    
    player.mesh.position.set(
        data.playerStart.x,
        data.playerStart.y,
        data.playerStart.z
    );
    player.velocity.set(0, 0, 0);
    
    createGoal(data.goal.x, data.goal.y, data.goal.z);
    
    // Mettre à jour le HUD
    updateHUD();
    
    console.log('Niveau chargé:', levelName);
}
```

### **Modifier updateCollectibles()**

```javascript
function updateCollectibles(dt) {
    collectibles.forEach(item => {
        if (!item.userData.collected) {
            item.rotation.y += 2 * dt;
            item.position.y += Math.sin(Date.now() * 0.002) * 0.01;
            
            const distance = player.mesh.position.distanceTo(item.position);
            
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
```

---

## ✅ Checklist Phase 1

- [ ] Ajouter le HTML du HUD
- [ ] Ajouter les styles CSS
- [ ] Créer la fonction updateHUD()
- [ ] Modifier loadLevel() pour reset le score
- [ ] Modifier updateCollectibles() pour mettre à jour le HUD
- [ ] Tester : le score et le nom s'affichent correctement

---

# 📍 PHASE 2 : PLATEFORMES MOBILES (2h)

## 🎯 Objectifs
- Créer des plateformes qui bougent
- Types : horizontale, verticale, circulaire
- Le joueur bouge avec la plateforme

---

## 📝 Étape 2.1 : Structure des Plateformes Mobiles (30 min)

### **Ajouter au tableau LEVELS**

```javascript
const LEVELS = {
    tutorial: {
        // ... existing
        movingPlatforms: [
            {
                x: 15, y: 2, z: 0,
                w: 4, h: 1, d: 4,
                type: 'horizontal',  // horizontal, vertical, circular
                speed: 2,            // vitesse de déplacement
                range: 6             // distance de déplacement
            }
        ]
    }
};
```

### **Variables globales**

```javascript
let movingPlatforms = [];
```

---

## 📝 Étape 2.2 : Fonction createMovingPlatform() (45 min)

```javascript
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
```

---

## 📝 Étape 2.3 : Fonction updateMovingPlatforms() (45 min)

```javascript
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
            platform.position.z = data.startPos.z + Math.sin(angle) * data.range;
        }
    });
}
```

---

## 📝 Étape 2.4 : Le joueur bouge avec la plateforme (30 min)

### **Modifier checkCollisions()**

```javascript
function checkCollisions() {
    player.isGrounded = false;
    let standingOnPlatform = null;
    
    const playerBox = new THREE.Box3().setFromObject(player.mesh);
    
    platforms.forEach(platform => {
        const platformBox = new THREE.Box3().setFromObject(platform);
        
        if (playerBox.intersectsBox(platformBox)) {
            if (player.velocity.y < 0) {
                player.mesh.position.y = platformBox.max.y + PLAYER_SIZE / 2;
                player.velocity.y = 0;
                player.isGrounded = true;
                
                // Retenir sur quelle plateforme on est
                standingOnPlatform = platform;
            }
        }
    });
    
    // Déplacer le joueur avec la plateforme mobile
    if (standingOnPlatform && standingOnPlatform.userData.isMoving) {
        const data = standingOnPlatform.userData;
        
        if (data.type === 'horizontal') {
            const velocity = Math.cos(data.time * data.speed) * data.speed * data.range;
            player.mesh.position.x += velocity * clock.getDelta();
            
        } else if (data.type === 'vertical') {
            const velocity = Math.cos(data.time * data.speed) * data.speed * data.range;
            player.mesh.position.y += velocity * clock.getDelta();
            
        } else if (data.type === 'circular') {
            const angle = data.time * data.speed;
            const prevAngle = (data.time - clock.getDelta()) * data.speed;
            
            const dx = (Math.cos(angle) - Math.cos(prevAngle)) * data.range;
            const dz = (Math.sin(angle) - Math.sin(prevAngle)) * data.range;
            
            player.mesh.position.x += dx;
            player.mesh.position.z += dz;
        }
    }
    
    // Respawn si chute
    if (player.mesh.position.y < -10) {
        resetLevel();
    }
}
```

---

## 📝 Étape 2.5 : Intégration dans loadLevel() (15 min)

```javascript
function loadLevel(levelName) {
    // ... code existant ...
    
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
    
    // ... reste du code ...
}
```

### **Modifier clearLevel()**

```javascript
function clearLevel() {
    platforms.forEach(p => scene.remove(p));
    platforms = [];
    movingPlatforms = [];  // Reset aussi les mobiles
    
    collectibles.forEach(c => scene.remove(c));
    collectibles = [];
    
    if (goalObject) {
        scene.remove(goalObject);
        goalObject = null;
    }
}
```

### **Ajouter dans update()**

```javascript
function update(dt) {
    handleInput(dt);
    applyPhysics(dt);
    checkCollisions();
    updateCollectibles(dt);
    updateMovingPlatforms(dt);  // ← AJOUTER ICI
    updateGoal(dt);
    updateCamera();
}
```

---

## ✅ Checklist Phase 2

- [ ] Créer la fonction createMovingPlatform()
- [ ] Créer la fonction updateMovingPlatforms()
- [ ] Modifier checkCollisions() pour déplacer le joueur
- [ ] Ajouter movingPlatforms au loadLevel()
- [ ] Ajouter au clearLevel()
- [ ] Ajouter à update()
- [ ] Tester les 3 types de mouvement

---

# 📍 PHASE 3 : SYSTÈME D'ENNEMIS (4-5h)

## 🎯 Objectifs
- 4 types d'ennemis
- Collision = mort du joueur
- Système modulaire et extensible

---

## 📝 Étape 3.1 : Structure de Base (30 min)

### **Variables globales**

```javascript
let enemies = [];
```

### **Ajouter aux LEVELS**

```javascript
const LEVELS = {
    tutorial: {
        // ... existing ...
        enemies: [
            { x: 20, y: 3, z: 0, type: 'static' },
            { x: 30, y: 2, z: 0, type: 'patrol', range: 5, speed: 2 },
            { x: 40, y: 5, z: 0, type: 'flying', height: 3, speed: 1 },
            { x: 50, y: 2, z: 0, type: 'chaser', speed: 3 }
        ]
    }
};
```

---

## 📝 Étape 3.2 : Classe Enemy de Base (1h)

```javascript
class Enemy {
    constructor(x, y, z, type, config = {}) {
        // Créer le mesh
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        
        // Propriétés
        this.type = type;
        this.startPos = new THREE.Vector3(x, y, z);
        this.config = {
            speed: config.speed || 2,
            range: config.range || 5,
            height: config.height || 2,
            ...config
        };
        
        // État
        this.time = 0;
        this.direction = 1;
        this.isActive = true;
        
        scene.add(this.mesh);
    }
    
    update(dt) {
        if (!this.isActive) return;
        
        this.time += dt;
        
        // Comportement selon le type
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
        
        // Animation (rotation)
        this.mesh.rotation.y += dt * 2;
    }
    
    updateStatic(dt) {
        // Ne bouge pas, juste une animation légère
        this.mesh.position.y = this.startPos.y + Math.sin(this.time * 2) * 0.1;
    }
    
    updatePatrol(dt) {
        // Va-et-vient horizontal
        const offset = Math.sin(this.time * this.config.speed) * this.config.range;
        this.mesh.position.x = this.startPos.x + offset;
        this.mesh.position.y = this.startPos.y;
    }
    
    updateFlying(dt) {
        // Vol circulaire
        const angle = this.time * this.config.speed;
        this.mesh.position.x = this.startPos.x + Math.cos(angle) * this.config.range;
        this.mesh.position.y = this.startPos.y + Math.sin(this.time) * this.config.height;
        this.mesh.position.z = this.startPos.z + Math.sin(angle) * this.config.range;
    }
    
    updateChaser(dt) {
        // Suit le joueur
        if (!player) return;
        
        const direction = new THREE.Vector3()
            .subVectors(player.mesh.position, this.mesh.position)
            .normalize();
        
        this.mesh.position.x += direction.x * this.config.speed * dt;
        this.mesh.position.z += direction.z * this.config.speed * dt;
        
        // Rester à la même hauteur
        this.mesh.position.y = this.startPos.y;
    }
    
    checkCollisionWithPlayer() {
        if (!this.isActive) return false;
        
        const distance = this.mesh.position.distanceTo(player.mesh.position);
        return distance < 1;  // Collision si distance < 1
    }
    
    destroy() {
        this.isActive = false;
        scene.remove(this.mesh);
    }
}
```

---

## 📝 Étape 3.3 : Fonctions de Gestion (1h)

```javascript
function createEnemy(x, y, z, type, config) {
    const enemy = new Enemy(x, y, z, type, config);
    enemies.push(enemy);
    return enemy;
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        enemy.update(dt);
        
        // Vérifier collision avec joueur
        if (enemy.checkCollisionWithPlayer()) {
            handlePlayerDeath();
        }
    });
}

function handlePlayerDeath() {
    console.log('💀 Mort! Contact avec un ennemi');
    
    // Effet visuel simple
    player.mesh.visible = false;
    
    // Reset après 1 seconde
    setTimeout(() => {
        player.mesh.visible = true;
        resetLevel();
    }, 1000);
}

function clearEnemies() {
    enemies.forEach(enemy => enemy.destroy());
    enemies = [];
}
```

---

## 📝 Étape 3.4 : Intégration (30 min)

### **Modifier loadLevel()**

```javascript
function loadLevel(levelName) {
    clearLevel();
    
    const data = LEVELS[levelName];
    // ... code existant ...
    
    // Charger les ennemis
    if (data.enemies) {
        data.enemies.forEach(e => {
            createEnemy(e.x, e.y, e.z, e.type, {
                speed: e.speed,
                range: e.range,
                height: e.height
            });
        });
    }
    
    updateHUD();
}
```

### **Modifier clearLevel()**

```javascript
function clearLevel() {
    platforms.forEach(p => scene.remove(p));
    platforms = [];
    movingPlatforms = [];
    
    collectibles.forEach(c => scene.remove(c));
    collectibles = [];
    
    clearEnemies();  // ← AJOUTER ICI
    
    if (goalObject) {
        scene.remove(goalObject);
        goalObject = null;
    }
}
```

### **Modifier update()**

```javascript
function update(dt) {
    handleInput(dt);
    applyPhysics(dt);
    checkCollisions();
    updateCollectibles(dt);
    updateMovingPlatforms(dt);
    updateEnemies(dt);  // ← AJOUTER ICI
    updateGoal(dt);
    updateCamera();
}
```

---

## 📝 Étape 3.5 : Améliorer les Visuels (1h)

### **Couleurs différentes par type**

```javascript
const ENEMY_COLORS = {
    static: 0xff4444,    // Rouge
    patrol: 0xff8800,    // Orange
    flying: 0xaa00ff,    // Violet
    chaser: 0xff0088     // Rose
};

// Dans Enemy constructor:
const material = new THREE.MeshStandardMaterial({
    color: ENEMY_COLORS[type] || 0xff0000,
    emissive: ENEMY_COLORS[type] || 0xff0000,
    emissiveIntensity: 0.3
});
```

### **Indicateur de direction (pour patrol et chaser)**

```javascript
// Ajouter dans Enemy constructor
if (type === 'patrol' || type === 'chaser') {
    // Ajouter un cône pour montrer la direction
    const coneGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const coneMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff 
    });
    this.directionIndicator = new THREE.Mesh(coneGeometry, coneMaterial);
    this.directionIndicator.rotation.x = Math.PI / 2;
    this.mesh.add(this.directionIndicator);
}
```

---

## ✅ Checklist Phase 3

- [ ] Créer la classe Enemy
- [ ] Implémenter les 4 types (static, patrol, flying, chaser)
- [ ] Créer createEnemy() et updateEnemies()
- [ ] Implémenter handlePlayerDeath()
- [ ] Ajouter au loadLevel()
- [ ] Ajouter au clearLevel()
- [ ] Ajouter à update()
- [ ] Différencier visuellement les types
- [ ] Tester chaque type d'ennemi

---

# 📍 PHASE 4 : PARTICULES BASIQUES (2-3h)

## 🎯 Objectifs
- Particules lors de collecte
- Particules lors d'atterrissage
- Particules lors de mort
- Système simple et performant

---

## 📝 Étape 4.1 : Système de Particules (1h)

```javascript
class Particle {
    constructor(x, y, z, color = 0xffffff) {
        // Créer une petite sphère
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        
        // Vélocité aléatoire
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 5
        );
        
        // Durée de vie
        this.lifetime = 1;  // 1 seconde
        this.age = 0;
        this.isAlive = true;
        
        scene.add(this.mesh);
    }
    
    update(dt) {
        if (!this.isAlive) return;
        
        // Gravité
        this.velocity.y -= 10 * dt;
        
        // Mouvement
        this.mesh.position.x += this.velocity.x * dt;
        this.mesh.position.y += this.velocity.y * dt;
        this.mesh.position.z += this.velocity.z * dt;
        
        // Vieillissement
        this.age += dt;
        
        // Fade out
        const opacity = 1 - (this.age / this.lifetime);
        this.mesh.material.opacity = Math.max(0, opacity);
        
        // Mort
        if (this.age >= this.lifetime) {
            this.destroy();
        }
    }
    
    destroy() {
        this.isAlive = false;
        scene.remove(this.mesh);
    }
}
```

---

## 📝 Étape 4.2 : Gestionnaire de Particules (30 min)

```javascript
let particles = [];

function createParticleBurst(x, y, z, count = 10, color = 0xffffff) {
    for (let i = 0; i < count; i++) {
        const particle = new Particle(x, y, z, color);
        particles.push(particle);
    }
}

function updateParticles(dt) {
    // Mettre à jour toutes les particules
    particles.forEach(particle => {
        particle.update(dt);
    });
    
    // Nettoyer les particules mortes
    particles = particles.filter(p => p.isAlive);
}

function clearParticles() {
    particles.forEach(p => p.destroy());
    particles = [];
}
```

---

## 📝 Étape 4.3 : Intégration aux Actions (1h)

### **Particules lors de collecte**

```javascript
// Dans updateCollectibles()
if (distance < 1) {
    item.userData.collected = true;
    item.visible = false;
    
    // PARTICULES DORÉES
    createParticleBurst(
        item.position.x,
        item.position.y,
        item.position.z,
        15,
        0xffd700  // Or
    );
    
    score += item.userData.value;
    collectedCount++;
    updateHUD();
}
```

### **Particules lors d'atterrissage**

```javascript
// Dans checkCollisions()
if (playerBox.intersectsBox(platformBox)) {
    if (player.velocity.y < 0) {
        // Si vitesse de chute importante
        if (player.velocity.y < -5) {
            // PARTICULES DE POUSSIÈRE
            createParticleBurst(
                player.mesh.position.x,
                platformBox.max.y,
                player.mesh.position.z,
                8,
                0xcccccc  // Gris (poussière)
            );
        }
        
        player.mesh.position.y = platformBox.max.y + PLAYER_SIZE / 2;
        player.velocity.y = 0;
        player.isGrounded = true;
        standingOnPlatform = platform;
    }
}
```

### **Particules lors de mort**

```javascript
function handlePlayerDeath() {
    console.log('💀 Mort! Contact avec un ennemi');
    
    // EXPLOSION DE PARTICULES ROUGES
    createParticleBurst(
        player.mesh.position.x,
        player.mesh.position.y,
        player.mesh.position.z,
        30,
        0xff0000  // Rouge
    );
    
    player.mesh.visible = false;
    
    setTimeout(() => {
        player.mesh.visible = true;
        resetLevel();
    }, 1000);
}
```

---

## 📝 Étape 4.4 : Optimisation (30 min)

### **Object Pooling pour les particules**

```javascript
const PARTICLE_POOL_SIZE = 100;
let particlePool = [];

function initParticlePool() {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const particle = new Particle(0, 0, 0);
        particle.mesh.visible = false;
        particle.isAlive = false;
        particlePool.push(particle);
    }
}

function getParticleFromPool(x, y, z, color) {
    // Chercher une particule morte
    let particle = particlePool.find(p => !p.isAlive);
    
    // Si aucune disponible, créer une nouvelle
    if (!particle) {
        particle = new Particle(x, y, z, color);
        particlePool.push(particle);
    } else {
        // Réinitialiser la particule
        particle.mesh.position.set(x, y, z);
        particle.mesh.material.color.setHex(color);
        particle.mesh.material.opacity = 1;
        particle.mesh.visible = true;
        particle.age = 0;
        particle.isAlive = true;
        
        particle.velocity.set(
            (Math.random() - 0.5) * 5,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 5
        );
    }
    
    return particle;
}

function createParticleBurst(x, y, z, count = 10, color = 0xffffff) {
    for (let i = 0; i < count; i++) {
        const particle = getParticleFromPool(x, y, z, color);
        if (!particles.includes(particle)) {
            particles.push(particle);
        }
    }
}
```

### **Appeler dans init()**

```javascript
function init() {
    setupThreeJS();
    createPlayer();
    setupLights();
    setupControls();
    
    initParticlePool();  // ← AJOUTER ICI
    
    loadLevel(LEVEL_ORDER[0]);
    
    gameLoop();
}
```

---

## 📝 Étape 4.5 : Ajouter à update() (10 min)

```javascript
function update(dt) {
    handleInput(dt);
    applyPhysics(dt);
    checkCollisions();
    updateCollectibles(dt);
    updateMovingPlatforms(dt);
    updateEnemies(dt);
    updateParticles(dt);  // ← AJOUTER ICI
    updateGoal(dt);
    updateCamera();
}
```

---

## ✅ Checklist Phase 4

- [ ] Créer la classe Particle
- [ ] Créer createParticleBurst()
- [ ] Créer updateParticles()
- [ ] Ajouter particules lors de collecte (or)
- [ ] Ajouter particules lors d'atterrissage (gris)
- [ ] Ajouter particules lors de mort (rouge)
- [ ] Implémenter l'object pooling
- [ ] Ajouter à update()
- [ ] Tester toutes les particules

---

# 🎯 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

## Jour 1 (3-4h)
1. ✅ Phase 1 : UI & Scoring (2-3h)
2. ✅ Phase 2 : Plateformes Mobiles (2h)

## Jour 2 (4-5h)
3. ✅ Phase 3 : Système d'Ennemis (4-5h)

## Jour 3 (2-3h)
4. ✅ Phase 4 : Particules (2-3h)

---

# 📊 APRÈS CHAQUE PHASE

### **Tests à effectuer**

**Phase 1 :**
- [ ] Le score s'affiche et se met à jour
- [ ] Le nom du niveau s'affiche
- [ ] Le compteur de collectibles fonctionne

**Phase 2 :**
- [ ] Les plateformes bougent correctement
- [ ] Le joueur bouge avec la plateforme
- [ ] Les 3 types de mouvement fonctionnent

**Phase 3 :**
- [ ] Les 4 types d'ennemis fonctionnent
- [ ] Collision = mort
- [ ] Les ennemis sont visuellement distincts

**Phase 4 :**
- [ ] Particules lors de collecte
- [ ] Particules lors d'atterrissage
- [ ] Particules lors de mort
- [ ] Pas de lag (object pooling)

---

# 🐛 DEBUGGING

### **Problèmes courants**

**HUD ne s'affiche pas :**
- Vérifier les IDs HTML
- Vérifier z-index CSS
- Console.log() les valeurs

**Plateformes mobiles saccadées :**
- Utiliser deltaTime
- Vérifier que updateMovingPlatforms() est appelé

**Ennemis ne bougent pas :**
- Vérifier que updateEnemies() est appelé
- Console.log() dans update() de Enemy

**Particules ne disparaissent pas :**
- Vérifier le système de nettoyage
- Vérifier particle.isAlive

---

# 📝 NOTES FINALES

- Commiter après chaque phase
- Tester fréquemment
- Garder une version fonctionnelle à tout moment
- Documenter au fur et à mesure

**Bonne chance ! 🚀**