export function validateField(field) {
  if (!field || !field.id || !field.family || typeof field.code !== 'string') return 'Malformed field';
  const settings = field.settings || {};
  return Object.values(settings).some(value => typeof value === 'number' && !Number.isFinite(value))
    ? 'Non-finite field setting'
    : null;
}

export function shouldUseFallback(failureCount, maxAttempts = 8) {
  return failureCount >= maxAttempts;
}

export function waitForHealthyFrames(scene, timeout = 900) {
  return new Promise(resolve => {
    const startFrame = scene.getFrameCount();
    const deadline = window.setTimeout(finish, timeout);
    const unsubscribe = scene.onFrame(() => {
      if (scene.getLastFrameError()) finish(false);
      if (scene.getFrameCount() >= startFrame + 4) finish(true);
    });

    function finish(passed = false) {
      window.clearTimeout(deadline);
      unsubscribe();
      resolve(passed && !scene.getLastFrameError());
    }
  });
}
