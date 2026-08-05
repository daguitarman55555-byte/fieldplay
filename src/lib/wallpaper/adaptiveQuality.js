export const QUALITY_PARTICLES = {
  low: 12000,
  medium: 25000,
  high: 45000,
  ultra: 70000
};

export function initialParticleCount(quality, maxParticles) {
  const requested = quality === 'auto' ? 35000 : QUALITY_PARTICLES[quality];
  return clamp(requested || 35000, 5000, maxParticles);
}

export function getNextParticleCount({ current, averageFps, maxParticles, quality = 'auto' }) {
  if (quality !== 'auto' || !Number.isFinite(averageFps)) return current;
  if (averageFps < 42) return clamp(Math.floor(current * 0.8), 12000, maxParticles);
  if (averageFps > 57) return clamp(Math.ceil(current * 1.15), 12000, maxParticles);
  return current;
}

export function createAdaptiveQuality({ scene, quality, maxParticles, onChange }) {
  let samples = [];
  let lastAdjustment = 0;
  let lastFrame = 0;
  let paused = false;
  let averageFps = 0;
  const unsubscribe = scene.onFrame(({ time }) => {
    if (paused) return;
    if (lastFrame) {
      const elapsed = time - lastFrame;
      if (elapsed > 0 && elapsed < 1000) {
        samples.push(1000 / elapsed);
        if (samples.length > 180) samples.shift();
      }
    }
    lastFrame = time;

    if (samples.length < 90 || time - lastAdjustment < 5000) return;
    averageFps = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const next = getNextParticleCount({
      current: scene.getParticlesCount(),
      averageFps,
      maxParticles,
      quality
    });
    if (next !== scene.getParticlesCount()) {
      scene.setParticlesCount(next, { persist: false });
      onChange && onChange(next, averageFps);
    }
    lastAdjustment = time;
    samples = [];
  });

  return {
    pause() { paused = true; samples = []; lastFrame = 0; },
    resume() { paused = false; lastFrame = 0; },
    getAverageFps() { return averageFps; },
    dispose: unsubscribe
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
