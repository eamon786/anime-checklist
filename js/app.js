// app.js — Main application controller

// ── State ─────────────────────────────────────────────
let seasons      = [];          // manifest from seasons.json
let currentAnime = [];          // raw list for current season (no checked state)
let currentSeason = null;       // season object

let filterState = {
  search:   '',
  platform: 'all',
  dubIta:   false,
  status:   'all',  // 'all' | 'completed' | 'remaining'
  sortBy:   'default'
};

// ── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  restoreFilterState();
  await loadSeasons();
  bindEvents();
  renderFiltersUI();
});

// ── Utilities ─────────────────────────────────────────
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ── Season loading ─────────────────────────────────────
async function loadSeasons() {
  seasons = await Loader.fetchSeasons();
  const select = document.getElementById('seasonSelect');
  select.innerHTML = '';

  if (seasons.length === 0) {
    select.innerHTML = '<option value="">Nessuna stagione trovata</option>';
    showImportFallback();
    return;
  }

  seasons.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.title;
    select.appendChild(opt);
  });

  // Restore last selected season
  const saved = Storage.get('currentSeason');
  const target = saved && seasons.find(s => s.id === saved) ? saved : seasons[0].id;
  select.value = target;
  await switchSeason(target);
}

async function switchSeason(id) {
  const season = seasons.find(s => s.id === id);
  if (!season) return;
  currentSeason = season;
  Storage.set('currentSeason', id);

  const grid = document.getElementById('animeGrid');
  if (grid) {
    grid.style.opacity = '0';
    grid.style.transition = 'opacity 0.2s ease';
  }

  try {
    const raw = await Loader.fetchSeason(season.file);
    // Load persisted checked state and notes for this season
    const savedChecked = Storage.get('checked-' + id, {});
    const savedNotes = Storage.get('notes-' + id, {});
    
    currentAnime = raw.map((item, i) => ({
      ...Loader.normalizeItem(item),
      checked: !!savedChecked[i],
      notes: savedNotes[i] || item.notes || ''
    }));
    
    renderAll();
    
    if (grid) {
      requestAnimationFrame(() => {
        grid.style.opacity = '1';
      });
    }
    
    UI.showToast('Stagione caricata: ' + season.title, 'success');
  } catch (e) {
    UI.showToast('Errore caricamento stagione: ' + e.message, 'error');
  }
}

// Merge checked state back into anime list and persist
function persistChecked() {
  if (!currentSeason) return;
  const map = {};
  currentAnime.forEach((item, i) => { if (item.checked) map[i] = true; });
  Storage.set('checked-' + currentSeason.id, map);
}

function persistNotes() {
  if (!currentSeason) return;
  const map = {};
  currentAnime.forEach((item, i) => { if (item.notes) map[i] = item.notes; });
  Storage.set('notes-' + currentSeason.id, map);
}

// ── Render ─────────────────────────────────────────────
function renderAll() {
  const filtered = Filters.apply(currentAnime, filterState);
  const sorted = Filters.sort(filtered, filterState.sortBy);
  
  UI.renderGrid(sorted, currentAnime, {
    onCheck:  handleCheck,
    onNotes:  handleNotes,
    onDelete: handleDelete
  });
  UI.updateStats(currentAnime);
}

// ── Event handlers ─────────────────────────────────────
function handleCheck(index, value) {
  currentAnime[index].checked = value;
  UI.updateStats(currentAnime);
  persistChecked();
}

function handleNotes(index, value) {
  currentAnime[index].notes = value;
  persistNotes();
}

function handleDelete(index) {
  if (!confirm('Rimuovere "' + currentAnime[index].title + '" dalla lista?')) return;
  currentAnime.splice(index, 1);
  persistChecked();
  renderAll();
}

function bindEvents() {
  // Season selector
  document.getElementById('seasonSelect').addEventListener('change', async e => {
    await switchSeason(e.target.value);
  });

  // Sort selector
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      filterState.sortBy = e.target.value;
      saveFilterState();
      renderAll();
    });
  }

  // Hamburger menu
  const hamburger = document.getElementById('hamburgerBtn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });
    
    if (overlay) {
      overlay.addEventListener('click', () => {
        hamburger.classList.remove('active');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  }

  // Search
  const debouncedSearch = debounce(() => renderAll(), 300);
  document.getElementById('searchInput').addEventListener('input', e => {
    filterState.search = e.target.value;
    Storage.set('filter-search', filterState.search);
    debouncedSearch();
  });

  // Export JSON
  document.getElementById('exportBtn').addEventListener('click', () => {
    if (!currentAnime.length) { UI.showToast('Nessun dato da esportare.', 'error'); return; }
    const data = currentAnime.map(({ checked: _, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (currentSeason ? currentSeason.id : 'anime') + '.json';
    a.click();
  });

  // Import JSON (button + file input)
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    await importFile(file);
  });

  // Drag & drop on upload zone
  const dropZone = document.getElementById('dropZone');
  if (dropZone) {
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', async e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) await importFile(file);
    });
    dropZone.addEventListener('click', () => document.getElementById('importFile').click());
  }

  // Filter chips
  document.querySelectorAll('[data-filter]').forEach(el => {
    el.addEventListener('click', () => {
      const { filter, value } = el.dataset;
      if (filter === 'platform') {
        filterState.platform = value;
        document.querySelectorAll('[data-filter="platform"]').forEach(c => c.classList.toggle('active', c.dataset.value === value));
      }
      if (filter === 'status') {
        filterState.status = value;
        document.querySelectorAll('[data-filter="status"]').forEach(c => c.classList.toggle('active', c.dataset.value === value));
      }
      if (filter === 'dub') {
        filterState.dubIta = !filterState.dubIta;
        el.classList.toggle('active', filterState.dubIta);
        filterState.dubIta ? el.dataset.value = 'on' : el.dataset.value = 'off';
      }
      saveFilterState();
      renderAll();
    });
  });
}

async function importFile(file) {
  try {
    const data = await Loader.readFile(file);
    if (!data.every(Loader.validateItem)) throw new Error('Alcuni elementi mancano del campo "title".');
    currentAnime = data.map((item, i) => ({ ...Loader.normalizeItem(item), checked: false }));
    persistChecked();
    renderAll();
    UI.showToast('Importati ' + data.length + ' anime.', 'success');
  } catch (e) {
    UI.showToast(e.message, 'error');
  }
}

function renderFiltersUI() {
  // Restore platform chip active state
  document.querySelectorAll('[data-filter="platform"]').forEach(c => {
    c.classList.toggle('active', c.dataset.value === filterState.platform);
  });
  document.querySelectorAll('[data-filter="status"]').forEach(c => {
    c.classList.toggle('active', c.dataset.value === filterState.status);
  });
  const dubChip = document.querySelector('[data-filter="dub"]');
  if (dubChip) dubChip.classList.toggle('active', filterState.dubIta);

  // Restore search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = filterState.search;
  
  // Restore sort select
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = filterState.sortBy;
}

function saveFilterState() {
  Storage.set('filters', {
    platform: filterState.platform,
    dubIta:   filterState.dubIta,
    status:   filterState.status,
    sortBy:   filterState.sortBy
  });
}

function restoreFilterState() {
  const saved = Storage.get('filters', {});
  if (saved.platform) filterState.platform = saved.platform;
  if (saved.dubIta   !== undefined) filterState.dubIta = saved.dubIta;
  if (saved.status)  filterState.status  = saved.status;
  if (saved.sortBy)  filterState.sortBy  = saved.sortBy;
  filterState.search = Storage.get('filter-search', '');
}

function showImportFallback() {
  const dropZone = document.getElementById('dropZone');
  if (dropZone) dropZone.style.display = 'flex';
}
