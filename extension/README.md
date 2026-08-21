# FieldPlay for Desmos

Early Chrome extension implementation for enhanced Desmos notation and vector-calculus overlays.

## Current milestone

- Detects native point-valued definitions such as `F(x,y)=(-y,x)` in the Desmos equation list.
- Runs FieldPlay-style particles directly on the GPU with velocity-sensitive RK4 integration, randomized recycling, color palettes, and fading trails.
- Keeps vector arrows, particles, and contours independently toggleable from a compact in-graph menu.
- Renders a synchronized vector-arrow canvas above the 2D graph.
- Keeps the Desmos expression panel and graph interactions unobstructed.
- Type `vec`, a space, and a letter to insert arrow notation such as `\\vec{a}` in the active equation field. The same shortcut works for `hat` and `bar`.
- Click the FieldPlay status button or press `Alt+V` to toggle the overlay.
- Includes a tested parser for planned `vec`, slope-field, derivative, partial, gradient, divergence, curl, Jacobian, Hessian, Laplacian and integral syntax.

## Symbolic commands

Use ordinary mathematical shorthand. FieldPlay converts a recognized token as soon as it becomes complete and places the cursor in the next editable position. Space is also accepted as a fallback:

- `d/dx` and `d/dy` create ordinary derivative operators.
- `d^n/dx^n` creates an nth-derivative operator.
- `pd/pdx` and `pd/pdy` create partial-derivative operators using `∂`.
- `int` creates an indefinite integral with an integrand and `dx`.
- Clicking an existing integral symbol opens a compact choice to add or remove bounds without changing its integrand or differential.
- `intb` remains available as a direct bounded-integral shortcut.
- `iint`, `iiint`, `lineint`, `surfaceint`, and `oint` create correctly formatted multiple, line, surface, and closed integrals.
- Add `b` to `iint` or `iiint` for editable bounds.
- `grad`, `div`, `curl`, `laplacian`, and `magnitude` create their conventional mathematical operators with an editable argument.
- `mtx` creates an editable 2×2 matrix directly in the equation field. Click its brackets to add or remove rows and columns.
- `y'=...` and `dy/dx=...` are equivalent slope-field definitions.
- `jacobian` and `hessian` create guided function/variable templates.

If a target is already present—such as `d^3T/dz^3`—FieldPlay preserves the complete notation instead of adding another argument.

The earlier `diff`, `ddx`, `ddy`, `px`, `py`, `simp`, and `solve` forms remain compatible for existing users.

Advanced forms remain available when a different variable or derivative order is needed:

- `simplify(expression)`
- `differentiate(x, expression)`
- `derivative(x, n, expression)` for an nth derivative
- `d(x, n, expression)` to render the literal `dⁿ/dxⁿ` operator notation
- `partial(x, y, expression)` for successive partial derivatives
- `integrate(x, expression)` for a supported elementary antiderivative
- `solve(x, equation)` for linear and quadratic polynomial equations

Matrix commands evaluate when you press Enter. Matrices use familiar nested-list notation such as `[[1,2],[3,4]]`:

- `det(matrix)`, `inv(matrix)`, `transpose(matrix)`, and `rank(matrix)`
- `matadd(A,B)`, `matsub(A,B)`, and `matmul(A,B)`
- `linsolve(A,b)` for a numeric linear system
- `jacobian([f,g],[x,y])` for a vector-valued function
- `hessian(f,[x,y])` for a scalar-valued function

Numeric matrix operations validate dimensions and report singular or incompatible matrices instead of producing misleading results. Jacobians and Hessians use the symbolic derivative engine and return the same editable matrix representation.

The extension replaces the command with its rendered mathematical result. Unsupported symbolic operations are left unchanged rather than returning an unreliable answer.

## Build

From the repository root:

```sh
npm install
npm run build:extension
```

Then load `extension/dist` as an unpacked extension in Chrome. This folder is generated and is not committed.

## Compatibility

The extension requests access only to the Desmos 2D and 3D calculator pages. The main-world adapter deliberately keeps undocumented Desmos access in one small file so breakage can be repaired without touching the mathematics or renderer.
