import { describe, expect, it } from 'vitest';
import { getNextParticleCount } from './adaptiveQuality';
import { createCuratedField, FAMILY_NAMES } from './curatedFieldGenerator';
import { chooseFamily, createFieldHistory } from './fieldHistory';
import { parseDuration, parseWallpaperOptions } from './parseWallpaperOptions';
import { shouldUseFallback, validateField } from './fieldValidator';

describe('wallpaper options', () => {
  it('parses intervals and enforces the thirty-second minimum', () => {
    expect(parseDuration('2m')).toBe(120000);
    expect(parseDuration('5s')).toBe(30000);
    expect(parseDuration('not-a-duration')).toBe(600000);
  });

  it('clamps query parameters to safe values', () => {
    const options = parseWallpaperOptions('?wallpaper=1&interval=1s&source=mixed&quality=ultra&maxparticles=999999&transition=none&debug=1');
    expect(options).toMatchObject({ enabled: true, interval: 30000, source: 'mixed', quality: 'ultra', maxParticles: 100000, transition: 'none', debug: true });
  });
});

describe('curated fields', () => {
  it('is deterministic for an explicit seed', () => {
    const first = createCuratedField({ seed: 'reproducible-seed' });
    const second = createCuratedField({ seed: 'reproducible-seed' });
    expect(second).toEqual(first);
    expect(validateField(first)).toBeNull();
  });

  it('avoids the immediately previous family', () => {
    const storage = memoryStorage();
    const history = createFieldHistory(storage);
    history.record({ id: 'one', family: 'vortex' });
    expect(chooseFamily(['vortex', 'cellular'], history, () => 0)).toBe('cellular');
  });

  it('creates a complete, bounded shader field for every curated family', () => {
    const fields = FAMILY_NAMES.map(family => createCuratedField({ family, seed: `${family}-test` }));
    expect(fields).toHaveLength(24);
    fields.forEach(field => {
      expect(field.code).toContain('vec2 get_velocity(vec2 p)');
      expect(field.code).not.toMatch(/\bNaN\b|\bInfinity\b/);
      expect(validateField(field)).toBeNull();
    });
  });
});

describe('quality and recovery', () => {
  it('adjusts auto quality only outside sustained target thresholds', () => {
    expect(getNextParticleCount({ current: 35000, averageFps: 41, maxParticles: 70000 })).toBe(28000);
    expect(getNextParticleCount({ current: 35000, averageFps: 58, maxParticles: 70000 })).toBe(39201);
    expect(getNextParticleCount({ current: 35000, averageFps: 52, maxParticles: 70000 })).toBe(35000);
    expect(getNextParticleCount({ current: 35000, averageFps: 58, frameTimeP90: 27, maxParticles: 70000 })).toBe(28000);
    expect(getNextParticleCount({ current: 35000, averageFps: 58, frameTimeP90: 17, maxParticles: 70000 })).toBe(39201);
    expect(getNextParticleCount({ current: 45000, averageFps: 20, maxParticles: 70000, quality: 'high' })).toBe(45000);
  });

  it('uses the known-good fallback only after the bounded retry budget', () => {
    expect(shouldUseFallback(7)).toBe(false);
    expect(shouldUseFallback(8)).toBe(true);
  });
});

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
}
