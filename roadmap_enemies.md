# Roadmap : Système d'Ennemis Complet

## Vue d'Ensemble

Ce document détaille l'implémentation du système d'ennemis pour le jeu de plateforme 3D, incluant la **Phase 3** (ennemis de base) et la **Phase 5** (extensions avancées).

**Phase 3** : 4-5 heures (~450-500 lignes)
**Phase 5** : 3-4 heures (~300-350 lignes)
**Total** : 7-9 heures

---

# 📍 PHASE 3 : SYSTÈME D'ENNEMIS DE BASE (4-5h)

## 🎯 Objectifs
- 4 types d'ennemis de base
- Collision = mort du joueur
- Système modulaire et extensible

---

## Structure de la Classe Enemy

**Emplacement** : Après les factory functions dans main.js (après `createGoal()`)

```javascript
// ========================================
// CONSTANTES ENNEMIS
// ========================================
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
// CLASSE ENEMY
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

// ========================================
// FONCTIONS DE GESTION DES ENNEMIS
// ========================================

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
```

---

## Intégration au Jeu

### 1. Variables Globales

```javascript
// Ajouter dans VARIABLES GLOBALES (ligne ~40)
let enemies = [];
```

### 2. Données de Niveau

```javascript
// Dans LEVELS (ligne ~43-110)
const LEVELS = {
    tutorial: {
        // ... existing ...
        enemies: [
            { x: 12, y: 2, z: 0, type: 'static' },
            { x: 20, y: 1, z: 0, type: 'patrol', range: 6, speed: 1.5 },
            { x: 28, y: 4, z: 0, type: 'flying', range: 3, speed: 1, height: 2 },
            { x: 38, y: 2, z: 0, type: 'chaser', speed: 3.5, chaseRadius: 12 }
        ],
        // ...
    }
};
```

### 3. Modifier loadLevel()

```javascript
// Dans loadLevel(), ajouter :
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
```

### 4. Modifier clearLevel()

```javascript
// Dans clearLevel(), ajouter :
enemies.forEach(enemy => enemy.destroy());
enemies = [];
```

### 5. Ajouter à update()

```javascript
// Dans update() (ligne ~875)
function update(dt) {
    handleInput(dt);
    updateMovingPlatforms(dt);
    applyPhysics(dt);
    checkCollisions();
    updateCollectibles(dt);
    updateEnemies(dt);  // ← AJOUTER ICI
    updateGoal(dt);
    updateCamera();
    debugPlayer();
}
```

---

## ✅ Checklist Phase 3

- [ ] Ajouter constantes ENEMY_COLORS, ENEMY_SIZES, ENEMY_COLLISION_RADIUS
- [ ] Ajouter variable globale `enemies = []`
- [ ] Créer la classe Enemy complète
- [ ] Implémenter updateStatic()
- [ ] Implémenter updatePatrol()
- [ ] Implémenter updateFlying()
- [ ] Implémenter updateChaser()
- [ ] Créer createEnemy()
- [ ] Créer updateEnemies()
- [ ] Créer handlePlayerDeath()
- [ ] Ajouter enemies aux LEVELS
- [ ] Modifier loadLevel()
- [ ] Modifier clearLevel()
- [ ] Ajouter updateEnemies() dans update()
- [ ] Tester chaque type d'ennemi

---

# 📍 PHASE 5 : EXTENSIONS & AMÉLIORATIONS (3-4h)

## 🎯 Objectifs
- Nouveaux types d'ennemis avancés (JUMPER, TELEPORTER)
- Système de vie du joueur (3 cœurs)
- Ennemis destructibles (saut sur la tête)
- Système de combo/score

---

## Nouveaux Types d'Ennemis

### Type 5: JUMPER (Sauteur)

**Ajouter à ENEMY_COLORS** :
```javascript
jumper: 0xffcc00  // Jaune
```

**Dans Enemy.update(), ajouter** :
```javascript
case 'jumper':
    this.updateJumper(dt);
    break;
```

**Nouvelle méthode** :
```javascript
updateJumper(dt) {
    if (!this.jumpVelocity) this.jumpVelocity = 0;

    const jumpInterval = this.config.jumpInterval || 2;

    if (this.time % jumpInterval < dt && this.mesh.position.y <= this.startPos.y + 0.1) {
        this.jumpVelocity = this.config.jumpForce || 10;
    }

    // Gravité
    this.jumpVelocity -= 20 * dt;
    this.mesh.position.y += this.jumpVelocity * dt;

    // Collision sol
    if (this.mesh.position.y <= this.startPos.y) {
        this.mesh.position.y = this.startPos.y;
        this.jumpVelocity = 0;
    }

    this.mesh.position.x = this.startPos.x;
    this.mesh.position.z = this.startPos.z;
}
```

**Utilisation** :
```javascript
{ x: 25, y: 2, z: 0, type: 'jumper', jumpInterval: 1.5, jumpForce: 12 }
```

---

### Type 6: TELEPORTER (Téléporteur)

**Couleur** :
```javascript
teleporter: 0x00ffff  // Cyan
```

**Dans switch** :
```javascript
case 'teleporter':
    this.updateTeleporter(dt);
    break;
```

**Méthode** :
```javascript
updateTeleporter(dt) {
    const teleportInterval = this.config.teleportInterval || 3;

    if (this.time % teleportInterval < dt) {
        const randomX = this.startPos.x + (Math.random() - 0.5) * this.config.range;
        const randomZ = this.startPos.z + (Math.random() - 0.5) * this.config.range;

        gsap.to(this.mesh.scale, {
            x: 0, y: 0, z: 0,
            duration: 0.2,
            ease: "back.in",
            onComplete: () => {
                this.mesh.position.x = randomX;
                this.mesh.position.z = randomZ;

                gsap.to(this.mesh.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 0.3,
                    ease: "back.out"
                });
            }
        });
    }

    this.mesh.position.y = this.startPos.y + Math.sin(this.time * 2) * 0.2;
}
```

**Utilisation** :
```javascript
{ x: 30, y: 3, z: 0, type: 'teleporter', range: 10, teleportInterval: 2.5 }
```

---

## Système de Vie

### Variables Globales

```javascript
let playerHealth = 3;
let maxHealth = 3;
let playerInvincible = false;
```

### Modifier handlePlayerDeath() → handlePlayerHit()

```javascript
function handlePlayerHit() {
    if (playerInvincible) return;

    playerHealth--;
    updateHealthHUD();

    console.log(`💔 Touché! Vie: ${playerHealth}`);

    if (playerHealth <= 0) {
        handlePlayerDeath();
        playerHealth = maxHealth;
    } else {
        // Invincibilité 2s
        playerInvincible = true;

        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            player.mesh.visible = !player.mesh.visible;
            blinkCount++;

            if (blinkCount >= 10) {
                clearInterval(blinkInterval);
                player.mesh.visible = true;
                playerInvincible = false;
            }
        }, 200);
    }
}

function handlePlayerDeath() {
    console.log('💀 Game Over!');
    player.mesh.visible = false;

    setTimeout(() => {
        player.mesh.visible = true;
        playerHealth = maxHealth;
        resetLevel();
    }, 1500);
}
```

### HUD des Cœurs

**HTML** (dans index.html) :
```html
<div id="health-display">
    <span id="hearts"></span>
</div>
```

**CSS** (dans style.scss) :
```css
#health-display {
    background: rgba(0, 0, 0, 0.7);
    padding: 10px 20px;
    border-radius: 8px;
    border: 2px solid #ff4444;
    font-size: 24px;
}
```

**JavaScript** :
```javascript
function updateHealthHUD() {
    const heartsDisplay = document.getElementById('hearts');
    heartsDisplay.textContent = '❤️'.repeat(playerHealth) + '🖤'.repeat(maxHealth - playerHealth);
}

// Dans loadLevel()
playerHealth = maxHealth;
updateHealthHUD();
```

---

## Ennemis Destructibles

### Modifier checkCollisionWithPlayer()

```javascript
checkCollisionWithPlayer() {
    if (!this.isActive || !player) return { hit: false, destroyed: false };

    const playerWorldPos = new THREE.Vector3();
    player.mesh.getWorldPosition(playerWorldPos);

    const distance = this.mesh.position.distanceTo(playerWorldPos);

    if (distance < ENEMY_COLLISION_RADIUS) {
        const isAbove = playerWorldPos.y > this.mesh.position.y + 0.4;
        const isFalling = player.velocity.y < 0;

        if (isAbove && isFalling) {
            return { hit: false, destroyed: true };
        } else {
            return { hit: true, destroyed: false };
        }
    }

    return { hit: false, destroyed: false };
}
```

### Nouvelle méthode onDestroyed()

```javascript
onDestroyed() {
    console.log('⭐ Ennemi détruit! +50');
    score += 50;
    updateHUD();

    // Particules (si Phase 4 implémentée)
    if (typeof createParticleBurst === 'function') {
        createParticleBurst(
            this.mesh.position.x,
            this.mesh.position.y,
            this.mesh.position.z,
            25,
            ENEMY_COLORS[this.type]
        );
    }

    // Rebond
    player.velocity.y = JUMP_FORCE * 0.6;

    // Animation
    gsap.to(this.mesh.scale, {
        x: 0, y: 0, z: 0,
        duration: 0.2,
        ease: "back.in",
        onComplete: () => this.destroy()
    });
}
```

### Modifier updateEnemies()

```javascript
function updateEnemies(dt) {
    enemies.forEach((enemy, index) => {
        enemy.update(dt);

        const collision = enemy.checkCollisionWithPlayer();

        if (collision.destroyed) {
            enemy.onDestroyed();
            enemies.splice(index, 1);
        } else if (collision.hit) {
            handlePlayerHit();
        }
    });
}
```

---

## Système de Combo

### Variables

```javascript
let comboCount = 0;
let comboTimer = 0;
let comboMultiplier = 1;
```

### updateCombo()

```javascript
function updateCombo(dt) {
    if (comboTimer > 0) {
        comboTimer -= dt;

        if (comboTimer <= 0) {
            if (comboCount > 0) {
                console.log(`🎉 Combo x${comboCount} terminé!`);
            }
            comboCount = 0;
            comboMultiplier = 1;
            updateComboHUD();
        }
    }
}

// Dans update()
updateCombo(dt);
```

### incrementCombo()

```javascript
function incrementCombo() {
    comboCount++;
    comboTimer = 3;
    comboMultiplier = 1 + (comboCount * 0.5);

    const bonus = Math.floor(50 * comboMultiplier);
    score += bonus;

    console.log(`🔥 COMBO x${comboCount}! +${bonus}`);
    updateHUD();
    updateComboHUD();
}

// Dans onDestroyed()
incrementCombo();
```

### HUD du Combo

**HTML** :
```html
<div id="combo-display" style="display: none;">
    <span id="combo-text">COMBO x0</span>
</div>
```

**CSS** :
```css
#combo-display {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 100, 0, 0.9);
    padding: 20px 40px;
    border-radius: 15px;
    font-size: 48px;
    font-weight: bold;
    color: white;
    text-shadow: 0 0 20px rgba(255, 100, 0, 1);
    animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
}
```

**JavaScript** :
```javascript
function updateComboHUD() {
    const comboDisplay = document.getElementById('combo-display');
    const comboText = document.getElementById('combo-text');

    if (comboCount > 1) {
        comboDisplay.style.display = 'block';
        comboText.textContent = `COMBO x${comboCount}`;
    } else {
        comboDisplay.style.display = 'none';
    }
}
```

---

## ✅ Checklist Phase 5

### Nouveaux Ennemis
- [ ] Implémenter JUMPER
- [ ] Implémenter TELEPORTER
- [ ] Ajouter couleurs
- [ ] Tester

### Système de Vie
- [ ] Variables health
- [ ] handlePlayerHit()
- [ ] updateHealthHUD()
- [ ] HTML/CSS cœurs
- [ ] Tester invincibilité

### Destructibles
- [ ] Modifier checkCollisionWithPlayer()
- [ ] Créer onDestroyed()
- [ ] Modifier updateEnemies()
- [ ] Tester saut sur tête

### Combo
- [ ] Variables combo
- [ ] updateCombo()
- [ ] incrementCombo()
- [ ] HUD combo
- [ ] Tester enchaînement

---

## Estimation Finale

**Phase 3** : 4-5h (~450 lignes)
**Phase 5** : 3-4h (~300 lignes)

**Total** : 7-9h (~750 lignes)

Système d'ennemis complet, extensible et fun ! 🎮🚀
