import presets from '../autoPresets';
import generateEquation from '../generate-equation';
import wrapVectorField from '../wrapVectorField';
import { createAdaptiveQuality, initialParticleCount } from './adaptiveQuality';
import { createCuratedField, createFieldFromFamily, randomSeed } from './curatedFieldGenerator';
import { createFieldHistory } from './fieldHistory';
import { shouldUseFallback, validateField, waitForHealthyFrames } from './fieldValidator';
import { createTransitionController } from './transitionController';

const MAX_CANDIDATE_ATTEMPTS = 8;

export function createWallpaperMode({ scene, options }) {
  const history = createFieldHistory();
  const transition = createTransitionController(options.transition);
  const debug = createDebugOverlay(options.debug);
  const candidates = [];
  const previous = [];
  let current = null;
  let timer = 0;
  let hidden = document.hidden;
  let cyclingPaused = false;
  let changing = false;
  let disposed = false;
  let initialSeed = options.seed;
  let seedCounter = 0;
  let lastRejection = '';
  const quality = createAdaptiveQuality({
    scene,
    quality: options.quality,
    maxParticles: options.maxParticles,
    onChange: updateDebug
  });

  function start() {
    if (disposed) return;
    scene.setParticlesCount(initialParticleCount(options.quality, options.maxParticles), { persist: false });
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('keydown', onKeyDown);
    if (!hidden) next({ initial: true });
    updateDebug();
  }

  async function next({ initial = false, field } = {}) {
    if (disposed || hidden || changing) return false;
    changing = true;
    clearTimer();

    if (!initial && current) await transition.cover();
    let applied = false;
    for (let attempt = 0; attempt < MAX_CANDIDATE_ATTEMPTS && !applied; attempt += 1) {
      const candidate = field || getCandidate(attempt);
      field = null;
      const rejection = validateField(candidate) || await applyCandidate(candidate);
      if (rejection) {
        lastRejection = rejection;
        continue;
      }
      applied = true;
      if (current && !initial) {
        previous.push(current);
        if (previous.length > 12) previous.shift();
      }
      current = candidate;
      candidates.push(candidate);
      if (candidates.length > 12) candidates.shift();
      history.record(candidate);
      lastRejection = '';
    }

    if (!applied && shouldUseFallback(MAX_CANDIDATE_ATTEMPTS, MAX_CANDIDATE_ATTEMPTS)) {
      const fallback = createFieldFromFamily('single-vortex', 'known-good-wallpaper');
      const rejection = await applyCandidate(fallback);
      if (!rejection) {
        if (current && !initial) previous.push(current);
        current = fallback;
        history.record(fallback);
      } else {
        lastRejection = `Fallback failed: ${rejection}`;
      }
    }

    if (!hidden && current) {
      await wait(220); // Let a new field paint behind the overlay before revealing it.
      await transition.reveal();
    }
    changing = false;
    if (!cyclingPaused && !hidden) schedule();
    updateDebug();
    return Boolean(current);
  }

  async function previousField() {
    const prior = previous.pop();
    if (!prior || changing) return;
    await next({ field: prior });
  }

  function regenerate() {
    if (!current || changing) return;
    const field = createCuratedField({ seed: nextSeed(), history, family: current.family });
    next({ field });
  }

  function pause() {
    cyclingPaused = true;
    clearTimer();
    updateDebug();
  }

  function resume() {
    cyclingPaused = false;
    if (!hidden && !changing) schedule();
    updateDebug();
  }

  function schedule() {
    clearTimer();
    timer = window.setTimeout(() => next(), options.interval);
  }

  function clearTimer() {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  }

  async function applyCandidate(field) {
    let result;
    try {
      result = await scene.vectorFieldEditorState.setCode(field.code, { persist: false });
    } catch (error) {
      return error && error.message ? error.message : 'Shader application failed';
    }
    if (!result || result.error) return formatError(result && result.error);

    const { settings, camera } = field;
    const bbox = {
      minX: camera.cx - camera.width / 2,
      maxX: camera.cx + camera.width / 2,
      minY: camera.cy - camera.height / 2,
      maxY: camera.cy + camera.height / 2
    };
    scene.applyBoundingBox(bbox, { persist: false });
    scene.setIntegrationTimeStep(settings.timeStep, { persist: false });
    scene.setFadeOutSpeed(settings.fadeout, { persist: false });
    scene.setDropProbability(settings.dropProbability, { persist: false });
    scene.setColorMode(settings.colorMode, { persist: false });

    return (await waitForHealthyFrames(scene)) ? null : (scene.getLastFrameError() || 'No healthy frames from shader');
  }

  function getCandidate(attempt) {
    const seed = initialSeed && attempt === 0 ? initialSeed : nextSeed();
    if (initialSeed && attempt === 0) initialSeed = null;
    const source = chooseSource();
    if (source === 'presets') return presetCandidate(seed);
    if (source === 'generator') return generatorCandidate(seed);
    return createCuratedField({ seed, history });
  }

  function nextSeed() {
    seedCounter += 1;
    return `${randomSeed()}-${seedCounter}`;
  }

  function chooseSource() {
    if (options.source !== 'mixed') return options.source;
    const roll = Math.random();
    return roll < 0.72 ? 'curated' : roll < 0.94 ? 'presets' : 'generator';
  }

  function presetCandidate(seed) {
    const available = presets.filter(preset => !preset.i0 && !preset.i1 && (!preset.particleCount || preset.particleCount <= 70000));
    const alternatives = available.filter(preset => `preset:${preset.name || available.indexOf(preset)}` !== history.lastFamily());
    const pool = alternatives.length ? alternatives : available;
    const preset = pool[Math.floor(createRandom(seed)() * pool.length)] || presets[0];
    const index = presets.indexOf(preset);
    return {
      id: `preset-${index}-${seed}`,
      family: `preset:${preset.name || index}`,
      code: preset.code,
      camera: { cx: preset.cx || 0, cy: preset.cy || 0, width: preset.w || 17, height: preset.h || preset.w || 17 },
      settings: {
        timeStep: finiteOr(preset.timeStep, 0.01), fadeout: finiteOr(preset.fadeOut, 0.998),
        dropProbability: finiteOr(preset.dropProbability, 0.009), colorMode: finiteOr(preset.colorMode, 1)
      },
      metadata: { seed, expectedSpeed: 'varied', symmetry: 'preset' }
    };
  }

  function generatorCandidate(seed) {
    return {
      id: `generator-${seed}`,
      family: 'generator',
      code: wrapVectorField(generateEquation()),
      camera: { cx: 0, cy: 0, width: 17, height: 17 },
      settings: { timeStep: 0.008, fadeout: 0.998, dropProbability: 0.009, colorMode: 3 },
      metadata: { seed, expectedSpeed: 'unknown', symmetry: 'generated' }
    };
  }

  function onVisibilityChange() {
    hidden = document.hidden;
    if (hidden) {
      clearTimer();
      quality.pause();
      scene.setPaused(true);
    } else {
      scene.setPaused(false);
      quality.resume();
      if (!cyclingPaused && !changing) schedule();
    }
    updateDebug();
  }

  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === 'n' || event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (key === 'p' || event.key === 'ArrowLeft') { event.preventDefault(); previousField(); }
    if (event.key === ' ') { event.preventDefault(); cyclingPaused ? resume() : pause(); }
    if (key === 'r') { event.preventDefault(); regenerate(); }
    if (key === 'd') { event.preventDefault(); debug.toggle(); updateDebug(); }
  }

  function updateDebug() {
    debug.render({
      field: current, particleCount: scene.getParticlesCount(), rollingFps: quality.getAverageFps(),
      interval: options.interval, paused: cyclingPaused || hidden, lastRejection
    });
  }

  function dispose() {
    disposed = true;
    clearTimer();
    quality.dispose();
    transition.dispose();
    debug.dispose();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('keydown', onKeyDown);
  }

  return { start, next, previous: previousField, pause, resume, regenerate, dispose };
}

function createDebugOverlay(initiallyVisible) {
  const element = document.createElement('pre');
  Object.assign(element.style, {
    position: 'fixed', right: '12px', bottom: '12px', zIndex: '2147483647', margin: '0', padding: '8px 10px',
    pointerEvents: 'none', color: '#dcecff', background: 'rgba(5, 15, 32, 0.42)', font: '11px/1.45 monospace',
    borderRadius: '4px', opacity: '0.72', display: initiallyVisible ? 'block' : 'none'
  });
  document.body.appendChild(element);
  let visible = Boolean(initiallyVisible);

  return {
    toggle() { visible = !visible; element.style.display = visible ? 'block' : 'none'; },
    render(state) {
      if (!visible) return;
      const field = state.field;
      element.textContent = [
        `family: ${field ? field.family : 'loading'}`,
        `seed: ${field ? field.metadata.seed : '-'}`,
        `id: ${field ? field.id : '-'}`,
        `particles: ${state.particleCount.toLocaleString()}`,
        `fps: ${state.rollingFps ? state.rollingFps.toFixed(1) : 'warming'}`,
        `interval: ${formatDuration(state.interval)}`,
        `status: ${state.paused ? 'paused' : 'running'}`,
        `last rejection: ${state.lastRejection || 'none'}`
      ].join('\n');
    },
    dispose() { element.remove(); }
  };
}

function createRandom(seed) { let value = 0; for (let i = 0; i < seed.length; i += 1) value = (value * 31 + seed.charCodeAt(i)) >>> 0; return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); }
function finiteOr(value, fallback) { return Number.isFinite(value) ? value : fallback; }
function formatError(error) { return typeof error === 'string' ? error : (error && (error.error || error.message)) || 'Shader compilation failed'; }
function wait(milliseconds) { return new Promise(resolve => window.setTimeout(resolve, milliseconds)); }
function formatDuration(milliseconds) { return milliseconds % 60000 === 0 ? `${milliseconds / 60000}m` : `${Math.round(milliseconds / 1000)}s`; }
