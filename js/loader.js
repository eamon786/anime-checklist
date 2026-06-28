// loader.js — Season and JSON loading

const Loader = {
  /**
   * Fetch the seasons manifest from data/seasons.json.
   * Falls back to an empty array on error.
   */
  async fetchSeasons() {
    try {
      const res = await fetch('./data/seasons.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn('Could not load seasons.json:', e);
      return [];
    }
  },

  /**
   * Fetch a specific season's anime list.
   * @param {string} file — filename inside /data/
   */
  async fetchSeason(file) {
    const res = await fetch('./data/' + file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  },

  /**
   * Parse and validate a JSON file from a File object (import).
   * Returns an array of anime objects or throws.
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!Array.isArray(data)) throw new Error('JSON deve essere un array.');
          resolve(data);
        } catch (e) {
          reject(new Error('File JSON non valido: ' + e.message));
        }
      };
      reader.onerror = () => reject(new Error('Errore lettura file.'));
      reader.readAsText(file);
    });
  },

  /**
   * Validate that an anime item has the minimum required fields.
   */
  validateItem(item) {
    return item && typeof item === 'object' && typeof item.title === 'string' && item.title.trim();
  },

  /**
   * Normalize an anime item, filling missing fields with defaults.
   */
  normalizeItem(item) {
    return {
      title:    (item.title || '').trim(),
      date:     item.date     || '',
      platform: item.platform || 'CR',
      dub:      item.dub      || 'no',
      genres:   item.genres   || '',
      kvdate:   item.kvdate   || '',
      notes:    item.notes    || ''
    };
  }
};
