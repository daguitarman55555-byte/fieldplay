const PROFILES = {
  eco: { scale: 0.55, steps: 38 },
  wallpaper: { scale: 0.78, steps: 58 },
  showcase: { scale: 1, steps: 78 }
};

export function createQualityController({ profile = 'wallpaper', targetFps = 30 } = {}) {
  let requested = normalizeProfile(profile);
  let level = requested === 'eco' ? 0 : requested === 'showcase' ? 2 : 1;
  let stress = 0;
  let calm = 0;

  function sample({ frameMs = 0, gpuLoad = null } = {}) {
    const deadline = 1000 / targetFps;
    const overloaded = frameMs > deadline * 1.2 || (Number.isFinite(gpuLoad) && gpuLoad > 86);
    const comfortable = frameMs < deadline * 0.82 && (!Number.isFinite(gpuLoad) || gpuLoad < 70);
    stress = overloaded ? stress + 1 : Math.max(0, stress - 1);
    calm = comfortable ? calm + 1 : 0;
    if (stress >= 12 && level > 0) { level -= 1; stress = 0; calm = 0; }
    if (calm >= 240 && level < maxLevel(requested)) { level += 1; stress = 0; calm = 0; }
    return current();
  }

  function configure(next = {}) {
    if (next.profile) {
      requested = normalizeProfile(next.profile);
      level = Math.min(level, maxLevel(requested));
    }
    if (Number.isFinite(next.targetFps)) targetFps = next.targetFps;
    return current();
  }

  function current() {
    const name = ['eco', 'wallpaper', 'showcase'][level];
    return { name, targetFps, ...PROFILES[name] };
  }

  return { sample, configure, current };
}

function normalizeProfile(value) { return PROFILES[value] ? value : 'wallpaper'; }
function maxLevel(profile) { return profile === 'eco' ? 0 : profile === 'showcase' ? 2 : 1; }
