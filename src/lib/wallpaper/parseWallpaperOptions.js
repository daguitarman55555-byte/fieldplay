const DEFAULT_INTERVAL = 10 * 60 * 1000;
const MIN_INTERVAL = 30 * 1000;
const MAX_PARTICLES = 100000;
const MIN_PARTICLES = 5000;

export function parseDuration(value, fallback = DEFAULT_INTERVAL) {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;

  const text = String(value).trim();
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h)?$/i.exec(text);
  if (!match) return fallback;

  const amount = Number(match[1]);
  const unit = (match[2] || 'ms').toLowerCase();
  const multiplier = unit === 'h' ? 3600000 : unit === 'm' ? 60000 : unit === 's' ? 1000 : 1;
  return Math.max(MIN_INTERVAL, Math.round(amount * multiplier));
}

export function isWallpaperMode(search = window.location.search) {
  return new URLSearchParams(search).get('wallpaper') === '1';
}

export function parseWallpaperOptions(search = window.location.search) {
  const params = new URLSearchParams(search);
  const source = params.get('source');
  const quality = params.get('quality');
  const transition = params.get('transition');
  const maxParticles = Number(params.get('maxparticles'));

  return {
    enabled: params.get('wallpaper') === '1',
    interval: parseDuration(params.get('interval')),
    source: ['curated', 'presets', 'generator', 'mixed'].includes(source) ? source : 'curated',
    quality: ['auto', 'low', 'medium', 'high', 'ultra'].includes(quality) ? quality : 'auto',
    maxParticles: Number.isFinite(maxParticles) ? clamp(Math.round(maxParticles), MIN_PARTICLES, MAX_PARTICLES) : 70000,
    transition: ['fade', 'none'].includes(transition) ? transition : 'fade',
    debug: params.get('debug') === '1',
    seed: params.get('seed') || null
  };
}

export { DEFAULT_INTERVAL, MIN_INTERVAL, MIN_PARTICLES, MAX_PARTICLES };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
