import { chooseFamily } from './fieldHistory';

const FAMILY_NAMES = [
  'single-vortex', 'vortex-pair', 'vortex-lattice', 'spiral-sink', 'spiral-source',
  'rotating-saddle', 'double-gyre', 'cellular-flow', 'sinusoidal-shear', 'wave-interference',
  'radial-waves', 'dipole-flow', 'quadrupole-flow', 'hamiltonian-stream', 'rose-petal',
  'braided-flow', 'orbit-bands', 'trigonometric-curl', 'warped-checker', 'asymmetric-turbulence',
  'ring-attractor', 'soft-attractors', 'vortex-street', 'quasiperiodic-flow'
];

const HELPERS = `
vec2 bounded(vec2 v) { return v / (1.0 + length(v)); }
vec2 vortex(vec2 p, vec2 c, float spin) {
  vec2 q = p - c;
  return spin * vec2(-q.y, q.x) / (dot(q, q) + 0.35);
}
vec2 pull(vec2 p, vec2 c, float strength) {
  vec2 q = c - p;
  return strength * q / (dot(q, q) + 1.0);
}
`;

export function createCuratedField({ seed = randomSeed(), history = emptyHistory(), family } = {}) {
  const sourceSeed = String(seed);
  const random = createSeededRandom(sourceSeed);
  const selectedFamily = family || chooseFamily(FAMILY_NAMES, history, random);
  const field = createFieldFromFamily(selectedFamily, sourceSeed, random);
  return field;
}

export function createFieldFromFamily(family, seed, random = createSeededRandom(seed)) {
  const build = BUILDERS[family] || BUILDERS['single-vortex'];
  const parameters = parameterSet(random);
  const body = build(parameters);
  const speed = parameters.speed > 1.2 ? 'lively' : parameters.speed < 0.8 ? 'gentle' : 'medium';
  return {
    id: `${family}-${seed}`,
    family,
    code: `${HELPERS}\nvec2 get_velocity(vec2 p) {\n  vec2 v = vec2(0.0);\n  ${body}\n  return bounded(v);\n}`,
    camera: {
      cx: number(random(-1.5, 1.5)),
      cy: number(random(-1.5, 1.5)),
      width: number(random(12, 23)),
      height: number(random(12, 23))
    },
    settings: {
      timeStep: number(random(0.005, 0.014)),
      fadeout: number(random(0.9965, 0.9988)),
      dropProbability: number(random(0.004, 0.012)),
      colorMode: [1, 2, 3][Math.floor(random() * 3)]
    },
    metadata: { seed: String(seed), expectedSpeed: speed, symmetry: SYMMETRY[family] || 'organic' }
  };
}

export function createSeededRandom(seed) {
  let state = hash(seed) || 1;
  return function random(min = 0, max = 1) {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    value = ((value ^ value >>> 14) >>> 0) / 4294967296;
    return min + (max - min) * value;
  };
}

export function randomSeed() {
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(2);
    window.crypto.getRandomValues(values);
    return `${values[0].toString(36)}${values[1].toString(36)}`;
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export { FAMILY_NAMES };

function parameterSet(random) {
  return {
    a: glslNumber(random(0.55, 1.7)), b: glslNumber(random(0.45, 1.55)), c: glslNumber(random(0.35, 1.25)),
    k: glslNumber(random(0.45, 1.2)), phase: glslNumber(random(-3.14, 3.14)),
    speed: glslNumber(random(0.65, 1.5)), x: glslNumber(random(1.3, 3.1)), y: glslNumber(random(1.3, 3.1))
  };
}

const BUILDERS = {
  'single-vortex': p => `v = ${p.speed} * vortex(p, vec2(${p.a}, ${p.b}), 1.0);`,
  'vortex-pair': p => `v = ${p.speed} * (vortex(p, vec2(-${p.x}, 0.0), 1.0) + vortex(p, vec2(${p.x}, 0.0), -1.0));`,
  'vortex-lattice': p => `v = ${p.speed} * (vortex(p, vec2(-${p.x}, -${p.y}), 1.0) + vortex(p, vec2(${p.x}, -${p.y}), -1.0) + vortex(p, vec2(-${p.x}, ${p.y}), -1.0) + vortex(p, vec2(${p.x}, ${p.y}), 1.0));`,
  'spiral-sink': p => `v = ${p.speed} * (vec2(-${p.a} * p.x, -${p.a} * p.y) + vec2(-p.y, p.x) * ${p.b});`,
  'spiral-source': p => `v = ${p.speed} * (vec2(${p.a} * p.x, ${p.a} * p.y) + vec2(-p.y, p.x) * ${p.b});`,
  'rotating-saddle': p => `v = ${p.speed} * vec2(${p.a} * p.x + ${p.b} * p.y, ${p.b} * p.x - ${p.a} * p.y);`,
  'double-gyre': p => `v = ${p.speed} * vec2(-sin(${p.k} * p.x) * cos(${p.k} * p.y), cos(${p.k} * p.x) * sin(${p.k} * p.y));`,
  'cellular-flow': p => `v = ${p.speed} * vec2(sin(${p.x} * p.x + ${p.phase}) * cos(${p.y} * p.y), -cos(${p.x} * p.x + ${p.phase}) * sin(${p.y} * p.y));`,
  'sinusoidal-shear': p => `v = ${p.speed} * vec2(sin(${p.y} * p.y + ${p.phase}), ${p.c} * sin(${p.x} * p.x - ${p.phase}));`,
  'wave-interference': p => `v = ${p.speed} * vec2(sin(${p.a} * p.x + ${p.b} * p.y) + cos(${p.c} * p.y), cos(${p.b} * p.x - ${p.a} * p.y) + sin(${p.c} * p.x));`,
  'radial-waves': p => `float r = length(p) + 0.001; v = ${p.speed} * (p / r) * sin(${p.a} * r + ${p.phase}) + vec2(-p.y, p.x) * ${p.c};`,
  'dipole-flow': p => `v = ${p.speed} * (pull(p, vec2(-${p.x}, 0.0), 1.0) - pull(p, vec2(${p.x}, 0.0), 1.0) + vec2(-p.y, p.x) * ${p.c});`,
  'quadrupole-flow': p => `v = ${p.speed} * (vortex(p, vec2(-${p.x}, -${p.y}), 1.0) + vortex(p, vec2(${p.x}, -${p.y}), -1.0) + vortex(p, vec2(-${p.x}, ${p.y}), -1.0) + vortex(p, vec2(${p.x}, ${p.y}), 1.0));`,
  'hamiltonian-stream': p => `v = ${p.speed} * vec2(-${p.a} * sin(${p.a} * p.x) * sin(${p.b} * p.y), ${p.b} * cos(${p.a} * p.x) * cos(${p.b} * p.y));`,
  'rose-petal': p => `float r = length(p) + 0.001; float t = atan(p.y, p.x); float petal = cos(${p.x} * t + ${p.phase}); v = ${p.speed} * (vec2(-p.y, p.x) * petal + p * (${p.c} - 0.12 * r));`,
  'braided-flow': p => `v = ${p.speed} * vec2(sin(${p.a} * p.y + sin(${p.b} * p.x)), cos(${p.b} * p.x + sin(${p.a} * p.y)) + vec2(-p.y, p.x) * ${p.c};`,
  'orbit-bands': p => `float r = length(p) + 0.001; v = ${p.speed} * vec2(-p.y, p.x) * (0.45 + 0.55 * sin(${p.a} * r + ${p.phase})) + p * (0.8 - r) * ${p.c};`,
  'trigonometric-curl': p => `v = ${p.speed} * vec2(sin(${p.a} * p.y) + cos(${p.b} * p.x + ${p.phase}), cos(${p.c} * p.x) - sin(${p.a} * p.y - ${p.phase}));`,
  'warped-checker': p => `float qx = p.x + ${p.c} * sin(${p.a} * p.y); float qy = p.y + ${p.c} * cos(${p.b} * p.x); v = ${p.speed} * vec2(sin(${p.a} * qy), sin(${p.b} * qx));`,
  'asymmetric-turbulence': p => `v = ${p.speed} * (vec2(sin(${p.a} * p.y + ${p.phase}), cos(${p.b} * p.x)) + vec2(cos(${p.c} * (p.x + p.y)), sin(${p.a} * (p.x - p.y))) * 0.65 + pull(p, vec2(${p.x}, -${p.y}), 0.5));`,
  'ring-attractor': p => `float r = length(p) + 0.001; v = ${p.speed} * (vec2(-p.y, p.x) * ${p.a} + p * (${p.x} - r) * ${p.b});`,
  'soft-attractors': p => `v = ${p.speed} * (pull(p, vec2(-${p.x}, ${p.y}), 1.0) + pull(p, vec2(${p.x}, ${p.y}), 0.8) + pull(p, vec2(0.0, -${p.y}), 1.1) + vec2(-p.y, p.x) * ${p.c});`,
  'vortex-street': p => `float band = sin(${p.a} * p.x + ${p.phase}); v = ${p.speed} * (vec2(0.75 + ${p.c} * cos(${p.b} * p.y), 0.25 * sin(${p.a} * p.x)) + vec2(-p.y, p.x) * band * 0.22);`,
  'quasiperiodic-flow': p => `v = ${p.speed} * vec2(sin(${p.a} * p.y) + sin(1.618 * ${p.b} * p.x), cos(${p.c} * p.x) + cos(1.414 * ${p.a} * p.y));`
};

const SYMMETRY = {
  'single-vortex': 'radial', 'vortex-pair': 'bilateral', 'vortex-lattice': 'grid', 'double-gyre': 'bilateral',
  'cellular-flow': 'tiled', 'quadrupole-flow': 'fourfold', 'rose-petal': 'radial', 'ring-attractor': 'radial',
  'soft-attractors': 'triangular', 'vortex-street': 'translational', 'quasiperiodic-flow': 'quasi-periodic'
};

function hash(value) {
  let hashed = 2166136261;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hashed ^= text.charCodeAt(index);
    hashed = Math.imul(hashed, 16777619);
  }
  return hashed >>> 0;
}

function emptyHistory() {
  return { lastFamily: () => null };
}

function number(value) {
  return Number(value.toFixed(3));
}

function glslNumber(value) {
  return value.toFixed(3);
}
