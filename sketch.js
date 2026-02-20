/**
 * Isometric Rubik's
 * A screen filled with Rubik's cubes with layers rotating like being solved
 *
 * By Oscar Beamish - https://oscarbeamish.com
 * Inspired by: https://www.reddit.com/r/creativecoding/comments/1r78hw2/procedurally_generated_rubiks_cube_pattern/
 */

import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const baseFrustumSize = 10;
let currentFrustumSize = baseFrustumSize;
let aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -currentFrustumSize * aspect / 2,
  currentFrustumSize * aspect / 2,
  currentFrustumSize / 2,
  -currentFrustumSize / 2,
  0.1,
  1000
);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Color schemes for Rubik's cube faces
const COLOR_SCHEMES = {
  classic: {
    right: 0xC41E3A,   // Red
    left: 0xFF5800,    // Orange
    top: 0xFFD500,     // Yellow
    bottom: 0xFFFFFF,  // White
    front: 0x0051BA,   // Blue
    back: 0x009E60,    // Green
    internal: 0x000000
  },
  monochrome: {
    right: 0xFFFFFF,   // White
    left: 0x000000,    // Black
    top: 0xFFFFFF,     // White
    bottom: 0x000000,  // Black
    front: 0xFFFFFF,   // White
    back: 0x000000,    // Black
    internal: 0x000000
  },
  neon: {
    right: 0xFF00FF,   // Magenta
    left: 0x00FFFF,    // Cyan
    top: 0xFFFF00,     // Yellow
    bottom: 0xFF0080,  // Hot pink
    front: 0x00FF00,   // Green
    back: 0x8000FF,    // Purple
    internal: 0x000000
  },
  ocean: {
    right: 0x0077B6,   // Deep blue
    left: 0x00B4D8,    // Sky blue
    top: 0x90E0EF,     // Light blue
    bottom: 0xCAF0F8,  // Pale blue
    front: 0x023E8A,   // Navy
    back: 0x48CAE4,    // Aqua
    internal: 0x001219
  },
  sunset: {
    right: 0xFF6B6B,   // Coral
    left: 0xFFA500,    // Orange
    top: 0xFFD93D,     // Gold
    bottom: 0xFF8E72,  // Salmon
    front: 0xC44569,   // Rose
    back: 0x6C5B7B,    // Dusty purple
    internal: 0x1a1a2e
  },
  forest: {
    right: 0x2D6A4F,   // Forest green
    left: 0x40916C,    // Jade
    top: 0x95D5B2,     // Mint
    bottom: 0x74C69D,  // Sage
    front: 0x1B4332,   // Deep green
    back: 0x52B788,    // Emerald
    internal: 0x081c15
  },
  pastel: {
    right: 0xFFADAD,   // Pink
    left: 0xFFD6A5,    // Peach
    top: 0xFDFFB6,     // Cream
    bottom: 0xCAFFBF,  // Mint
    front: 0x9BF6FF,   // Sky
    back: 0xBDB2FF,    // Lavender
    internal: 0x2d2d2d
  }
};

// Current color scheme
let currentColors = COLOR_SCHEMES.classic;
let targetColors = COLOR_SCHEMES.classic;
let colorTransitionProgress = 1; // 0 to 1, 1 = complete
let colorTransitionStartTime = null;
const COLOR_TRANSITION_DURATION = 600; // milliseconds

// Shared geometry and materials cache for performance
// Each cubie position (x,y,z) has a unique material combination
let sharedGeometry = null;
let sharedMaterials = {}; // Key: "x,y,z" -> materials array

function getSharedGeometry(actualSize) {
  if (!sharedGeometry) {
    sharedGeometry = new THREE.BoxGeometry(actualSize, actualSize, actualSize);
  }
  return sharedGeometry;
}

function getSharedMaterials(x, y, z) {
  const key = `${x},${y},${z}`;
  if (!sharedMaterials[key]) {
    sharedMaterials[key] = [
      new THREE.MeshBasicMaterial({ color: x === 2 ? currentColors.right : currentColors.internal }),
      new THREE.MeshBasicMaterial({ color: x === 0 ? currentColors.left : currentColors.internal }),
      new THREE.MeshBasicMaterial({ color: y === 2 ? currentColors.top : currentColors.internal }),
      new THREE.MeshBasicMaterial({ color: y === 0 ? currentColors.bottom : currentColors.internal }),
      new THREE.MeshBasicMaterial({ color: z === 2 ? currentColors.front : currentColors.internal }),
      new THREE.MeshBasicMaterial({ color: z === 0 ? currentColors.back : currentColors.internal }),
    ];
  }
  return sharedMaterials[key];
}

function clearSharedCache() {
  if (sharedGeometry) {
    sharedGeometry.dispose();
    sharedGeometry = null;
  }
  Object.values(sharedMaterials).forEach(mats => {
    mats.forEach(m => m.dispose());
  });
  sharedMaterials = {};
}

// Interpolate between two hex colors
function lerpColor(color1, color2, t) {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;

  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return (r << 16) | (g << 8) | b;
}

// Ease function for smooth color transition
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Update all materials with interpolated colors
function updateMaterialColors(t) {
  const eased = easeInOutQuad(t);

  // Calculate interpolated colors
  const interpolatedColors = {
    right: lerpColor(currentColors.right, targetColors.right, eased),
    left: lerpColor(currentColors.left, targetColors.left, eased),
    top: lerpColor(currentColors.top, targetColors.top, eased),
    bottom: lerpColor(currentColors.bottom, targetColors.bottom, eased),
    front: lerpColor(currentColors.front, targetColors.front, eased),
    back: lerpColor(currentColors.back, targetColors.back, eased),
    internal: lerpColor(currentColors.internal, targetColors.internal, eased)
  };

  // Update all shared materials
  Object.entries(sharedMaterials).forEach(([key, materials]) => {
    const [x, y, z] = key.split(',').map(Number);
    materials[0].color.setHex(x === 2 ? interpolatedColors.right : interpolatedColors.internal);
    materials[1].color.setHex(x === 0 ? interpolatedColors.left : interpolatedColors.internal);
    materials[2].color.setHex(y === 2 ? interpolatedColors.top : interpolatedColors.internal);
    materials[3].color.setHex(y === 0 ? interpolatedColors.bottom : interpolatedColors.internal);
    materials[4].color.setHex(z === 2 ? interpolatedColors.front : interpolatedColors.internal);
    materials[5].color.setHex(z === 0 ? interpolatedColors.back : interpolatedColors.internal);
  });
}

// Start a color transition to a new scheme
function startColorTransition(newScheme) {
  // Store current colors as starting point (use actual material colors if mid-transition)
  if (colorTransitionProgress < 1) {
    // We're mid-transition, so capture current interpolated state
    const eased = easeInOutQuad(colorTransitionProgress);
    currentColors = {
      right: lerpColor(currentColors.right, targetColors.right, eased),
      left: lerpColor(currentColors.left, targetColors.left, eased),
      top: lerpColor(currentColors.top, targetColors.top, eased),
      bottom: lerpColor(currentColors.bottom, targetColors.bottom, eased),
      front: lerpColor(currentColors.front, targetColors.front, eased),
      back: lerpColor(currentColors.back, targetColors.back, eased),
      internal: lerpColor(currentColors.internal, targetColors.internal, eased)
    };
  }

  targetColors = COLOR_SCHEMES[newScheme];
  colorTransitionProgress = 0;
  colorTransitionStartTime = null;
}

class RubiksCube {
  constructor(size = 1) {
    this.size = size;
    this.group = new THREE.Group();
    this.cubeSize = size / 3;
    this.cubies = []; // Array of {mesh, gridPos: {x,y,z}, orientation: Quaternion}

    // Animation state
    this.isAnimating = false;
    this.animProgress = 0;
    this.animDuration = 400; // Duration in milliseconds (300-400ms feels natural)
    this.animStartTime = null;
    this.animAxis = null;
    this.animLayer = null;
    this.animDir = 1;
    this.animatingCubies = [];
    this.animPivot = new THREE.Group();

    // Timing for random moves
    this.delay = Math.random() * 2000 + 1000; // milliseconds
    this.lastMoveTime = performance.now();

    // Track last move to avoid redundant moves
    this.lastMove = null; // { axis, layer, dir, turnAmount }

    // Move history for solving
    this.moveHistory = [];

    this.createCubies();

    // Isometric view
    this.group.rotation.x = Math.PI / 6;  // 30 degrees
    this.group.rotation.y = -Math.PI / 4; // -45 degrees
  }

  createCubies() {
    // Gap between cubies creates black border effect
    // Set to 0 to see exact cube boundaries for debugging
    const gap = 0.04 * this.size;
    const actualSize = this.cubeSize - gap;

    // Use shared geometry for all cubies
    const geom = getSharedGeometry(actualSize);

    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          // Use shared materials based on position
          const materials = getSharedMaterials(x, y, z);

          const mesh = new THREE.Mesh(geom, materials);
          mesh.position.set(
            (x - 1) * this.cubeSize,
            (y - 1) * this.cubeSize,
            (z - 1) * this.cubeSize
          );

          this.cubies.push({
            mesh,
            gridPos: { x, y, z }
          });

          this.group.add(mesh);
        }
      }
    }
  }

  getCubiesInLayer(axis, layer) {
    return this.cubies.filter(cubie => {
      // Get current grid position based on mesh position
      const pos = cubie.mesh.position;
      const gx = Math.round(pos.x / this.cubeSize) + 1;
      const gy = Math.round(pos.y / this.cubeSize) + 1;
      const gz = Math.round(pos.z / this.cubeSize) + 1;

      if (axis === 'x') return gx === layer;
      if (axis === 'y') return gy === layer;
      return gz === layer;
    });
  }

  startMove(axis, layer, dir, turnAmount = 1, recordHistory = true) {
    if (this.isAnimating) return;

    // Record move to history for solving (unless we're already solving)
    if (recordHistory && !this.isSolving) {
      this.moveHistory.push({ axis, layer, dir, turnAmount });
      // Limit history to prevent memory issues
      if (this.moveHistory.length > 500) {
        this.moveHistory.shift();
      }
    }

    this.isAnimating = true;
    this.animProgress = 0;
    this.animStartTime = null; // Will be set on first update
    this.animAxis = axis;
    this.animLayer = layer;
    this.animDir = dir;
    this.animTurnAmount = turnAmount; // 1 = 90°, 2 = 180°

    // Adjust duration for double turns (slightly longer, but not 2x)
    // Double turns feel natural at about 1.4x the single turn duration
    this.currentAnimDuration = this.animDuration * (turnAmount === 2 ? 1.4 : 1);

    // Get cubies in this layer
    this.animatingCubies = this.getCubiesInLayer(axis, layer);

    // Create pivot at center and add cubies to it
    this.animPivot.position.set(0, 0, 0);
    this.animPivot.rotation.set(0, 0, 0);
    this.group.add(this.animPivot);

    // Move cubies to pivot (keep world position)
    this.animatingCubies.forEach(cubie => {
      const worldPos = new THREE.Vector3();
      cubie.mesh.getWorldPosition(worldPos);
      this.group.remove(cubie.mesh);
      this.animPivot.add(cubie.mesh);
      // Convert world pos back to local pos relative to pivot
      this.animPivot.worldToLocal(worldPos);
      cubie.mesh.position.copy(worldPos);
    });
  }

  // Cubic ease-in-out - smoother than quadratic
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Power3 out - snappy feel like a real cube turn
  easeOutPower3(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Custom ease: quick acceleration, smooth deceleration with slight settle
  // Mimics the feel of a finger flick on a real Rubik's cube
  easeFingerFlick(t) {
    // Combination: fast start (power2 in), smooth settle (power3 out)
    if (t < 0.3) {
      // Quick acceleration phase
      return 2.5 * t * t;
    } else {
      // Smooth deceleration phase
      const t2 = (t - 0.3) / 0.7;
      return 0.225 + 0.775 * (1 - Math.pow(1 - t2, 3));
    }
  }

  update(currentTime) {
    // Handle solve animation first
    if (this.isSolving) {
      this.updateSolve(currentTime);
      return;
    }

    // Handle current animations
    if (this.isAnimating) {
      // If paused, freeze the current animation progress
      if (settings.playback === 'pause') {
        return;
      }

      if (!this.animStartTime) {
        this.animStartTime = currentTime;
      }

      const elapsed = currentTime - this.animStartTime;
      // Use currentAnimDuration which accounts for double turns
      // Apply speed multiplier from settings
      const adjustedDuration = this.currentAnimDuration / settings.speed;
      this.animProgress = Math.min(elapsed / adjustedDuration, 1);

      if (this.animProgress >= 1) {
        this.finishMove();
      } else {
        // Use the finger flick easing for natural cube rotation feel
        const eased = this.easeFingerFlick(this.animProgress);
        // Multiply by turnAmount: 1 for 90°, 2 for 180°
        const angle = (Math.PI / 2) * this.animTurnAmount * eased * this.animDir;

        // Rotate the pivot
        if (this.animAxis === 'x') {
          this.animPivot.rotation.set(angle, 0, 0);
        } else if (this.animAxis === 'y') {
          this.animPivot.rotation.set(0, angle, 0);
        } else {
          this.animPivot.rotation.set(0, 0, angle);
        }
      }
    } else {
      // Don't start new moves if paused or stopped
      if (settings.playback === 'pause' || settings.playback === 'stop') {
        return;
      }

      // Random layer rotations - time-based with frequency setting
      if (settings.sync) {
        // Sync mode: all cubes move at the same time
        if (currentTime >= syncNextMoveTime) {
          this.randomMove();
        }
      } else {
        // Independent mode: each cube has its own timing
        if (currentTime - this.lastMoveTime > this.delay) {
          this.lastMoveTime = currentTime;
          // Use frequency setting to determine delay range
          const [minDelay, maxDelay] = frequencyDelays[settings.frequency];
          this.delay = Math.random() * (maxDelay - minDelay) + minDelay;
          this.randomMove();
        }
      }
    }
  }

  finishMove() {
    // Set final rotation (90° * turnAmount * direction)
    const finalAngle = (Math.PI / 2) * this.animTurnAmount * this.animDir;
    if (this.animAxis === 'x') {
      this.animPivot.rotation.set(finalAngle, 0, 0);
    } else if (this.animAxis === 'y') {
      this.animPivot.rotation.set(0, finalAngle, 0);
    } else {
      this.animPivot.rotation.set(0, 0, finalAngle);
    }

    // Move cubies back to main group with their new world transforms
    this.animatingCubies.forEach(cubie => {
      // Get world position and quaternion
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      cubie.mesh.getWorldPosition(worldPos);
      cubie.mesh.getWorldQuaternion(worldQuat);

      // Remove from pivot, add to group
      this.animPivot.remove(cubie.mesh);
      this.group.add(cubie.mesh);

      // Convert world transforms back to local
      this.group.worldToLocal(worldPos);

      // Snap position to grid
      worldPos.x = Math.round(worldPos.x / this.cubeSize) * this.cubeSize;
      worldPos.y = Math.round(worldPos.y / this.cubeSize) * this.cubeSize;
      worldPos.z = Math.round(worldPos.z / this.cubeSize) * this.cubeSize;

      cubie.mesh.position.copy(worldPos);

      // Apply rotation - need to convert world quat to local
      const groupQuat = new THREE.Quaternion();
      this.group.getWorldQuaternion(groupQuat);
      const localQuat = groupQuat.invert().multiply(worldQuat);
      cubie.mesh.quaternion.copy(localQuat);
    });

    // Clean up pivot
    this.group.remove(this.animPivot);
    this.animPivot.rotation.set(0, 0, 0);

    this.isAnimating = false;
    this.animatingCubies = [];
  }

  randomMove() {
    const axes = ['x', 'y', 'z'];
    let axis, layer, dir, turnAmount;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      axis = axes[Math.floor(Math.random() * 3)];
      layer = Math.floor(Math.random() * 3);
      dir = Math.random() < 0.5 ? 1 : -1;

      // 25% chance of double turn (180°), 75% chance of single turn (90°)
      const isDoubleTurn = Math.random() < 0.25;
      turnAmount = isDoubleTurn ? 2 : 1;

      attempts++;
    } while (this.isRedundantMove(axis, layer, dir, turnAmount) && attempts < maxAttempts);

    // Store this move for comparison
    this.lastMove = { axis, layer, dir, turnAmount };

    this.startMove(axis, layer, dir, turnAmount);
  }

  isRedundantMove(axis, layer, dir, turnAmount) {
    if (!this.lastMove) return false;

    const last = this.lastMove;

    // Same axis and layer
    if (last.axis === axis && last.layer === layer) {
      // Exact same move repeated (e.g., R then R again)
      if (last.dir === dir) return true;

      // Opposite direction cancels out (e.g., R then R')
      // Unless one is a double turn
      if (last.dir === -dir && last.turnAmount === 1 && turnAmount === 1) return true;
    }

    return false;
  }

  // Solve by reversing move history
  startSolve() {
    if (this.isSolving || this.moveHistory.length === 0) return;

    // If currently animating a move, finish it first
    if (this.isAnimating) {
      this.finishMove();
    }

    this.isSolving = true;
    // Create a copy of move history reversed
    this.solveQueue = [...this.moveHistory].reverse();
    this.moveHistory = []; // Clear history

    // Start the first reverse move
    this.nextSolveMove();
  }

  nextSolveMove() {
    if (this.solveQueue.length === 0) {
      this.finishSolve();
      return;
    }

    const move = this.solveQueue.shift();
    // Reverse the move: same axis and layer, but opposite direction
    // For 180° turns, direction doesn't matter, keep same
    const reverseDir = move.turnAmount === 2 ? move.dir : -move.dir;
    this.startMove(move.axis, move.layer, reverseDir, move.turnAmount, false);
  }

  updateSolve(currentTime) {
    if (!this.isSolving) return false;

    // If we're animating a solve move, let it continue
    if (this.isAnimating) {
      // Handle the animation (copy of normal animation logic)
      if (settings.playback === 'pause') {
        return true;
      }

      if (!this.animStartTime) {
        this.animStartTime = currentTime;
      }

      const elapsed = currentTime - this.animStartTime;
      // Speed up solve animation slightly
      const adjustedDuration = (this.currentAnimDuration * 0.6) / settings.speed;
      this.animProgress = Math.min(elapsed / adjustedDuration, 1);

      if (this.animProgress >= 1) {
        this.finishMove();
        // Start next solve move
        this.nextSolveMove();
      } else {
        const eased = this.easeFingerFlick(this.animProgress);
        const angle = (Math.PI / 2) * this.animTurnAmount * eased * this.animDir;

        if (this.animAxis === 'x') {
          this.animPivot.rotation.set(angle, 0, 0);
        } else if (this.animAxis === 'y') {
          this.animPivot.rotation.set(0, angle, 0);
        } else {
          this.animPivot.rotation.set(0, 0, angle);
        }
      }
    }

    return true;
  }

  finishSolve() {
    this.isSolving = false;
    this.solveQueue = null;
    this.lastMove = null;
  }
}

// Grid
const cubes = [];
const cubeSize = 2.0;

// Controller settings
let settings = {
  speed: 0.6,         // Animation speed multiplier (default feels right at 0.6)
  gridSize: 10,       // Number of rows/cols
  frequency: 3,       // Move frequency (1-5, affects delay range)
  sync: true,         // Whether all cubes move at the same time
  playback: 'play',   // 'play', 'pause', or 'stop'
  colorScheme: 'classic'
};

// Sync mode state
let syncNextMoveTime = 0;

// Frequency presets: [minDelay, maxDelay] in milliseconds
const frequencyDelays = {
  1: [3000, 5000],  // Very Slow
  2: [2000, 3500],  // Slow
  3: [800, 2300],   // Normal (default)
  4: [400, 1200],   // Fast
  5: [150, 600]     // Very Fast
};

// Calculate exact projected dimensions for isometric cube
// Rotation: X = 30° (π/6), Y = -45° (-π/4)
function getProjectedCubeCorners(size) {
  const rotX = Math.PI / 6;
  const rotY = -Math.PI / 4;
  const h = size / 2;

  // 8 corners of cube
  const corners = [
    [-h, -h, -h], [h, -h, -h], [-h, h, -h], [h, h, -h],
    [-h, -h, h], [h, -h, h], [-h, h, h], [h, h, h]
  ];

  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

  const projected = corners.map(([x, y, z]) => {
    // Rotate around Y first
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    // Then rotate around X
    const y2 = y * cosX - z1 * sinX;
    return { x: x1, y: y2 };
  });

  return projected;
}

const corners = getProjectedCubeCorners(cubeSize);

// Find key points for tiling:
// - rightmost point (max X)
// - leftmost point (min X)
// - topmost point (max Y)
// - bottommost point (min Y)
const minX = Math.min(...corners.map(c => c.x));
const maxX = Math.max(...corners.map(c => c.x));
const minY = Math.min(...corners.map(c => c.y));
const maxY = Math.max(...corners.map(c => c.y));

// Projected width and height
const projWidth = maxX - minX;
const projHeight = maxY - minY;

// For isometric tiling, we need to identify key corner points
// Corner indices after projection (from original 3D positions):
// 0: (-h,-h,-h), 1: (h,-h,-h), 2: (-h,h,-h), 3: (h,h,-h)
// 4: (-h,-h,h),  5: (h,-h,h),  6: (-h,h,h),  7: (h,h,h)

// For tiling like stairs going down-right:
// - Row spacing: from the bottom edge of one cube's top face to the top of the next cube
// - Shift: the horizontal distance to align the left edge of lower cube with left edge of upper cube's top face

// Find top face corners (original y = +h, indices 2,3,6,7)
const topFaceCorners = [corners[2], corners[3], corners[6], corners[7]];
const topFaceLeftmost = topFaceCorners.reduce((a, b) => a.x < b.x ? a : b);
const topFaceRightmost = topFaceCorners.reduce((a, b) => a.x > b.x ? a : b);

// Top face width (used for horizontal shift in staircase pattern)
const topFaceWidth = topFaceRightmost.x - topFaceLeftmost.x;

// For brick-like tiling:
// - Horizontal spacing between cubes in same row = projWidth (full width)
// - Vertical spacing = from one row's leftmost point to where next row starts
// - Horizontal shift per row = half the top face width (for brick offset)

// The key insight: for seamless vertical tiling, the bottom of the top face
// should meet the top of the next cube. So spacing = projHeight - topFaceHeight.
// But we also need the horizontal edges to match.

// Looking at the geometry: cubes should tile such that:
// - The left "V" point of one cube meets the right "V" point of the next
// In isometric, this means:
// - shiftX = topFaceWidth / 2 (half the diamond width)
// - spacingY = topFaceHeight (distance from one row's peak to next row's peak when they interlock)

// Perfect isometric tiling using exact mathematical derivation
//
// For a cube rotated 30° around X then -45° around Y:
// The visible shape has a specific width and height in screen space.
//
// Key insight: We only need to know how far apart to place cubes so their
// edges exactly touch (no gaps, no overlap).

function createGrid() {
  // Update camera zoom for new grid size
  updateCameraZoom();

  // Remove old cubes from scene
  cubes.forEach(c => {
    scene.remove(c.group);
  });
  cubes.length = 0;

  // Clear shared cache (geometry and materials) so they get recreated with current colors
  clearSharedCache();

  // Use the pre-calculated projected dimensions
  // projWidth = total width of isometric cube in screen X
  // projHeight = total height of isometric cube in screen Y

  // For perfect isometric tiling with cubes in staircase pattern
  // Match the gap between cubes to the cubie border width (0.04 * cubeSize)

  // The cubie gap creates a border of 0.04 * cubeSize = 0.08 units
  // We want the same visual gap between full cubes
  const cubieGapFraction = 0.04; // Same as in createCubies()

  // Calculate spacing that creates matching gaps
  // Reduce spacing by the gap amount to create consistent borders
  const gapOffset = cubeSize * cubieGapFraction;

  // Horizontal spacing between cubes in the same row
  const spacingX = projWidth - gapOffset * 0.65;

  // Horizontal shift per row (creates the staircase effect)
  const shiftX = (topFaceWidth - gapOffset * 0.3) / 2;

  // Vertical spacing between rows
  const spacingY = projHeight * 0.767 - gapOffset * 0.3;

  // Calculate visible bounds based on camera frustum
  const viewWidth = currentFrustumSize * aspect;
  const viewHeight = currentFrustumSize;

  // Add padding to ensure cubes fully cover the screen
  const padding = projWidth * 1.5;

  // Calculate how many rows/cols we actually need (much more efficient than fixed -50 to 50)
  const halfWidth = viewWidth / 2 + padding;
  const halfHeight = viewHeight / 2 + padding;

  // Estimate rows and cols needed (add extra rows for staircase pattern coverage)
  const rowsNeeded = Math.ceil(halfHeight / spacingY) + 4;
  const colsNeeded = Math.ceil(halfWidth / spacingX) + 4;

  // With shared geometry/materials, we can handle many more cubes efficiently
  // No hard cap - just rely on visibility culling

  for (let row = -rowsNeeded; row <= rowsNeeded; row++) {
    for (let col = -colsNeeded; col <= colsNeeded; col++) {
      // Calculate position before creating cube
      const posX = col * spacingX + row * shiftX;
      const posY = -row * spacingY;

      // Check if this cube would be visible (with padding for partial visibility)
      if (posX < -halfWidth || posX > halfWidth ||
          posY < -halfHeight || posY > halfHeight) {
        continue; // Skip cubes outside visible area
      }

      const cube = new RubiksCube(cubeSize);

      // Position: staircase pattern
      cube.group.position.x = posX;
      cube.group.position.y = posY;
      cube.group.position.z = 0;

      scene.add(cube.group);
      cubes.push(cube);
    }
  }

}

function animate(currentTime) {
  requestAnimationFrame(animate);

  // Handle color transition animation
  if (colorTransitionProgress < 1) {
    if (!colorTransitionStartTime) {
      colorTransitionStartTime = currentTime;
    }
    const elapsed = currentTime - colorTransitionStartTime;
    colorTransitionProgress = Math.min(elapsed / COLOR_TRANSITION_DURATION, 1);
    updateMaterialColors(colorTransitionProgress);

    // When transition completes, update currentColors to target
    if (colorTransitionProgress >= 1) {
      currentColors = { ...targetColors };
    }
  }

  // Update all cubes first
  cubes.forEach(c => c.update(currentTime));

  // In sync mode, schedule the next move time after all cubes finish
  // This must happen AFTER cube updates so they can start their moves first
  if (settings.sync && currentTime >= syncNextMoveTime) {
    // Check if all cubes are done animating (they just started on this frame)
    const allDone = cubes.every(c => !c.isAnimating);
    if (allDone) {
      const [minDelay, maxDelay] = frequencyDelays[settings.frequency];
      syncNextMoveTime = currentTime + Math.random() * (maxDelay - minDelay) + minDelay;
    }
  }

  renderer.render(scene, camera);
}

function updateCameraZoom() {
  // Scale frustum based on grid size (default 6 = base size)
  // Larger grids need more zoom out
  currentFrustumSize = baseFrustumSize * (settings.gridSize / 6);

  camera.left = -currentFrustumSize * aspect / 2;
  camera.right = currentFrustumSize * aspect / 2;
  camera.top = currentFrustumSize / 2;
  camera.bottom = -currentFrustumSize / 2;
  camera.updateProjectionMatrix();
}

function onResize() {
  aspect = window.innerWidth / window.innerHeight;
  updateCameraZoom();
  renderer.setSize(window.innerWidth, window.innerHeight);
  createGrid();
}

window.addEventListener('resize', onResize);

createGrid();
animate();

// Listen for settings changes from controller widget
window.addEventListener('rubiks-settings', (e) => {
  const { type, value } = e.detail;

  switch (type) {
    case 'speed':
      settings.speed = value;
      break;

    case 'grid':
      settings.gridSize = value;
      createGrid(); // Rebuild grid with new size
      break;

    case 'frequency':
      settings.frequency = value;
      // Update timing immediately for responsiveness
      const [minDelay, maxDelay] = frequencyDelays[value];
      if (settings.sync) {
        // In sync mode, update the next move time
        syncNextMoveTime = performance.now() + Math.random() * (maxDelay - minDelay) + minDelay;
      } else {
        // In independent mode, update each cube's delay
        cubes.forEach(cube => {
          cube.delay = Math.random() * (maxDelay - minDelay) + minDelay;
        });
      }
      break;

    case 'sync':
      settings.sync = value;
      if (value) {
        // When enabling sync, schedule the next move immediately
        syncNextMoveTime = performance.now();
      }
      break;

    case 'playback':
      settings.playback = value;
      if (value === 'play') {
        // Reset timing so moves start fresh
        const now = performance.now();
        cubes.forEach(cube => {
          cube.lastMoveTime = now;
          // Reset animation start time if paused mid-animation
          if (cube.isAnimating && cube.animStartTime) {
            // Adjust start time to account for pause duration
            const elapsed = cube.animProgress * (cube.currentAnimDuration / settings.speed);
            cube.animStartTime = now - elapsed;
          }
        });
        syncNextMoveTime = now;
      }
      break;

    case 'colorScheme':
      settings.colorScheme = value;
      // Smooth transition to new colors (retains cube positions)
      startColorTransition(value);
      break;

    case 'solve':
      // Trigger solve animation on all cubes
      // Set playback to stop so cubes stay solved after
      settings.playback = 'stop';
      cubes.forEach(cube => cube.startSolve());
      break;
  }
});
