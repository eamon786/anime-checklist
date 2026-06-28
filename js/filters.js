// filters.js — Filtering, search, and sorting logic

const Filters = {
  apply(list, state) {
    const q = (state.search || '').toLowerCase().trim();
    return list.filter(item => {
      if (q) {
        const haystack = [item.title, item.genres, item.notes, item.date].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (state.platform && state.platform !== 'all') {
        if (item.platform !== state.platform) return false;
      }
      if (state.dubIta) {
        if (item.dub !== 'si') return false;
      }
      if (state.status === 'completed' && !item.checked) return false;
      if (state.status === 'remaining' && item.checked) return false;
      return true;
    });
  },

  sort(list, sortBy) {
    if (!sortBy || sortBy === 'default') return list;
    const sorted = [...list];
    switch (sortBy) {
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'date-asc':
        sorted.sort((a, b) => {
          const da = this._parseDate(a.date);
          const db = this._parseDate(b.date);
          return da - db;
        });
        break;
      case 'date-desc':
        sorted.sort((a, b) => {
          const da = this._parseDate(a.date);
          const db = this._parseDate(b.date);
          return db - da;
        });
        break;
      case 'platform':
        sorted.sort((a, b) => a.platform.localeCompare(b.platform));
        break;
    }
    return sorted;
  },

  _parseDate(dateStr) {
    // Format: DD/MM
    if (!dateStr) return Infinity;
    const parts = dateStr.split('/');
    if (parts.length !== 2) return Infinity;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    return month * 100 + day;
  }
};
