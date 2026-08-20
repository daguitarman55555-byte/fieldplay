# FieldPlay Studio and Desmos integration

FieldPlay Studio keeps the original GLSL vector-field editor and GPU particle integrator while adding a modern workspace, named presets, gradient generation, live diagnostics, and an embedding boundary.

## Gradient fields

In the **Field** tab, enter a scalar GLSL expression such as `sin(x) * cos(y)` and select **Apply ∇f**. FieldPlay generates a central-difference approximation of the gradient and compiles it through the same validated shader path as hand-written fields.

## Embedding API

The browser exposes `window.FieldPlay` after initialization:

- `setVectorField(code)`
- `setGradientField(expression, { epsilon })`
- `setViewport({ minX, maxX, minY, maxY })`
- `getViewport()`
- `getState()`
- `subscribe(listener)`

This is deliberately host-neutral. A later Desmos companion can translate calculator expressions into GLSL, synchronize Desmos graph bounds with `setViewport`, and place FieldPlay's transparent canvas in the same coordinate space without coupling the core renderer to Desmos internals.
