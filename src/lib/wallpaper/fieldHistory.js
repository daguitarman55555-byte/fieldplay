const HISTORY_KEY = 'fieldplay-wallpaper-history-v1';
const MAX_HISTORY = 24;

export function createFieldHistory(storage = getStorage()) {
  let entries = read(storage);

  return {
    entries: () => entries.slice(),
    has(id) {
      return entries.some(entry => entry.id === id);
    },
    lastFamily() {
      return entries.length ? entries[entries.length - 1].family : null;
    },
    record(field) {
      if (!field || !field.id || !field.family) return;
      entries = entries.filter(entry => entry.id !== field.id);
      entries.push({ id: field.id, family: field.family, seed: field.metadata && field.metadata.seed });
      entries = entries.slice(-MAX_HISTORY);
      write(storage, entries);
    }
  };
}

export function chooseFamily(families, history, random = Math.random) {
  const lastFamily = history.lastFamily();
  const alternatives = families.filter(family => family !== lastFamily);
  const pool = alternatives.length ? alternatives : families;
  return pool[Math.floor(random() * pool.length)];
}

function getStorage() {
  try {
    return window.localStorage;
  } catch (_) {
    return null;
  }
}

function read(storage) {
  if (!storage) return [];
  try {
    const value = JSON.parse(storage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value.filter(isCompactEntry).slice(-MAX_HISTORY) : [];
  } catch (_) {
    return [];
  }
}

function write(storage, entries) {
  if (!storage) return;
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (_) {
    // Private browsing and storage quotas should not stop the wallpaper.
  }
}

function isCompactEntry(entry) {
  return entry && typeof entry.id === 'string' && typeof entry.family === 'string';
}
