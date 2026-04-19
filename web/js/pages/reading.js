// pages/reading.js — Reading comprehension

import { contentLoader } from '../content-loader.js';
import { store } from '../store.js';

export async function renderReading(readingId, curriculum) {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!readingId) {
    container.innerHTML = '<p>Select a reading from the sidebar or dashboard.</p>';
    return;
  }

  container.innerHTML = '<div class="loading">Loading text...</div>';

  const reading = await contentLoader.getReadingSet(readingId);
  if (!reading) {
    container.innerHTML = `<div class="error"><h2>Reading not found</h2><p>${readingId}</p></div>`;
    return;
  }

  const texts = reading.texts || [];

  container.innerHTML = `
    <div class="reading-page">
      <div class="reading-header">
        <a href="#/" class="back-link">← Dashboard</a>
        <h1>📚 ${reading.title} <small>/ ${reading.titleEn}</small></h1>
        <span class="cefr-badge">${reading.cefrLevel}</span>
      </div>

      ${texts.map((text, tIdx) => `
        <div class="reading-text-block" id="text-block-${tIdx}">
          <h2>${text.title} <small>/ ${text.titleEn}</small></h2>

          <div class="text-toggle">
            <button class="btn btn-sm" id="toggle-translation-${tIdx}">Show Translation / Arată Traducerea</button>
          </div>

          <div class="text-ro">
            <p>${text.text.replace(/\n/g, '</p><p>')}</p>
          </div>

          <div class="text-en" id="translation-${tIdx}" style="display:none">
            <h4>Translation / Traducere:</h4>
            <p>${text.translation.replace(/\n/g, '</p><p>')}</p>
          </div>

          ${text.vocabularyNotes && text.vocabularyNotes.length > 0 ? `
            <div class="vocab-notes">
              <h4>📝 Vocabulary Notes / Note de Vocabular</h4>
              <dl>
                ${text.vocabularyNotes.map(v => `
                  <dt>${v.word}</dt>
                  <dd>${v.meaning} ${v.notes ? `— <em>${v.notes}</em>` : ''}</dd>
                `).join('')}
              </dl>
            </div>
          ` : ''}

          ${text.questions && text.questions.length > 0 ? `
            <div class="reading-questions">
              <h4>❓ Questions / Întrebări</h4>
              ${text.questions.map((q, qIdx) => `
                <div class="question-block" id="q-${tIdx}-${qIdx}">
                  <p class="question-text"><strong>${qIdx + 1}.</strong> ${q.questionRo || ''} ${q.question ? `<br><em>${q.question}</em>` : ''}</p>

                  ${q.options ? `
                    <div class="options-grid">
                      ${q.options.map(opt => `
                        <button class="option-btn reading-option" data-question="${tIdx}-${qIdx}" data-value="${opt}">${opt}</button>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="fill-answer">
                      <input type="text" class="fill-input" id="reading-fill-${tIdx}-${qIdx}" placeholder="Type your answer..." autocomplete="off">
                      <button class="btn btn-sm btn-primary" id="reading-check-${tIdx}-${qIdx}">Check</button>
                    </div>
                  `}

                  <div class="question-feedback" id="feedback-${tIdx}-${qIdx}" style="display:none"></div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div class="reading-actions">
        <button class="btn btn-success" id="btn-complete-reading">✅ Mark as Complete</button>
      </div>
    </div>
  `;

  // Toggle translations
  texts.forEach((_, tIdx) => {
    const toggle = document.getElementById(`toggle-translation-${tIdx}`);
    if (toggle) {
      toggle.addEventListener('click', () => {
        const el = document.getElementById(`translation-${tIdx}`);
        const visible = el.style.display !== 'none';
        el.style.display = visible ? 'none' : 'block';
        toggle.textContent = visible ? 'Show Translation / Arată Traducerea' : 'Hide Translation / Ascunde Traducerea';
      });
    }
  });

  // Handle multiple choice answers
  container.querySelectorAll('.reading-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const [t, q] = btn.dataset.question.split('-').map(Number);
      const question = texts[t].questions[q];
      const isCorrect = btn.dataset.value === question.answer;

      btn.parentElement.querySelectorAll('.reading-option').forEach(b => {
        b.disabled = true;
        if (b.dataset.value === question.answer) b.classList.add('correct');
        if (b === btn && !isCorrect) b.classList.add('incorrect');
      });

      const fb = document.getElementById(`feedback-${t}-${q}`);
      fb.style.display = 'block';
      fb.className = `question-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
      fb.innerHTML = isCorrect
        ? '<p>✅ Corect! / Correct!</p>'
        : `<p>❌ Correct answer: <strong>${question.answer}</strong></p>`;
    });
  });

  // Handle fill-in answers
  texts.forEach((text, tIdx) => {
    (text.questions || []).forEach((q, qIdx) => {
      if (q.options) return; // skip MC
      const checkBtn = document.getElementById(`reading-check-${tIdx}-${qIdx}`);
      if (!checkBtn) return;
      checkBtn.addEventListener('click', () => {
        const input = document.getElementById(`reading-fill-${tIdx}-${qIdx}`);
        const userVal = input.value.trim().toLowerCase();
        const acceptable = (q.acceptableAnswers || [q.answer]).map(a => a.toLowerCase());
        const isCorrect = acceptable.some(a => userVal === a);
        input.disabled = true;
        input.classList.add(isCorrect ? 'correct' : 'incorrect');
        checkBtn.disabled = true;
        const fb = document.getElementById(`feedback-${tIdx}-${qIdx}`);
        fb.style.display = 'block';
        fb.className = `question-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        fb.innerHTML = isCorrect
          ? '<p>✅ Corect! / Correct!</p>'
          : `<p>❌ Correct answer: <strong>${q.answer}</strong></p>`;
      });
    });
  });

  // Complete button
  document.getElementById('btn-complete-reading')?.addEventListener('click', () => {
    store.setLessonProgress(readingId, 'completed', 100);
    store.updateStreak();
  });
}
