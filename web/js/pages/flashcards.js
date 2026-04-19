// pages/flashcards.js — Spaced repetition flashcards

import { contentLoader } from '../content-loader.js';
import { store } from '../store.js';

// SM-2 Algorithm
function sm2(quality, card) {
  // quality: 0-5 (0=complete failure, 5=perfect)
  // card: { interval, repetition, efactor }
  const c = card || { interval: 0, repetition: 0, efactor: 2.5 };

  let { interval, repetition, efactor } = c;

  if (quality >= 3) {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * efactor);
    repetition++;
  } else {
    repetition = 0;
    interval = 1;
  }

  efactor = Math.max(1.3, efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const today = new Date().toISOString().split('T')[0];

  return { interval, repetition, efactor, lastReview: today, nextReview: addDays(today, interval) };
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function renderFlashcards(curriculum) {
  const container = document.getElementById('app-content');
  if (!container) return;

  container.innerHTML = '<div class="loading">Loading flashcards...</div>';

  // Load all vocabulary
  const allVocab = [];
  const themeIds = (curriculum?.weeks || []).flatMap(w => w.vocabularyThemes || []);
  const uniqueThemes = [...new Set(themeIds)];

  for (const themeId of uniqueThemes) {
    const data = await contentLoader.getVocabularyTheme(themeId);
    if (data?.words) allVocab.push(...data.words);
  }

  // Get today's cards
  const today = new Date().toISOString().split('T')[0];
  const settings = store.getState().settings;

  // Due cards (for review)
  const dueCards = allVocab.filter(w => {
    const fc = store.getFlashcardData(w.id);
    if (!fc) return false;
    return fc.nextReview <= today;
  }).slice(0, settings.reviewCardsPerDay);

  // New cards
  const learnedIds = new Set(Object.keys(store.getState().flashcards));
  const newCards = allVocab.filter(w => !learnedIds.has(w.id))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, settings.newCardsPerDay);

  const cards = [...dueCards, ...newCards];
  let currentIndex = 0;

  if (cards.length === 0) {
    container.innerHTML = `
      <div class="flashcards-page">
        <div class="flashcards-header">
          <a href="#/" class="back-link">← Dashboard</a>
          <h1>🃏 Flashcards</h1>
        </div>
        <div class="empty-state">
          <h2>🎉 All done for today!</h2>
          <p>You've reviewed all due cards. Come back tomorrow!</p>
          <p>Și mâine! / See you tomorrow!</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="flashcards-page">
      <div class="flashcards-header">
        <a href="#/" class="back-link">← Dashboard</a>
        <h1>🃏 Flashcards</h1>
        <div class="flashcard-stats">
          <span>Due for review: ${dueCards.length}</span>
          <span>New: ${newCards.length}</span>
          <span>Total: ${currentIndex + 1} / ${cards.length}</span>
        </div>
      </div>

      <div class="flashcard-container" id="flashcard-area"></div>

      <div class="flashcard-controls">
        <button class="btn btn-danger" id="btn-again">😢 Again (0)</button>
        <button class="btn btn-warning" id="btn-hard">:/ Hard (2)</button>
        <button class="btn btn-secondary" id="btn-ok">🙂 OK (3)</button>
        <button class="btn btn-success" id="btn-easy">😊 Easy (5)</button>
      </div>
    </div>
  `;

  function renderCard(index) {
    if (index >= cards.length) {
      container.innerHTML = `
        <div class="flashcards-page">
          <div class="flashcards-header">
            <a href="#/" class="back-link">← Dashboard</a>
            <h1>🃏 Flashcards</h1>
          </div>
          <div class="empty-state">
            <h2>🎉 Session complete!</h2>
            <p>You reviewed ${cards.length} cards. Great work!</p>
            <a href="#/" class="btn btn-primary">← Dashboard</a>
          </div>
        </div>
      `;
      return;
    }

    const card = cards[index];
    const area = document.getElementById('flashcard-area');

    area.innerHTML = `
      <div class="flashcard" id="current-flashcard">
        <div class="flashcard-front">
          <div class="card-word">${card.word}</div>
          ${card.pronunciation ? `<div class="card-pronunciation">${card.pronunciation}</div>` : ''}
          ${card.partOfSpeech ? `<div class="card-pos">${card.partOfSpeech}</div>` : ''}
          <div class="card-hint">Click to reveal / Apasă pentru a vedea</div>
        </div>
        <div class="flashcard-back" style="display:none">
          <div class="card-translation">${card.translationEn}</div>
          ${card.exampleSentence ? `<div class="card-example"><strong>Exemplu:</strong> ${card.exampleSentence}</div>` : ''}
          ${card.exampleTranslation ? `<div class="card-example-en">${card.exampleTranslation}</div>` : ''}
          ${card.tags ? `<div class="card-tags">${card.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</div>` : ''}
        </div>
      </div>
    `;

    // Flip on click
    document.getElementById('current-flashcard').addEventListener('click', (e) => {
      if (e.target.closest('.flashcard-controls')) return;
      const front = area.querySelector('.flashcard-front');
      const back = area.querySelector('.flashcard-back');
      const isFlipped = back.style.display !== 'none';
      front.style.display = isFlipped ? 'block' : 'none';
      back.style.display = isFlipped ? 'none' : 'block';
    });
  }

  function rateCard(quality) {
    const card = cards[currentIndex];
    const prev = store.getFlashcardData(card.id);
    const result = sm2(quality, prev);
    store.updateFlashcard(card.id, result);
    currentIndex++;
    renderCard(currentIndex);
  }

  document.getElementById('btn-again').addEventListener('click', () => rateCard(0));
  document.getElementById('btn-hard').addEventListener('click', () => rateCard(2));
  document.getElementById('btn-ok').addEventListener('click', () => rateCard(3));
  document.getElementById('btn-easy').addEventListener('click', () => rateCard(5));

  renderCard(0);
}
