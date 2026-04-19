// pages/vocabulary.js — Vocabulary browser

import { contentLoader } from '../content-loader.js';

export async function renderVocabulary(themeId, curriculum) {
  const container = document.getElementById('app-content');
  if (!container) return;

  // Build theme list from curriculum
  const allThemes = (curriculum?.weeks || []).flatMap(w =>
    (w.vocabularyThemes || []).map(t => ({ id: t, week: w.week }))
  );
  const uniqueThemes = [...new Map(allThemes.map(t => [t.id, t])).values()];

  container.innerHTML = `
    <div class="vocabulary-page">
      <div class="vocab-header">
        <a href="#/" class="back-link">← Dashboard</a>
        <h1>📝 Vocabulary / Vocabular</h1>
      </div>

      <div class="theme-selector">
        <label for="theme-select">Theme / Temă:</label>
        <select id="theme-select">
          ${uniqueThemes.map(t => `<option value="${t.id}" ${t.id === themeId ? 'selected' : ''}>Week ${t.week}: ${t.id}</option>`).join('')}
        </select>
      </div>

      <div id="vocab-content" class="vocab-content">
        <div class="loading">Loading vocabulary...</div>
      </div>
    </div>
  `;

  const select = document.getElementById('theme-select');

  async function loadTheme(tid) {
    const content = document.getElementById('vocab-content');
    content.innerHTML = '<div class="loading">Loading...</div>';

    const data = await contentLoader.getVocabularyTheme(tid);
    if (!data || !data.words) {
      content.innerHTML = '<p>No vocabulary found for this theme.</p>';
      return;
    }

    content.innerHTML = `
      <div class="vocab-info">
        <h2>${data.themeRo} / ${data.themeEn}</h2>
        <p>${data.words.length} words · Level: ${data.cefrLevel}</p>
      </div>

      ${data.phrases && data.phrases.length > 0 ? `
        <div class="phrases-section">
          <h3>💬 Phrases / Expresii</h3>
          ${data.phrases.map(p => `
            <div class="phrase-card">
              <div class="phrase-text">${p.phrase}</div>
              <div class="phrase-translation">${p.translationEn}</div>
              ${p.context ? `<div class="phrase-context">📝 ${p.context}</div>` : ''}
              ${p.exampleResponse ? `<div class="phrase-response">💬 ${p.exampleResponse}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="words-section">
        <h3>📚 Words / Cuvinte</h3>
        <div class="words-list">
          ${data.words.map(w => `
            <div class="word-card">
              <div class="word-main">
                <span class="word-text">${w.word}</span>
                ${w.pronunciation ? `<span class="word-pron">${w.pronunciation}</span>` : ''}
                <span class="word-pos">${w.partOfSpeech || ''}</span>
              </div>
              <div class="word-translation">${w.translationEn}</div>
              ${w.exampleSentence ? `
                <div class="word-example">
                  <span class="example-ro">${w.exampleSentence}</span>
                  <span class="example-en">${w.exampleTranslation || ''}</span>
                </div>
              ` : ''}
              ${w.tags ? `<div class="word-tags">${w.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  select.addEventListener('change', () => loadTheme(select.value));
  await loadTheme(themeId || uniqueThemes[0]?.id);
}
