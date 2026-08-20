# FieldPlay Gate 0 — Windows and Lively Test

This test verifies the exact Windows, GPU-driver, monitor, and Lively environment that will run FieldPlay. No programming is required.

## Build the package

1. Open the FieldPlay project folder.
2. Open a terminal in that folder.
3. Run `npm install` once.
4. Run `npm run package:lively`.
5. The finished wallpaper is in the `lively-package` folder.

## Import into Lively

1. Open Lively Wallpaper.
2. Select **Add Wallpaper**.
3. Choose the `lively-package/index.html` file.
4. Apply **FieldPlay Gate 0** as the wallpaper.
5. Open its customization panel and confirm the Quality, Target FPS, and Run diagnostics controls appear.

## Required tests

Perform each test and return to the wallpaper after it.

- Launch Lively from a fully closed state.
- Press **Test context recovery** and confirm the recovery time appears.
- Pause and resume the wallpaper from Lively.
- Open and close a fullscreen application.
- Lock Windows, wait ten seconds, and unlock it.
- Put the computer to sleep, wake it, and return to the desktop.
- Change the display resolution and restore it.
- If possible, disconnect and reconnect a monitor.
- If Windows uses display scaling, change scaling once and restore it.
- Restart Lively.

After the last test, press **Download diagnostic report**. Keep the generated JSON file; it contains no password or account information.

## Success conditions

- The page says **READY**.
- WebGL 2, `EXT_color_buffer_float`, RGBA16F, HDR additive blending, and high precision all pass.
- Pause and resume do not cause a visible jump or freeze.
- Context recovery finishes and the diagnostics return.
- The wallpaper returns after Lively restart, sleep/wake, and display changes.

Optional extensions may show as unavailable. That is not a failure.
