# Roadmap : Système d'Animation Complexe du Player

## Vue d'Ensemble

Ce document décrit l'implémentation d'un système d'animation avancé pour le player avec des effets multi-étapes, des états d'animation, et des effets visuels complémentaires (particules, trail).

**Complexité estimée** : 50-100 lignes de code
**Temps d'implémentation estimé** : 2-4 heures
**Dépendances** : GSAP (déjà importé), Three.js

---

## Architecture du Système

### 1. États d'Animation

Le système repose sur une machine à états pour gérer les différentes phases du saut :

```javascript
const PLAYER_STATES = {
    IDLE: 'idle',           // Au sol, immobile
    RUNNING: 'running',     // Au sol, en mouvement
    JUMP_ANTICIPATION: 'jump_anticipation',  // 0.1s avant le saut
    JUMP_RISING: 'jump_rising',              // Montée
    JUMP_APEX: 'jump_apex',                  // Point culminant
    JUMP_FALLING: 'jump_falling',            // Descente
    LANDING: 'landing'                       // 0.2s après atterrissage
};
```

### 2. Variables d'État du Player

Ajouter aux propriétés du player (dans `createPlayer()`) :

```javascript
player = {
    mesh: playerMesh,
    velocity: new THREE.Vector3(0, 0, 0),
    isGrounded: false,
    canJump: true,

    // NOUVELLES PROPRIÉTÉS
    animationState: 'idle',
    previousState: 'idle',
    stateTimer: 0,              // Temps dans l'état actuel
    jumpPhase: 0,               // 0-1 pour interpolation
    baseScale: new THREE.Vector3(1, 1, 1),
    baseRotation: new THREE.Euler(0, 0, 0),
    visualMesh: playerMesh,     // Référence pour animations
    isAnimating: false          // Empêche animations concurrentes
};
```

---

## Phase 1 : Anticipation du Saut (Jump Anticipation)

**Durée** : 100-150ms
**Déclenchement** : Quand le joueur appuie sur Espace

### Animation

1. **Squash (Écrasement)** :
   - Scale Y : 1.0 → 0.7 (compression verticale)
   - Scale X/Z : 1.0 → 1.15 (expansion horizontale)

2. **Rotation préparatoire** :
   - Rotation X : -10° (légère inclinaison arrière)

3. **Position** :
   - Y : -0.1 (légère descente)

### Implémentation GSAP

```javascript
function playJumpAnticipation() {
    player.animationState = 'jump_anticipation';

    const timeline = gsap.timeline({
        onComplete: () => executeJump()
    });

    timeline.to(player.mesh.scale, {
        x: 1.15,
        y: 0.7,
        z: 1.15,
        duration: 0.1,
        ease: "power2.in"
    });

    timeline.to(player.mesh.rotation, {
        x: -0.174, // -10 degrés en radians
        duration: 0.1,
        ease: "power2.in"
    }, 0); // Simultané avec scale

    timeline.to(player.mesh.position, {
        y: player.mesh.position.y - 0.1,
        duration: 0.1,
        ease: "power2.in"
    }, 0);
}
```

---

## Phase 2 : Montée (Jump Rising)

**Durée** : Variable (basée sur JUMP_FORCE et gravité)
**Déclenchement** : Après l'anticipation, quand velocity.y > 0

### Animation

1. **Stretch (Étirement)** :
   - Scale Y : 0.7 → 1.3 (étirement vertical)
   - Scale X/Z : 1.15 → 0.85 (compression horizontale)

2. **Rotation aérienne** :
   - Rotation X : -10° → 360° + 20° (rotation complète + excès)
   - Ou rotation Z si mouvement latéral (effet de vrille)

3. **Correction de position** :
   - Retour à la position réelle (annuler le -0.1 de l'anticipation)

### Implémentation

```javascript
function playJumpRising() {
    player.animationState = 'jump_rising';

    // Étirement progressif
    gsap.to(player.mesh.scale, {
        x: 0.85,
        y: 1.3,
        z: 0.85,
        duration: 0.2,
        ease: "power2.out"
    });

    // Rotation complète
    gsap.to(player.mesh.rotation, {
        x: Math.PI * 2 + 0.349, // 360° + 20°
        duration: 0.5,
        ease: "power1.inOut"
    });

    // Correction position
    gsap.to(player.mesh.position, {
        y: player.mesh.position.y + 0.1,
        duration: 0.05,
        ease: "power2.out"
    });
}
```

### Rotation Contextuelle

Si le joueur bouge latéralement pendant le saut, ajouter une rotation Z :

```javascript
// Dans playJumpRising()
const lateralVelocity = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2);

if (lateralVelocity > 2) {
    const direction = player.velocity.x > 0 ? 1 : -1;
    gsap.to(player.mesh.rotation, {
        z: direction * Math.PI * 0.5, // 90° dans la direction du mouvement
        duration: 0.3,
        ease: "power2.out"
    });
}
```

---

## Phase 3 : Apex (Point Culminant)

**Durée** : 50-100ms
**Déclenchement** : Quand velocity.y passe de positif à négatif

### Animation

1. **Pause visuelle** :
   - Scale : Retour progressif vers 1.0 sur tous les axes
   - Rotation : Ralentissement (ease out)

2. **Effet de suspension** :
   - Légère dilatation du temps (time scale à 0.8)

### Implémentation

```javascript
function playJumpApex() {
    player.animationState = 'jump_apex';

    gsap.to(player.mesh.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.1,
        ease: "sine.inOut"
    });

    // Ralentir la rotation
    gsap.to(player.mesh.rotation, {
        x: Math.PI * 2, // Finir à une rotation complète
        duration: 0.1,
        ease: "power4.out"
    });
}
```

---

## Phase 4 : Chute (Jump Falling)

**Durée** : Variable (jusqu'à l'atterrissage)
**Déclenchement** : Quand velocity.y < -2

### Animation

1. **Compression progressive** :
   - Scale Y : 1.0 → 0.9 (préparation à l'impact)
   - Scale X/Z : 1.0 → 1.05

2. **Rotation de stabilisation** :
   - Rotation X : Retour à 0° (position droite)
   - Rotation Z : Retour à 0°

3. **Anticipation de l'impact** :
   - Légère inclinaison vers le bas

### Implémentation

```javascript
function playJumpFalling() {
    player.animationState = 'jump_falling';

    gsap.to(player.mesh.scale, {
        x: 1.05,
        y: 0.9,
        z: 1.05,
        duration: 0.2,
        ease: "power2.in"
    });

    gsap.to(player.mesh.rotation, {
        x: 0,
        z: 0,
        duration: 0.15,
        ease: "power2.out"
    });
}
```

---

## Phase 5 : Atterrissage (Landing)

**Durée** : 200-300ms
**Déclenchement** : Quand player.isGrounded passe à true

### Animation

1. **Squash d'impact** :
   - Scale Y : 0.9 → 0.6 (écrasement fort)
   - Scale X/Z : 1.05 → 1.3 (expansion latérale)
   - Durée : 80ms

2. **Rebond élastique** :
   - Scale Y : 0.6 → 1.1 → 1.0
   - Scale X/Z : 1.3 → 0.95 → 1.0
   - Ease : elastic.out
   - Durée : 220ms

3. **Effets secondaires** :
   - Particules de poussière au point d'impact
   - Légère secousse de caméra (screen shake)

### Implémentation

```javascript
function playLanding() {
    player.animationState = 'landing';

    const timeline = gsap.timeline({
        onComplete: () => {
            player.animationState = 'idle';
            player.isAnimating = false;
        }
    });

    // Impact
    timeline.to(player.mesh.scale, {
        x: 1.3,
        y: 0.6,
        z: 1.3,
        duration: 0.08,
        ease: "power2.in"
    });

    // Rebond élastique
    timeline.to(player.mesh.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.22,
        ease: "elastic.out(1, 0.5)"
    });

    // Effet de poussière
    spawnLandingParticles(player.mesh.position);

    // Secousse caméra
    shakeCamera(0.15, 0.1);
}
```

---

## Système de Gestion des États

### Détection des Transitions

Ajouter dans la fonction `update()` :

```javascript
function updatePlayerAnimationState(dt) {
    const prevState = player.animationState;

    // Détecter les transitions
    if (player.isGrounded && Math.abs(player.velocity.x) < 0.1 && Math.abs(player.velocity.z) < 0.1) {
        player.animationState = 'idle';

    } else if (player.isGrounded && (Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1)) {
        player.animationState = 'running';

    } else if (!player.isGrounded && player.velocity.y > 5) {
        player.animationState = 'jump_rising';

    } else if (!player.isGrounded && player.velocity.y > -0.5 && player.velocity.y < 0.5) {
        player.animationState = 'jump_apex';

    } else if (!player.isGrounded && player.velocity.y < -2) {
        player.animationState = 'jump_falling';
    }

    // Si transition détectée
    if (prevState !== player.animationState) {
        onStateChange(prevState, player.animationState);
    }

    player.stateTimer += dt;
}

function onStateChange(oldState, newState) {
    console.log(`State transition: ${oldState} → ${newState}`);

    // Annuler les animations en cours
    gsap.killTweensOf(player.mesh.scale);
    gsap.killTweensOf(player.mesh.rotation);

    // Déclencher la nouvelle animation
    switch(newState) {
        case 'jump_rising':
            playJumpRising();
            break;
        case 'jump_apex':
            playJumpApex();
            break;
        case 'jump_falling':
            playJumpFalling();
            break;
        case 'landing':
            playLanding();
            break;
        case 'running':
            playRunning();
            break;
        case 'idle':
            playIdle();
            break;
    }
}
```

---

## Effets Visuels Complémentaires

### 1. Particules de Poussière à l'Atterrissage

```javascript
function spawnLandingParticles(position) {
    const particleCount = 8;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(geometry, material);

        // Position au point d'impact
        particle.position.copy(position);
        particle.position.y = 0.1; // Légèrement au-dessus du sol

        scene.add(particle);
        particles.push(particle);

        // Animation de dispersion
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 1 + Math.random() * 0.5;

        gsap.to(particle.position, {
            x: position.x + Math.cos(angle) * distance,
            y: position.y + Math.random() * 0.5,
            z: position.z + Math.sin(angle) * distance,
            duration: 0.5,
            ease: "power2.out"
        });

        gsap.to(particle.material, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            }
        });
    }
}
```

### 2. Trail (Traînée) Pendant le Saut

Option A : Clones fantômes qui disparaissent

```javascript
let trailInterval = null;

function startJumpTrail() {
    trailInterval = setInterval(() => {
        if (!player.isGrounded) {
            const ghost = player.mesh.clone();
            ghost.material = ghost.material.clone();
            ghost.material.transparent = true;
            ghost.material.opacity = 0.3;

            scene.add(ghost);

            gsap.to(ghost.material, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    scene.remove(ghost);
                    ghost.geometry.dispose();
                    ghost.material.dispose();
                }
            });
        }
    }, 50); // Nouveau ghost toutes les 50ms
}

function stopJumpTrail() {
    if (trailInterval) {
        clearInterval(trailInterval);
        trailInterval = null;
    }
}
```

Option B : Line Trail (THREE.Line)

```javascript
class JumpTrail {
    constructor() {
        this.points = [];
        this.maxPoints = 20;
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.LineBasicMaterial({
            color: 0x4CAF50,
            transparent: true,
            opacity: 0.6
        });
        this.line = new THREE.Line(this.geometry, this.material);
        scene.add(this.line);
    }

    update(position) {
        this.points.push(position.clone());

        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }

        const positions = new Float32Array(this.points.length * 3);
        this.points.forEach((p, i) => {
            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
        });

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.attributes.position.needsUpdate = true;
    }

    clear() {
        this.points = [];
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
    }
}

// Utilisation
const jumpTrail = new JumpTrail();

// Dans update()
if (!player.isGrounded) {
    jumpTrail.update(player.mesh.position);
} else {
    jumpTrail.clear();
}
```

### 3. Secousse de Caméra (Camera Shake)

```javascript
let cameraShakeActive = false;
let cameraBasePosition = new THREE.Vector3();

function shakeCamera(intensity = 0.2, duration = 0.2) {
    if (cameraShakeActive) return;

    cameraShakeActive = true;
    cameraBasePosition.copy(camera.position);

    const shakeCount = Math.floor(duration / 0.05); // Shake toutes les 50ms
    let currentShake = 0;

    const shakeInterval = setInterval(() => {
        if (currentShake >= shakeCount) {
            clearInterval(shakeInterval);
            camera.position.copy(cameraBasePosition);
            cameraShakeActive = false;
            return;
        }

        const decay = 1 - (currentShake / shakeCount);
        const offsetX = (Math.random() - 0.5) * intensity * decay;
        const offsetY = (Math.random() - 0.5) * intensity * decay;

        camera.position.x = cameraBasePosition.x + offsetX;
        camera.position.y = cameraBasePosition.y + offsetY;

        currentShake++;
    }, 50);
}
```

---

## Animation au Ralenti (Running)

Quand le joueur court au sol :

```javascript
function playRunning() {
    // Oscillation verticale (bobbing)
    if (!player.runningAnimation) {
        player.runningAnimation = gsap.to(player.mesh.position, {
            y: player.mesh.position.y + 0.1,
            duration: 0.3,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
    }

    // Légère rotation latérale
    const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2);
    if (speed > 1) {
        gsap.to(player.mesh.rotation, {
            z: Math.sin(Date.now() * 0.01) * 0.1,
            duration: 0.2,
            ease: "sine.inOut"
        });
    }
}

function stopRunning() {
    if (player.runningAnimation) {
        player.runningAnimation.kill();
        player.runningAnimation = null;

        gsap.to(player.mesh.position, {
            y: PLAYER_SIZE / 2,
            duration: 0.2
        });

        gsap.to(player.mesh.rotation, {
            z: 0,
            duration: 0.2
        });
    }
}
```

---

## Animation Idle

Respiration subtile quand le joueur est immobile :

```javascript
function playIdle() {
    if (!player.idleAnimation) {
        player.idleAnimation = gsap.to(player.mesh.scale, {
            y: 1.05,
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
    }
}

function stopIdle() {
    if (player.idleAnimation) {
        player.idleAnimation.kill();
        player.idleAnimation = null;

        gsap.to(player.mesh.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.3
        });
    }
}
```

---

## Intégration dans le Code Existant

### Modifications dans `handleInput()`

```javascript
// Ligne 457-466 (gestion du saut)
if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || keys['KeyZ']) && player.isGrounded && player.canJump) {
    // NOUVEAU : Lancer l'animation d'anticipation
    player.isAnimating = true;
    playJumpAnticipation();

    // La fonction executeJump() sera appelée par le callback de l'animation
    // (ne plus appliquer le saut immédiatement)
}

function executeJump() {
    // DÉTACHER du parent avant de sauter
    if (player.mesh.parent !== scene) {
        scene.attach(player.mesh);
    }

    player.velocity.y = JUMP_FORCE;
    player.isGrounded = false;
    player.canJump = false;

    // Lancer l'animation de montée
    playJumpRising();

    // Démarrer le trail
    startJumpTrail();
}
```

### Modifications dans `checkCollisions()`

```javascript
// Ligne 675-679 (détection d'atterrissage)
if (player.velocity.y < 0) {
    const resolved = resolveVerticalCollision(platform, platformBox, playerWorldPos);
    if (resolved) {
        standingOnPlatform = platform;

        // NOUVEAU : Si on vient d'atterrir après un saut
        if (player.previousState === 'jump_falling') {
            playLanding();
            stopJumpTrail();

            // Effet visuel
            spawnLandingParticles(player.mesh.position);
            shakeCamera(0.15, 0.1);
        }
    }
}
```

### Ajout dans `update()`

```javascript
function update(dt) {
    handleInput(dt);
    updateMovingPlatforms(dt);
    applyPhysics(dt);
    checkCollisions();

    // NOUVEAU : Mise à jour du système d'animation
    updatePlayerAnimationState(dt);

    updateCollectibles(dt);
    updateGoal(dt);
    updateCamera();
    debugPlayer();
}
```

---

## Système de Debug pour les Animations

Ajouter à la touche de debug (KeyP) :

```javascript
if (debugMode) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 [DEBUG] État du joueur');
    console.log('   Animation State:', player.animationState);
    console.log('   State Timer:', player.stateTimer.toFixed(2), 's');
    console.log('   Is Animating:', player.isAnimating);
    console.log('   Scale:', player.mesh.scale.toArray().map(v => v.toFixed(2)));
    console.log('   Rotation:', player.mesh.rotation.toArray().slice(0, 3).map(v => (v * 180 / Math.PI).toFixed(1)));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
```

---

## Structure des Fichiers

### Organisation Recommandée

Si le fichier `main.js` devient trop grand (>1000 lignes), envisager de séparer :

```
src/
├── main.js                      # Point d'entrée
├── player/
│   ├── playerAnimations.js     # Toutes les fonctions d'animation
│   ├── playerState.js           # Machine à états
│   └── playerEffects.js         # Particules, trail, shake
├── systems/
│   ├── collision.js
│   └── physics.js
└── levels/
    └── levelData.js
```

Mais pour l'instant, tout peut rester dans `main.js` avec des sections bien délimitées.

---

## Performance

### Optimisations à Considérer

1. **Object Pooling pour les Particules** :
   - Réutiliser les objets au lieu de les créer/détruire
   - Pool de 20-30 particules pré-créées

2. **Limiter les Tweens Simultanés** :
   - Maximum 3-4 tweens GSAP actifs en même temps
   - Utiliser `gsap.killTweensOf()` pour annuler les anciens

3. **Trail Performance** :
   - Option A (clones) : Max 5-6 clones simultanés
   - Option B (line) : Préférable, 1 seul objet mis à jour

4. **Camera Shake** :
   - Désactiver si FPS < 30
   - Utiliser un flag pour éviter les shakes cumulés

---

## Estimation de Complexité Finale

**Lignes de code par composant** :

- Système d'états : ~50 lignes
- Animations GSAP (5 états) : ~120 lignes
- Particules d'atterrissage : ~40 lignes
- Trail système : ~60 lignes
- Camera shake : ~30 lignes
- Intégration/modifications : ~40 lignes

**Total : ~340 lignes de code**

**Temps d'implémentation** :
- Système d'états : 30 min
- Animations de base : 1h
- Effets visuels : 1h
- Polish & debug : 1h

**Total : 3-4 heures**

---

## Prochaines Étapes (Post-Implémentation)

1. **Ajustement des Timings** : Tweaker les durées et eases pour le meilleur feeling
2. **Sons** : Ajouter des effets sonores pour chaque phase (whoosh, impact)
3. **Variations** : Double-saut avec animation différente
4. **Wall Jump** : Animation spéciale pour saut mural
5. **Dash** : Animation de dash horizontal avec trail

---

## Conclusion

Ce système d'animation complexe transformera le jeu d'un platformer fonctionnel en une expérience visuelle riche et satisfaisante. Chaque composant peut être implémenté et testé indépendamment, permettant une approche itérative.

**Recommandation** : Commencer par l'option 3 (GSAP simple) pour valider l'approche, puis évoluer progressivement vers ce système complet si le temps le permet.
