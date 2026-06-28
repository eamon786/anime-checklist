// ui.js — DOM rendering helpers

const UI = {
  sanitizeName(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  },

  buildFileName(item) {
    return `KeyVisual_${this.sanitizeName(item.title)}_${item.kvdate || 'DATA'}.jpg`;
  },

  buildPostRow(item, index) {
    return `[${index + 1}]. ${item.title} [data: ${item.date}; pia. ${item.platform}; DUB: ${item.dub}; generi: ${item.genres}]`;
  },

  platformClass(platform) {
    const map = { 'CR': 'platform-CR', 'NF': 'platform-NF', 'D+': 'platform-DP', 'AP': 'platform-AP' };
    return map[platform] || 'platform-CR';
  },

  platformLabel(platform) {
    const map = { 'CR': 'Crunchyroll', 'NF': 'Netflix', 'D+': 'Disney+', 'AP': 'Amazon Prime' };
    return map[platform] || platform;
  },

  showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${msg}</span>
      <div class="toast-progress"></div>
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'slideOut 0.25s cubic-bezier(0.16,1,0.3,1) forwards';
      setTimeout(() => el.remove(), 250);
    }, 3000);
  },

  copy(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copiato negli appunti!', 'success');
    }).catch(() => {
      this.showToast('Impossibile copiare.', 'error');
    });
  },

  animateTo(el, newVal) {
    const current = parseInt(el.textContent) || 0;
    if (current === newVal) return;
    const duration = 400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = Math.round(current + (newVal - current) * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  /** Render the full anime grid */
  renderGrid(filteredList, fullList, callbacks) {
    const container = document.getElementById('animeGrid');
    const countEl = document.getElementById('resultCount');
    container.innerHTML = '';

    if (countEl) countEl.textContent = filteredList.length + ' di ' + fullList.length + ' anime';

    if (filteredList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/></svg>
          <h3>Nessun anime trovato</h3>
          <p>Prova a modificare i filtri o la ricerca.</p>
        </div>`;
      return;
    }

    filteredList.forEach((item, i) => {
      const globalIndex = fullList.indexOf(item);
      const card = this.createCard(item, globalIndex, callbacks);
      card.style.setProperty('--delay', `${i * 0.04}s`);
      container.appendChild(card);
    });
  },

  createCard(item, index, cb) {
    const card = document.createElement('article');
    card.className = 'anime-card' + (item.checked ? ' completed' : '');
    card.dataset.index = index;

    const platformCls = 'platform-' + item.platform.replace('+', '\\+');
    const fileName = this.buildFileName(item);
    const postRow  = this.buildPostRow(item, index);

    card.innerHTML = `
      <div class="anime-card-top">
        <span class="anime-number">${String(index + 1).padStart(2, '0')}</span>
        <div class="anime-checkbox-wrap">
          <input type="checkbox" class="anime-checkbox" ${item.checked ? 'checked' : ''} aria-label="Segna completato">
        </div>
        <div class="anime-info">
          <div class="anime-title">${this.escHtml(item.title)}</div>
          <div class="anime-meta">
            <span class="badge date">📅 ${item.date}</span>
            <span class="badge platform-${item.platform}">${item.platform === 'D+' ? 'Disney+' : item.platform === 'CR' ? 'Crunchyroll' : item.platform === 'NF' ? 'Netflix' : 'Amazon'}</span>
            ${item.dub === 'si' ? '<span class="badge dub">🇮🇹 DUB ITA</span>' : ''}
          </div>
          <div class="anime-meta" style="margin-top:var(--space-1)">
            ${item.genres.split(',').map(g => `<span class="badge genres">${g.trim()}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="card-section">
        <div class="card-section-label">Riga post</div>
        <div class="code-block" id="postRow-${index}">${this.escHtml(postRow)}</div>
      </div>

      <div class="card-section">
        <div class="card-section-label">Nome file key visual</div>
        <div class="code-block" id="fileName-${index}">${this.escHtml(fileName)}</div>
      </div>

      <div class="card-section">
        <div class="card-section-label">Note</div>
        <textarea class="notes-input" placeholder="Note, idee grafici...">${this.escHtml(item.notes || '')}</textarea>
      </div>

      <div class="card-actions">
        <button class="btn sm" data-action="copy-title">Copia titolo</button>
        <button class="btn sm" data-action="copy-post">Copia riga post</button>
        <button class="btn sm" data-action="copy-file">Copia nome file</button>
        <button class="btn sm" data-action="copy-genres">Copia generi</button>
        <button class="btn sm danger" data-action="delete">Elimina</button>
      </div>`;

    // Checkbox
    card.querySelector('.anime-checkbox').addEventListener('change', e => {
      cb.onCheck(index, e.target.checked);
      card.classList.toggle('completed', e.target.checked);
    });

    // Notes
    card.querySelector('.notes-input').addEventListener('input', e => {
      cb.onNotes(index, e.target.value);
    });

    // Copy / Delete buttons
    card.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'copy-title')  this.copy(item.title);
        if (action === 'copy-post')   this.copy(postRow);
        if (action === 'copy-file')   this.copy(fileName);
        if (action === 'copy-genres') this.copy(item.genres);
        if (action === 'delete')      cb.onDelete(index);
      });
    });

    return card;
  },

  /** Update all stat counters */
  updateStats(list) {
    const total     = list.length;
    const done      = list.filter(a => a.checked).length;
    const remaining = total - done;
    const pct       = total ? Math.round(done / total * 100) : 0;
    const dubCount  = list.filter(a => a.dub === 'si').length;
    const crCount   = list.filter(a => a.platform === 'CR').length;
    const nfCount   = list.filter(a => a.platform === 'NF').length;
    const dpCount   = list.filter(a => a.platform === 'D+').length;
    const apCount   = list.filter(a => a.platform === 'AP').length;

    const anim = (id, val) => {
      const el = document.getElementById(id);
      if (el) this.animateTo(el, val);
    };
    anim('statTotal', total);
    anim('statDone', done);
    anim('statRemaining', remaining);
    anim('statDub', dubCount);
    anim('statCR', crCount);
    anim('statNF', nfCount);
    anim('statDP', dpCount);
    anim('statAP', apCount);

    // Percentage with % sign
    const pctEl = document.getElementById('statPct');
    if (pctEl) {
      const currentPct = parseInt(pctEl.textContent) || 0;
      const duration = 400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        pctEl.textContent = Math.round(currentPct + (pct - currentPct) * eased) + '%';
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    const fill = document.getElementById('progressFill');
    const pctLabel = document.getElementById('pctLabel');
    if (fill)     fill.style.width = pct + '%';
    if (pctLabel) pctLabel.textContent = pct + '%';
  },

  escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
