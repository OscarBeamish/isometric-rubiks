# Isometric Rubik's

An interactive visualization of a grid of Rubik's cubes in isometric projection. Watch as layers rotate with satisfying animations, creating a mesmerizing pattern.

<!-- ![Demo](./demo.gif) -->
<!-- Uncomment and add a screenshot or gif once you've got one -->

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
- **Multiple color schemes** — Classic, Neon, Ocean, Sunset, Forest, Pastel, Monochrome
- **Playback controls** — Play, pause, stop, and solve
- **Solve animation** — reverses all moves to return cubes to solved state
- **Adjustable settings** — speed, grid size, move frequency
- **Hide UI** — press `H` to toggle UI visibility for clean screenshots/recordings
- **Responsive** — scales to any screen size

## Controls

| Control | Action |
|---------|--------|
| Settings gear | Open settings panel |
| `H` key | Toggle UI visibility |
| Play/Pause/Stop | Control animation playback |
| Solve button | Reverse all moves to solved state |

## How It Works

The visualization uses Three.js with an orthographic camera set to isometric angles (30° X, -45° Y). Each Rubik's cube is a group of 27 cubies with shared geometry and materials for performance.

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
