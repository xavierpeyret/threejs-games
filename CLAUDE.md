# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D platformer game built with Three.js and Vite. The player controls a character navigating through levels with platforms, collectibles, and a goal, using physics-based movement with jumping and gravity.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## Architecture

### Single-File Architecture

The entire game logic is contained in `main.js` with a functional/procedural approach organized into clear sections:

**Constants** (lines 6-19):
- Physics constants: `GRAVITY` (20), `JUMP_FORCE` (12), `MOVE_SPEED` (8)
- Platform colors by type (start, normal, jump-intro, height-intro, rhythm, goal)

**Level Data** (lines 24-89):
- `LEVELS` object contains level definitions (tutorial, level1, level2)
- Each level specifies: platforms (with position, size, type), collectibles, playerStart, goal
- `LEVEL_ORDER` array defines level sequence

**Global State** (lines 94-102):
- Scene, camera, renderer, player object
- Arrays: platforms, collectibles
- Input tracking: `keys` object
- Game state: score, currentLevelIndex

**Core Systems**:

1. **Initialization** (lines 107-152):
   - `init()` orchestrates setup
   - `setupThreeJS()` creates scene with fog, camera, renderer with shadows
   - Window resize handling

2. **Player System** (lines 157-175):
   - `createPlayer()` creates player mesh with physics properties
   - Player object structure: { mesh, velocity, isGrounded, canJump }

3. **Factory Functions** (lines 180-244):
   - `createPlatform(x, y, z, w, h, d, type)` - creates platforms with color-coded types
   - `createCollectible(x, y, z)` - creates golden spheres worth 10 points
   - `createGoal(x, y, z)` - creates green cylinder goal marker

4. **Level Management** (lines 249-330):
   - `loadLevel(levelName)` - clears and loads level data
   - `clearLevel()` - removes all scene objects
   - `nextLevel()` - advances to next level with 1s delay
   - `resetLevel()` - reloads current level
   - `showVictoryScreen()` - displays victory message and restarts after 3s

5. **Lighting** (lines 335-349):
   - Ambient light (0.6 intensity) + Directional light (0.8 intensity)
   - Shadow mapping with 2048x2048 resolution

6. **Input System** (lines 354-388):
   - WASD/Arrow keys for movement (A/Q for left, D for right)
   - Space/W/Z/ArrowUp for jump (only when grounded)
   - Level shortcuts: Digit1-3 for quick level switching, KeyR for reset
   - `handleInput(dt)` applies input with friction (0.8 damping)

7. **Physics** (lines 393-403):
   - `applyPhysics(dt)` applies gravity and velocity
   - Terminal velocity capped at -50

8. **Collision Detection** (lines 408-440):
   - AABB collision using `THREE.Box3`
   - Platform collision sets isGrounded and adjusts position
   - Goal collision (distance < 2) triggers nextLevel()
   - Fall respawn at y < -10

9. **Collectibles** (lines 445-465):
   - Rotation animation (2 rad/s) and bobbing motion
   - Collection on distance < 1, adds 10 to score
   - Console logging for feedback

10. **Camera** (lines 480-489):
    - Third-person follow camera with lerp smoothing (0.1)
    - Positioned at player + (0, 5, 10), looks at player

11. **Game Loop** (lines 494-514):
    - `gameLoop()` uses requestAnimationFrame
    - `update(dt)` calls all system updates with delta time
    - `render()` renders scene

### Key Implementation Patterns

**Delta Time Usage**: All movement and animations use delta time from `clock.getDelta()` for frame-rate independence.

**Color-Coded Platforms**: Different platform types use distinct colors (PLATFORM_COLORS) for visual feedback.

**Level Progression**: Levels are data-driven from the LEVELS object, making it easy to add new levels without code changes.

**Console-Based Feedback**: Game events (collectibles, deaths, level changes) log to console instead of UI.

### Known Limitations

- No UI overlay (score/level name only in console)
- No enemy system (enemies array/logic commented out in roadmap)
- No moving platforms (planned in roadmap)
- No particle effects (planned in roadmap)
- Camera OrbitControls not used (camera is lerp-based follow cam)
- GSAP imported but unused
- Jump input requires key release to jump again (canJump flag)

### Project Documentation

- `ROADMAP.md` - Detailed 4-phase implementation plan for UI, moving platforms, enemies, and particles (10-13h estimated)
- `ideas.md` - Comprehensive list of potential features organized by priority

### Key Dependencies

- **three.js** (0.173.0): 3D rendering engine
- **gsap** (3.12.7): Animation library (imported but not used)
- **vite** (6.1.0): Build tool and dev server
- **sass-embedded**: SCSS compilation

### Styling

Minimal SCSS in `style.scss`:
- CSS reset (margin/padding)
- `#three-canvas` positioned fixed fullscreen (z-index: 1)

## Development Notes

When adding features:
- Follow the existing section-based organization in main.js
- Use delta time for all animations/physics
- Add new level data to LEVELS object rather than hardcoding
- Console.log for debugging and player feedback
- Use factory functions for creating game objects
- Clear objects in `clearLevel()` to prevent memory leaks
