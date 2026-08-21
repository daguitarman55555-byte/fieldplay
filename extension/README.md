# FieldPlay for Desmos

Early Chrome extension implementation for enhanced Desmos notation and vector-calculus overlays.

## Current milestone

- Detects native point-valued definitions such as `F(x,y)=(-y,x)` in the Desmos equation list.
- Renders a synchronized vector-arrow canvas above the 2D graph.
- Keeps the Desmos expression panel and graph interactions unobstructed.
- Type `vec`, a space, and a letter to insert arrow notation such as `\\vec{a}` in the active equation field. The same shortcut works for `hat` and `bar`.
- Click the FieldPlay status button or press `Alt+V` to toggle the overlay.
- Includes a tested parser for planned `vec`, slope-field, derivative, partial, gradient, divergence, curl, Jacobian, Hessian, Laplacian and integral syntax.

## Build

From the repository root:

```sh
npm install
npm run build:extension
```

Then load `extension/dist` as an unpacked extension in Chrome. This folder is generated and is not committed.

## Compatibility

The extension requests access only to the Desmos 2D and 3D calculator pages. The main-world adapter deliberately keeps undocumented Desmos access in one small file so breakage can be repaired without touching the mathematics or renderer.
