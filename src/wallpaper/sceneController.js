export const SCENES = ['field', 'attractor', 'nebula', 'galaxy', 'black-hole'];
export const PALETTES = ['cosmic', 'aurora', 'ember', 'monochrome'];
export const AUTO_INTERVALS = [60000, 300000, 900000, 0];

export function createSceneController({ scene = 'auto', seed = 'fieldplay', interval = 300000 } = {}) {
  let requested = normalizeScene(scene);
  let current = requested === 'auto' ? seededIndex(seed, SCENES.length) : SCENES.indexOf(requested);
  let currentSeed = String(seed || 'fieldplay');
  let changeInterval = normalizeInterval(interval);
  let elapsed = 0;

  function update(deltaMs) {
    if (requested !== 'auto' || !changeInterval) return snapshot();
    elapsed += Math.max(0, deltaMs);
    if (elapsed >= changeInterval) {
      elapsed %= changeInterval;
      current = (current + 1) % SCENES.length;
    }
    return snapshot();
  }

  function configure(next = {}) {
    if (next.scene !== undefined) {
      requested = normalizeScene(next.scene);
      if (requested !== 'auto') current = SCENES.indexOf(requested);
      else current = seededIndex(currentSeed, SCENES.length);
      elapsed = 0;
    }
    if (next.seed !== undefined) {
      currentSeed = String(next.seed || 'fieldplay');
      if (requested === 'auto') current = seededIndex(currentSeed, SCENES.length);
    }
    if (next.interval !== undefined) changeInterval = normalizeInterval(next.interval);
    return snapshot();
  }

  function snapshot() {
    return { name: SCENES[current], index: current, seed: hashSeed(currentSeed), interval: changeInterval };
  }
  return { update, configure, snapshot };
}

export function normalizeScene(value) { return value === 'auto' || SCENES.includes(value) ? value : 'auto'; }
export function normalizePalette(value) { return PALETTES.includes(value) ? value : 'cosmic'; }
export function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967295;
}
function seededIndex(value, length) { return Math.min(length - 1, Math.floor(hashSeed(value) * length)); }
function normalizeInterval(value) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : 300000; }
