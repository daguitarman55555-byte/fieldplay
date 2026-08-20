# FieldPlay Cosmic Field

The upgraded wallpaper is a separate WebGL2 entry at `wallpaper.html`. The original FieldPlay editor remains available at `index.html`, and the Gate 0 diagnostic remains at `gate0.html`.

## Local preview

```sh
npm install
npm run dev
```

Open `http://localhost:8880/wallpaper.html`.

## Build the Lively folder

```sh
npm run package:lively
```

Import the generated `lively-package` folder into Lively. Its settings provide Eco, Wallpaper, and Showcase quality profiles; 20/30/60 FPS targets; motion and bloom controls; and audio reactivity.

The runtime pauses its animation clock when Lively pauses playback. Its quality controller reduces internal resolution and shader work after sustained frame misses or high whole-system GPU utilization.

Run the hardware validation checklist in [GATE0_WINDOWS_TEST.md](./GATE0_WINDOWS_TEST.md) before treating a machine as supported.
