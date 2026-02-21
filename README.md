# Isometric Rubik's

An interactive visualisation of a grid of Rubik's cubes in isometric projection. Watch as layers rotate with satisfying animations, creating a mesmerising pattern.

![Demo](./demo.gif)

## Tech Stack

- **Three.js** — 3D rendering with WebGL
- **Vanilla JavaScript** — no framework overhead
- **CSS** — custom UI components

## Getting Started

```bash
# Clone the repo
git clone https://github.com/OscarBeamish/isometric-rubiks.git
cd isometric-rubiks

# Serve locally (any static server works)
npx serve

# Or use Python
python -m http.server 8000
```

Open the URL shown in your terminal.

## Features

- **Isometric projection** — classic 30°/45° rotation for that clean look
- **Sync mode** — all cubes rotate together in harmony
- **Multiple colour schemes** — Classic, Neon, Ocean, Sunset, Forest, Pastel, Monochrome
- **Playback controls** — Play, pause, stop, and solve
- **Accelerating solve** — solve animation speeds up as it progresses
- **Hover mode** — cubes rotate when you mouse over them
- **Adjustable settings** — animation speed, move delay, zoom level
- **Hide UI** — press `H` to toggle UI visibility for clean screenshots/recordings
- **Responsive** — scales to any screen size

## Controls

| Control | Action |
|---------|--------|
| Settings gear | Open settings panel |
| `H` key | Toggle UI visibility |
| Play/Pause/Stop | Control animation playback |
| Solve button | Reverse all moves to solved state (with accelerating animation) |
| Animation Speed | Adjust rotation speed (0.5x - 5x) |
| Move Delay | Time between moves (0 - 3s) |
| Zoom | Adjust grid density (2 - 16) |
| Sync toggle | All cubes move together or independently |
| Hover Mode | Cubes rotate on mouse hover |
| Colour Scheme | Choose from 7 colour palettes |

## How It Works

The visualisation uses Three.js with an orthographic camera set to isometric angles (30° X, -45° Y). Each Rubik's cube is a group of 27 cubies with shared geometry and materials for performance.

Layer rotations are animated using a pivot group technique — cubies in the rotating layer are temporarily parented to a pivot, rotated, then reparented back with snapped positions.

The "finger flick" easing function mimics the feel of a real cube turn: quick acceleration, smooth deceleration.

## Build

No build step required — it's vanilla JS with ES modules loaded from CDN.

For production, you could bundle with Vite:

```bash
npm init -y
npm install vite
npx vite build
```

## Inspiration

Inspired by [this Reddit post](https://www.reddit.com/r/creativecoding/comments/1r78hw2/procedurally_generated_rubiks_cube_pattern/) on r/creativecoding.

## License

MIT

---

Built by [Oscar Beamish](https://oscarbeamish.com)
