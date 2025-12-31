# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple Three.js game built with Vite. The game features a player-controlled cube that navigates through lanes while avoiding obstacles and interacting with a scrolling world.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## Architecture

### Core Structure

All game logic resides in a single `main.js` file with the following key components:

**Scene Setup** (lines 8-39):
- WebGL renderer with shadow mapping enabled
- Perspective camera positioned at (0.2, 1.2, 3)
- OrbitControls for camera manipulation during development
- Dark cyan background color (#041115)

**Entity System** (lines 42-137):
- `Box` class: Base entity with physics (gravity, velocity, collision detection)
  - Handles position, boundaries, velocity, and gravity
  - `update()` method applies movement and physics
  - `applyGravity()` checks collision with ground using `boxCollision()`
- `World` class: Extends Box, represents scrolling ground platforms
  - `duplicate()` method spawns new world segments at 80% player position threshold
- `Player` class: Extends Box, represents the player character
- `boxCollision()` function: AABB collision detection for box entities

**Game Systems**:
- **Lane System** (lines 179-257): Three-lane movement (lanes at x=-1, 0, 1)
  - Player switches lanes with A/D keys
  - Smooth interpolation to target lane position
- **Input Handling** (lines 184-245): WASD + Space controls
  - A/D for lane switching (with boundary checks)
  - Space for jumping (sets velocity.y to 0.12)
  - Note: KeyW/KeyS registered but not currently used
- **Enemy Spawning** (lines 286-302): Currently commented out
  - Spawns enemies every 50 frames at random x positions
  - Enemies use accelerationZ for increasing speed
- **Animation Loop** (lines 260-308): requestAnimationFrame-based
  - Updates player lane position with smooth interpolation
  - Updates cube physics against ground
  - Updates ground position and handles duplication
  - Checks enemy collisions (cancels animation on collision)

### Physics System

Gravity is applied at -0.005 per frame. When collision is detected, vertical velocity is reversed and dampened by 0.5. The collision system uses axis-aligned bounding box (AABB) detection with boundary properties (left, right, top, bottom, front, back) updated each frame.

### Key Dependencies

- **three.js** (v0.173.0): Core 3D library
  - Uses OrbitControls from addons
  - MeshStandardMaterial with shadow support
- **GSAP** (v3.12.7): Animation library (imported but not currently used)
- **SCSS**: Styling (minimal - just canvas positioning)

## Development Notes

- The world duplication logic (line 111) may create duplicate worlds since there's no cleanup mechanism
- Enemy spawning is commented out (lines 300-301)
- OrbitControls are enabled during animation which may interfere with gameplay
- Some imported modules are unused (velocity from three/tsl, GSAP)
