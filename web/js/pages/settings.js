// pages/settings.js

import { store } from '../store.js';

export async function renderSettings() {
  const container = document.getElementById('app-content');
  if (!container) return;

  const state = store.getState();

  container.innerHTML = `
    <div class="settings-page">
      <div class="settings-header">
        <a href="#/" class="back-link">← Dashboard</a>
        <h1>⚙️ Settings / Setări</h1>
      </div>

      <div class="settings-section">
        <h2>Study Settings / Setări de Studiu</h2>
        <div class="setting-item">
          <label>New flashcards per day / Carduri noi pe zi:</label>
          <input type="number" id="setting-new-cards" value="${state.settings.newCardsPerDay}" min="1" max="50">
        </div>
        <div class="setting-item">
          <label>Review cards per day / Carduri de recapitulare pe zi:</label>
          <input type="number" id="setting-review-cards" value="${state.settings.reviewCardsPerDay}" min="1" max="200">
        </div>
        <button class="btn btn-primary" id="btn-save-settings">Save / Salvează</button>
      </div>

      <div class="settings-section">
        <h2>Data Management / Gestionare Date</h2>
        <div class="setting-actions">
          <button class="btn btn-secondary" id="btn-export">📤 Export Progress</button>
          <button class="btn btn-secondary" id="btn-import">📥 Import Progress</button>
          <button class="btn btn-danger" id="btn-reset">🗑️ Reset All Progress</button>
        </div>
        <div id="import-area" style="display:none">
          <textarea id="import-text" rows="5" placeholder="Paste exported JSON here..."></textarea>
          <button class="btn btn-primary" id="btn-do-import">Import</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const s = store.getState();
    s.settings.newCardsPerDay = parseInt(document.getElementById('setting-new-cards').value) || 10;
    s.settings.reviewCardsPerDay = parseInt(document.getElementById('setting-review-cards').value) || 30;
    const btn = document.getElementById('btn-save-settings');
    btn.textContent = '✅ Saved!';
    setTimeout(() => { btn.textContent = 'Save / Salvează'; }, 2000);
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const data = store.exportData();
    navigator.clipboard.writeText(data).then(() => {
      const btn = document.getElementById('btn-export');
      btn.textContent = '✅ Copied to clipboard!';
      setTimeout(() => { btn.textContent = '📤 Export Progress'; }, 2000);
    });
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-area').style.display = 'block';
  });

  document.getElementById('btn-do-import').addEventListener('click', () => {
    const text = document.getElementById('import-text').value;
    if (store.importData(text)) {
      alert('Progress imported successfully!');
      location.reload();
    } else {
      alert('Import failed. Check the JSON format.');
    }
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Are you sure? This will delete ALL your progress! / Ești sigur? Se va șterge tot progresul!')) {
      store.resetData();
      alert('Progress reset. Reloading...');
      location.reload();
    }
  });
}
