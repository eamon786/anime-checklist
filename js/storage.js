// storage.js — LocalStorage helpers

const STORAGE_PREFIX = 'anime-checklist-v2-';

const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch { /* quota exceeded or sandboxed */ }
  },

  remove(key) {
    try { localStorage.removeItem(STORAGE_PREFIX + key); } catch {}
  }
};
