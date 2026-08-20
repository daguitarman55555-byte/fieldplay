const listeners = new Set();
const audioListeners = new Set();

const state = {
  detected: false,
  paused: false,
  system: null,
  audio: null,
  properties: {}
};

function parsePayload(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function publish() {
  state.detected = true;
  listeners.forEach(listener => listener(snapshot()));
}

function snapshot() {
  return {
    detected: state.detected,
    paused: state.paused,
    system: state.system ? { ...state.system } : null,
    audioLength: state.audio?.length || 0,
    properties: { ...state.properties }
  };
}

window.livelySystemInformation = data => {
  state.system = parsePayload(data);
  publish();
};

window.livelyWallpaperPlaybackChanged = data => {
  const payload = parsePayload(data);
  if (payload && typeof payload.IsPaused === 'boolean') state.paused = payload.IsPaused;
  publish();
};

window.livelyAudioListener = audioArray => {
  state.audio = parsePayload(audioArray) || audioArray;
  audioListeners.forEach(listener => listener(state.audio));
  publish();
};

window.livelyPropertyListener = (name, value) => {
  state.properties[name] = value;
  publish();
  window.dispatchEvent(new CustomEvent('fieldplay:lively-property', {
    detail: { name, value }
  }));
};

export function subscribeToLively(listener) {
  listeners.add(listener);
  listener(snapshot());
  return () => listeners.delete(listener);
}

export function getLivelySnapshot() {
  return snapshot();
}

export function subscribeToLivelyAudio(listener) {
  audioListeners.add(listener);
  return () => audioListeners.delete(listener);
}
