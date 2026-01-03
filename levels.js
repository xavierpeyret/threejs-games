const LEVELS = {
    tutorial: {
        name: "Tutoriel",
        platforms: [
            { x: 0,  y: 0, z: 0, w: 10, h: 1, d: 5, type: 'start' },
            { x: 12, y: 0, z: 0, w: 4,  h: 1, d: 3,  type: 'rhythm' },
            { x: 18, y: 2, z: 0, w: 2,  h: 1, d: 3,  type: 'rhythm' },
            { x: 20, y: 4, z: 0, w: 2,  h: 1, d: 3,  type: 'rhythm' },
            { x: 22, y: 6, z: 0, w: 2,  h: 1, d: 3,  type: 'rhythm' },
            { x: 12, y: 0, z: 0, w: 4,  h: 1, d: 3,  type: 'rhythm' },

            { x: 100, y: 0, z: 0, w: 12, h: 1, d: 5, type: 'goal' }
        ],
        movingPlatforms: [
            { x: 26, y: 6, z: 0, w: 2, h: 1, d: 3, type: 'vertical', speed: 1.5, range: 3 },
            // { x: 8, y: 1, z: 0, w: 4, h: 1, d: 4, type: 'horizontal', speed: 1, range: 3 },
            // { x: 24, y: 2, z: 0, w: 4, h: 1, d: 4, type: 'circular', speed: 0.8, range: 3 }
        ],
        // movingPlatforms: [
        //     { x: 8, y: 1, z: 0, w: 4, h: 1, d: 4, type: 'horizontal', speed: 1, range: 3 },
        //     { x: 16, y: 1, z: 0, w: 4, h: 1, d: 4, type: 'vertical', speed: 1.5, range: 2 },
        //     { x: 24, y: 2, z: 0, w: 4, h: 1, d: 4, type: 'circular', speed: 0.8, range: 3 }
        // ],
        enemies: [
            { x: 12, y: 2, z: 0, type: 'static' },
            { x: 20, y: 1, z: 0, type: 'patrol', range: 4, speed: 1.5 },
            { x: 28, y: 4, z: 0, type: 'flying', range: 3, speed: 1, height: 2 },
            { x: 38, y: 2, z: 0, type: 'chaser', speed: 3, chaseRadius: 10 }
        ],
        // collectibles: [
        //     { x: 12, y: 2, z: 0 },
        //     { x: 20, y: 4, z: 0 },
        //     { x: 32, y: 4, z: 0 },
        //     { x: 42, y: 3, z: 0 }
        // ],
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
