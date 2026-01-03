# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D platformer game built with Three.js and Vite. The player controls a character navigating through levels with platforms, collectibles, moving platforms, and a goal, using physics-based movement with jumping and gravity.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## Architecture

### Single-File Architecture

The entire game logic is contained in `main.js` with a functional/procedural approach organized into clear sections:

**Constants** (lines 4-20):
- Physics constants: `GRAVITY` (20), `JUMP_FORCE` (12), `MOVE_SPEED` (8), `PLAYER_SIZE` (1)
- Platform colors by type (start, normal, jump-intro, height-intro, rhythm, goal)

**Variables Globales** (lines 22-38):
- Scene, camera, renderer, player object
- Arrays: platforms, movingPlatforms, collectibles
- Input tracking: `keys` object
- Game state: score, currentLevelIndex, totalCollectibles, collectedCount
- Debug: debugFrameCount, debugMode

**Level Data** (lines 40-112):
- `LEVELS` object contains level definitions (tutorial, level1, level2)
- Each level specifies:
  - `platforms`: Static platforms (position, size, type)
  - `movingPlatforms`: Moving platforms (position, size, type, speed, range)
  - `collectibles`: Collectible positions
  - `playerStart`: Initial player position
  - `goal`: Goal position
- `LEVEL_ORDER` array defines level sequence

**Core Systems**:

1. **Initialization** (lines 117-158):
   - `init()` orchestrates setup
   - `setupThreeJS()` creates scene with fog, camera, renderer with shadows
   - Window resize handling

2. **Player System** (lines 167-187):
   - `createPlayer()` creates player mesh with physics properties
   - Player object structure: { mesh, velocity, isGrounded, canJump }

3. **Factory Functions** (lines 190-287):
   - `createPlatform(x, y, z, w, h, d, type)` - creates platforms with color-coded types
   - `createCollectible(x, y, z)` - creates golden spheres worth 10 points
   - `createGoal(x, y, z)` - creates green cylinder goal marker
   - `createMovingPlatform(x, y, z, w, h, d, config)` - creates moving platforms with userData for movement

4. **Level Management** (lines 290-393):
   - `loadLevel(levelName)` - clears and loads level data including moving platforms
   - `clearLevel()` - removes all scene objects
   - `nextLevel()` - advances to next level with 1s delay
   - `resetLevel()` - reloads current level
   - `showVictoryScreen()` - displays victory message and restarts after 3s
   - `updateHUD()` - updates score, collectibles count, and level name display

5. **Lighting** (lines 414-430):
   - Ambient light (0.6 intensity) + Directional light (0.8 intensity)
   - Shadow mapping with 2048x2048 resolution

6. **Input System** (lines 433-481):
   - WASD/Arrow keys for movement (A/Q for left, D for right)
   - Space/W/Z/ArrowUp for jump (only when grounded)
   - Level shortcuts: Digit1-3 for quick level switching, KeyR for reset
   - **KeyP**: Toggle debug mode
   - `handleInput(dt)` applies input with friction (0.8 damping)
   - **Parent detachment on jump**: Player detaches from moving platforms when jumping

7. **Physics** (lines 483-495):
   - `applyPhysics(dt)` applies gravity and velocity
   - Terminal velocity capped at -50

8. **Collision Detection** (lines 498-723):
   - **Multi-Directional AABB Collision System** using `THREE.Box3` and Separating Axis Theorem (SAT)
   - **Helper Functions** (lines 501-545):
     - `calculateOverlapX/Y/Z()`: Calculate penetration depth on each axis
     - `getBoxCenter()`: Get center point of bounding box
     - `isPlayerAbovePlatform()`: Check if player is horizontally within platform bounds
   - **Collision Resolution Functions** (lines 547-652):
     - `resolveVerticalCollision()`: Handles landing on platforms from above
     - `resolveHorizontalCollisionX()`: Handles left/right collisions, stops X velocity
     - `resolveHorizontalCollisionZ()`: Handles front/back collisions, stops Z velocity
   - **Main Collision Logic** (lines 657-723):
     - First checks if player is **above** platform (horizontally within bounds)
     - **If above**: Only processes vertical collision (prevents spurious horizontal resolution)
     - **If on side**: Calculates overlap on all axes, resolves on minimum overlap axis
     - Handles collisions from ALL directions: top, bottom, left, right, front, back
   - **Parent-Child Attachment System**:
     - Mobile platforms attach player using `.attach()` (preserves world position)
     - Attaches only once per platform landing
     - Adjusts local Y position when already attached
   - **Smart Detachment**: Detaches when player leaves platform horizontally
   - **Moving platforms can push player**: Lateral collisions work with moving platforms
   - Goal collision (distance < 2) triggers nextLevel()
   - Fall respawn at y < -10 (uses world position)

9. **Collectibles** (lines 606-638):
   - Rotation animation (2 rad/s) and bobbing motion
   - Collection detection using **world position** (distance < 1)
   - Adds 10 to score
   - Console logging for feedback

10. **Moving Platforms** (lines 640-665):
    - `updateMovingPlatforms(dt)` updates platform positions
    - **Three movement types**:
      - `horizontal`: Sine wave movement on X axis
      - `vertical`: Sine wave movement on Y axis
      - `circular`: Circular movement on X-Z plane
    - Platform data stored in `userData`: type, speed, range, startPos, time

11. **Particle System**:
    - **Object Pooling Architecture**: Pre-allocates 300 particles (100 per shape) to avoid garbage collection
    - **Shared Geometries**: Single instances of SphereGeometry, BoxGeometry, ConeGeometry reused by all particles (~95% memory savings)
    - **Per-Shape Pools**: Separate pools for sphere, box, and cone particles (no shape switching needed)
    - **Performance Optimizations**:
      - `MeshBasicMaterial` by default (no lighting calculations)
      - `MeshStandardMaterial` only for emissive particles (death burst)
      - Shadows disabled on all particles
      - `transparent: true` required for fade-out effect

    **Classes**:
    - `Particle`: Individual particle with lifecycle (activate → update → deactivate → pool)
      - Fixed shape per particle (sphere, box, or cone)
      - Physics: velocity, gravity, rotation
      - Fade-out support with configurable lifetime
      - Uses shared geometries (never disposed)

    - `ParticleEmitter`: Continuous emission system
      - Rate-based emission (particles/second)
      - Can attach to objects (follows position)
      - Configurable spread, offset, particle properties
      - Used for player trail effect

    **Key Functions**:
    - `initParticleGeometries()`: Creates shared geometries (called BEFORE player creation)
    - `initParticlePool()`: Pre-allocates particle pool (300 particles)
    - `getParticleFromPool(x, y, z, config)`: Retrieves inactive particle or creates new if exhausted
    - `updateParticles(dt)`: Updates all active particles, filters out dead ones
    - `clearParticles()`: Deactivates all particles (called in clearLevel)
    - `createParticleBurst(x, y, z, count, config)`: Helper for explosion effects
    - `createEmitter(x, y, z, config)`: Creates continuous emitter
    - `updateEmitters(dt)`: Updates all active emitters
    - `clearEmitters()`: Destroys all emitters (called in clearLevel)

    **Particle Presets** (PARTICLE_PRESETS):
    - `collect`: Yellow spheres (collectible pickup)
    - `landing`: White boxes (hard landing, velocity < -5)
    - `death`: Red emissive spheres (player death)
    - `trail`: Green boxes (player movement trail)

    **Event Bursts**:
    - **Collectible pickup**: 15 yellow particles burst upward
    - **Hard landing**: 8 white particles if fall velocity > 5
    - **Player death**: 30 red emissive particles explosion

    **Player Trail**:
    - Created in `loadLevel()` after `clearLevel()` (important timing!)
    - Attaches to player mesh with `attachTo: player.mesh`
    - Activates when player velocity > 1 and grounded
    - 30 particles/second emission rate
    - Green box particles with 2s lifetime, no gravity

    **Important Notes**:
    - Particle system initialized BEFORE `createPlayer()` (geometries must exist first)
    - Player trail emitter created in `loadLevel()`, not `createPlayer()` (avoids clearLevel reset)
    - All particles use world coordinates (not parented to scene graph)
    - Pool dynamically expands with console warning if exhausted
    - Particle lifecycle: never destroyed, only reused

12. **Debug System** (lines 677-701):
    - `debugPlayer()` displays player state every 10 seconds when debugMode is active
    - Shows: world position, local position, parent (SCENE/PLATFORM), grounded state, velocity
    - Toggle with **KeyP**

13. **Camera** (lines 703-719):
    - Third-person follow camera with lerp smoothing (0.1)
    - **Uses world position** of player (handles local/world coordinate conversion)
    - Positioned at player + (0, 5, 10), looks at player

14. **Game Loop**:
    - `gameLoop()` uses requestAnimationFrame
    - `update(dt)` calls all system updates with delta time in specific order:
      1. `handleInput(dt)` - Process player input
      2. `updateMovingPlatforms(dt)` - **Move platforms FIRST** (critical for lateral collision detection)
      3. `applyPhysics(dt)` - Apply gravity and velocity
      4. `checkCollisions()` - Detect and resolve collisions
      5. `updateCollectibles(dt)` - Animate and check collectibles
      6. `updateEnemies(dt)` - Update enemy AI and movement
      7. `updateParticles(dt)` - Update particle physics and lifetime
      8. `updateEmitters(dt)` - Emit new particles from active emitters
      9. `updateGoal(dt)` - Animate goal
      10. `updateCamera()` - Follow player with camera
      11. `debugPlayer()` - Debug output if enabled
    - `render()` renders scene

### Key Implementation Patterns

**Delta Time Usage**: All movement and animations use delta time from `clock.getDelta()` for frame-rate independence.

**Color-Coded Platforms**: Different platform types use distinct colors (PLATFORM_COLORS) for visual feedback.

**Level Progression**: Levels are data-driven from the LEVELS object, making it easy to add new levels without code changes.

**Console-Based Feedback**: Game events (collectibles, deaths, level changes) log to console instead of UI.

**Multi-Directional Collision System**:
- Uses **Separating Axis Theorem (SAT)** for AABB collision detection
- Calculates penetration depth on all three axes (X, Y, Z)
- Resolves collision on the axis with **minimum overlap** (collision direction)
- **Smart collision prioritization**:
  - If player is above platform (within horizontal bounds) → only vertical collision processed
  - If player is on the side → horizontal collision processed (X or Z axis)
- **Prevents spurious collisions**: Player won't be ejected from moving platforms they're standing on
- Moving platforms can push player laterally when approaching from the side
- All resolution functions handle both world and local coordinate systems

**Parent-Child System for Moving Platforms**:
- Uses Three.js `.attach()` method to preserve world position when reparenting
- Player becomes child of moving platform → automatically follows all platform movements
- Detaches on jump or when leaving platform bounds
- All collision/distance checks use `getWorldPosition()` to handle local vs world coordinates

**World Position Consistency**:
- Camera tracking uses `getWorldPosition()`
- Collectible detection uses `getWorldPosition()`
- Goal detection uses `getWorldPosition()`
- Fall detection uses `getWorldPosition()`

### Known Limitations

- ~~No moving platforms~~ ✅ Implemented with parent-child system
- ~~No lateral collision detection~~ ✅ Implemented with multi-directional SAT system
- ~~No enemy system~~ ✅ Implemented with patrol, chase, and flying enemies
- ~~No particle effects~~ ✅ Implemented with object pooling and emitters
- No continuous collision detection (fast-moving objects may tunnel through thin platforms)
- No ceiling collision handling (jumping into platform from below)
- AABB-only collision (no support for rotated platforms)
- Camera OrbitControls not used (camera is lerp-based follow cam)
- GSAP imported but unused
- Jump input requires key release to jump again (canJump flag)

### Project Documentation

- `ROADMAP.md` - Detailed 4-phase implementation plan for UI, moving platforms, enemies, and particles
- `ideas.md` - Comprehensive list of potential features organized by priority

### Key Dependencies

- **three.js** (0.173.0): 3D rendering engine
- **gsap** (3.12.7): Animation library (imported but not used)
- **vite** (6.1.0): Build tool and dev server
- **sass-embedded**: SCSS compilation

### Styling

Minimal SCSS in `style.scss`:
- CSS reset (margin/padding)
- Fullscreen canvas with HUD overlay

## Development Notes

When adding features:
- Follow the existing section-based organization in main.js
- Use delta time for all animations/physics
- Add new level data to LEVELS object rather than hardcoding
- Use `getWorldPosition()` for all distance/position checks (handles parent-child relationships)
- Console.log for debugging and player feedback
- Use factory functions for creating game objects
- Clear objects in `clearLevel()` to prevent memory leaks
- When working with moving platforms, remember:
  - Use `.attach()` not `.add()` for reparenting with position preservation
  - Check horizontal bounds in **local coordinates** for attached players
  - Always detach before repositioning in world coordinates
- When working with collisions:
  - The system uses SAT (Separating Axis Theorem) to detect collision direction
  - Collision resolution happens on the axis with minimum penetration
  - Players above platforms (horizontally within bounds) only get vertical collision processing
  - Players on the side get horizontal collision resolution (X or Z axis)
  - All resolution functions automatically handle local vs world coordinates
  - Moving platforms are updated BEFORE physics to ensure accurate lateral collision detection
- When working with particles:
  - Particle system must be initialized BEFORE `createPlayer()` (shared geometries needed)
  - Player trail emitter is created in `loadLevel()`, NOT in `createPlayer()` (timing issue with clearLevel)
  - Use `getParticleFromPool()` for all particle creation (never `new Particle()` directly)
  - Particles are never destroyed, only deactivated and returned to pool
  - Use `PARTICLE_PRESETS` for consistent visual effects
  - Add particle cleanup to `clearLevel()` and `clearEmitters()` calls

## Debug Mode

- Press **P** to toggle debug mode
- When active, shows player state every 10 seconds:
  - World position vs local position
  - Parent object (SCENE or PLATFORM type)
  - Grounded state
  - Velocity vector
