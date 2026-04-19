// pages/exercise.js — Exercise engine with New and Review modes

import { contentLoader } from '../content-loader.js';
import { store } from '../store.js';

export async function renderExercise(exerciseId, mode, curriculum) {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!exerciseId) {
    container.innerHTML = '<p>Select an exercise from the sidebar or dashboard.</p>';
    return;
  }

  mode = mode || 'new';
  container.innerHTML = '<div class="loading">Loading exercise...</div>';

  const exerciseSet = await contentLoader.getExerciseSet(exerciseId, mode);
  if (!exerciseSet) {
    container.innerHTML = `<div class="error"><h2>Exercise not found</h2><p>${exerciseId} (${mode})</p></div>`;
    return;
  }

  const exercises = exerciseSet.exercises || [];
  let currentIndex = 0;
  let score = 0;
  let answers = [];

  container.innerHTML = `
    <div class="exercise-page">
      <div class="exercise-header">
        <a href="#/" class="back-link">← Dashboard</a>
        <h1>${exerciseSet.title} <small>/ ${exerciseSet.titleRo || ''}</small></h1>
        <div class="exercise-meta">
          <span class="mode-badge ${mode}">${mode === 'new' ? '📝 New / Nou' : '🔄 Review / Recapitulare'}</span>
          <span class="cefr-badge">${exerciseSet.cefrLevel}</span>
        </div>
        <div class="exercise-progress">
          <span id="ex-counter">1 / ${exercises.length}</span>
          <div class="progress-track"><div class="progress-fill" id="ex-progress-fill" style="width:0%"></div></div>
        </div>
      </div>

      <div id="exercise-content"></div>

      <div class="exercise-nav">
        <button class="btn btn-secondary" id="ex-prev" disabled>← Previous</button>
        <button class="btn btn-primary" id="ex-next">Next →</button>
      </div>

      <div id="exercise-results" class="exercise-results" style="display:none"></div>
    </div>
  `;

  function renderExerciseItem(index) {
    const ex = exercises[index];
    if (!ex) return;

    document.getElementById('ex-counter').textContent = `${index + 1} / ${exercises.length}`;
    document.getElementById('ex-progress-fill').style.width = `${((index + 1) / exercises.length) * 100}%`;
    document.getElementById('ex-prev').disabled = index === 0;

    const contentEl = document.getElementById('exercise-content');
    contentEl.innerHTML = `
      <div class="exercise-item" data-id="${ex.id}" data-type="${ex.type}">
        <div class="exercise-prompt">
          ${ex.promptRo ? `<p class="prompt-ro">${ex.promptRo}</p>` : ''}
          <p class="prompt-en">${ex.prompt}</p>
          ${ex.sentence ? `<p class="exercise-sentence">${ex.sentence}</p>` : ''}
        </div>
        <div class="exercise-input" id="exercise-input"></div>
        <div class="exercise-feedback" id="exercise-feedback" style="display:none"></div>
      </div>
    `;

    const inputEl = document.getElementById('exercise-input');
    renderExerciseType(ex, inputEl);

    // Show/hide next button
    const nextBtn = document.getElementById('ex-next');
    if (index === exercises.length - 1) {
      nextBtn.textContent = '✅ Finish / Termină';
    } else {
      nextBtn.textContent = 'Next →';
    }
  }

  function renderExerciseType(ex, container) {
    switch (ex.type) {
      case 'multiple-choice':
        container.innerHTML = `
          <div class="options-grid">
            ${(ex.options || []).map((opt, i) => `
              <button class="option-btn" data-value="${opt}">${opt}</button>
            `).join('')}
          </div>
        `;
        container.querySelectorAll('.option-btn').forEach(btn => {
          btn.addEventListener('click', () => handleAnswer(btn, ex));
        });
        break;

      case 'fill-blank':
        container.innerHTML = `
          <input type="text" class="fill-input" id="fill-answer" placeholder="Type your answer..." autocomplete="off">
          <button class="btn btn-primary" id="btn-check-fill">Check / Verifică</button>
        `;
        document.getElementById('btn-check-fill').addEventListener('click', () => {
          const input = document.getElementById('fill-answer');
          handleFillAnswer(input.value, ex);
        });
        document.getElementById('fill-answer').addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const input = document.getElementById('fill-answer');
            handleFillAnswer(input.value, ex);
          }
        });
        break;

      case 'translation':
        container.innerHTML = `
          <textarea class="translation-input" id="translation-answer" rows="3" placeholder="Type your translation..."></textarea>
          <button class="btn btn-primary" id="btn-check-translation">Check / Verifică</button>
        `;
        document.getElementById('btn-check-translation').addEventListener('click', () => {
          handleTranslationAnswer(document.getElementById('translation-answer').value, ex);
        });
        break;

      case 'matching':
        if (ex.pairs) {
          const shuffled = [...ex.pairs].sort(() => Math.random() - 0.5);
          const rights = [...ex.pairs].sort(() => Math.random() - 0.5);
          container.innerHTML = `
            <div class="matching-game">
              <div class="matching-left">
                ${shuffled.map((p, i) => `<div class="match-item match-left" data-index="${i}" data-value="${p.left}">${p.left}</div>`).join('')}
              </div>
              <div class="matching-right">
                ${rights.map((p, i) => `<div class="match-item match-right" data-value="${p.right}">${p.right}</div>`).join('')}
              </div>
            </div>
            <p class="hint">Click a left item, then click its match on the right.</p>
          `;
          // Simple matching: click left then right, score once per exercise
          let selectedLeft = null;
          let matchedPairs = 0;
          let correctPairs = 0;
          const totalPairs = ex.pairs.length;

          container.querySelectorAll('.match-left').forEach(el => {
            el.addEventListener('click', () => {
              container.querySelectorAll('.match-left').forEach(e => e.classList.remove('selected'));
              if (!el.classList.contains('correct') && !el.classList.contains('incorrect')) {
                el.classList.add('selected');
                selectedLeft = el.dataset.value;
              }
            });
          });
          container.querySelectorAll('.match-right').forEach(el => {
            el.addEventListener('click', () => {
              if (!selectedLeft) return;
              const correctPair = ex.pairs.find(p => p.left === selectedLeft);
              const isCorrect = correctPair && correctPair.right === el.dataset.value;
              el.classList.add(isCorrect ? 'correct' : 'incorrect');
              const leftEl = container.querySelector(`.match-left[data-value="${CSS.escape(selectedLeft)}"]`);
              if (leftEl) leftEl.classList.add(isCorrect ? 'correct' : 'incorrect');
              matchedPairs++;
              if (isCorrect) correctPairs++;
              selectedLeft = null;

              // Score once after all pairs are matched
              if (matchedPairs === totalPairs) {
                const allCorrect = correctPairs === totalPairs;
                answers.push({ id: ex.id, correct: allCorrect });
                if (allCorrect) score++;
                showFeedback(ex, allCorrect);
                document.getElementById('btn-check-rearrange')?.remove();
              }
            });
          });
        }
        break;

      case 'conjugation':
        if (ex.answers) {
          container.innerHTML = `
            <p><strong>${ex.verb || ''}</strong> — ${ex.tense || ''} ${ex.mood || ''}</p>
            <div class="conjugation-table">
              ${Object.entries(ex.answers).map(([person, form]) => `
                <div class="conj-row">
                  <label>${person}</label>
                  <input type="text" class="conj-input" data-answer="${form}" placeholder="..." autocomplete="off">
                </div>
              `).join('')}
            </div>
            <button class="btn btn-primary" id="btn-check-conj">Check / Verifică</button>
          `;
          document.getElementById('btn-check-conj').addEventListener('click', () => {
            let allCorrect = true;
            container.querySelectorAll('.conj-input').forEach(input => {
              const userVal = input.value.trim().toLowerCase();
              const correct = input.dataset.answer.toLowerCase();
              const acceptable = [correct];
              if (userVal === correct || (ex.acceptableAnswers && ex.acceptableAnswers.map(a => a.toLowerCase()).includes(userVal))) {
                input.classList.add('correct');
                input.classList.remove('incorrect');
              } else {
                input.classList.add('incorrect');
                input.classList.remove('correct');
                allCorrect = false;
              }
              input.disabled = true;
            });
            answers.push({ id: ex.id, correct: allCorrect });
            if (allCorrect) score++;
            showFeedback(ex, allCorrect);
          });
        }
        break;

      case 'rearrange':
        if (ex.words) {
          const shuffled = [...ex.words].sort(() => Math.random() - 0.5);
          container.innerHTML = `
            <div class="rearrange-area">
              <div class="rearrange-bank" id="rearrange-bank">
                ${shuffled.map((w, i) => `<span class="word-chip" data-word="${w}">${w}</span>`).join('')}
              </div>
              <div class="rearrange-answer" id="rearrange-answer"></div>
            </div>
            <button class="btn btn-primary" id="btn-check-rearrange">Check / Verifică</button>
          `;
          const bank = document.getElementById('rearrange-bank');
          const answer = document.getElementById('rearrange-answer');
          bank.querySelectorAll('.word-chip').forEach(chip => {
            chip.addEventListener('click', () => {
              answer.appendChild(chip);
            });
          });
          answer.addEventListener('click', (e) => {
            if (e.target.classList.contains('word-chip')) {
              bank.appendChild(e.target);
            }
          });
          document.getElementById('btn-check-rearrange').addEventListener('click', () => {
            const userAnswer = Array.from(answer.querySelectorAll('.word-chip')).map(c => c.dataset.word).join(' ');
            const correct = ex.answer;
            const isCorrect = userAnswer === correct ||
              (ex.acceptableAnswers && ex.acceptableAnswers.includes(userAnswer));
            answers.push({ id: ex.id, correct: isCorrect });
            if (isCorrect) score++;
            showFeedback(ex, isCorrect);
          });
        }
        break;

      case 'error-correction':
        container.innerHTML = `
          <div class="error-correction-exercise">
            <p class="sentence-with-error">${ex.sentence}</p>
            <input type="text" class="fill-input" id="error-correction-answer" placeholder="Type the corrected sentence..." autocomplete="off">
            <button class="btn btn-primary" id="btn-check-error">Check / Verifică</button>
          </div>
        `;
        document.getElementById('btn-check-error').addEventListener('click', () => {
          const input = document.getElementById('error-correction-answer');
          const userVal = input.value.trim().toLowerCase();
          const correct = (ex.answer || '').toLowerCase();
          const acceptable = (ex.acceptableAnswers || [ex.answer]).map(a => a.toLowerCase());
          const isCorrect = acceptable.includes(userVal);
          answers.push({ id: ex.id, correct: isCorrect });
          if (isCorrect) score++;
          input.disabled = true;
          input.classList.add(isCorrect ? 'correct' : 'incorrect');
          document.getElementById('btn-check-error').disabled = true;
          showFeedback(ex, isCorrect);
        });
        document.getElementById('error-correction-answer').addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const input = document.getElementById('error-correction-answer');
            if (!input.disabled) {
              document.getElementById('btn-check-error').click();
            }
          }
        });
        break;

      case 'writing':
        container.innerHTML = `
          <div class="writing-exercise">
            <textarea class="writing-input" id="writing-answer" rows="8" placeholder="Scrie răspunsul tău aici... / Write your answer here..."></textarea>
            <div class="writing-actions">
              <button class="btn btn-primary" id="btn-show-model">Show Model Answer / Arată Modelul</button>
            </div>
            <div id="model-answer-section" style="display:none">
              <h3>Model Answer / Răspuns Model</h3>
              <div class="model-answer-text">${(ex.answer || '').replace(/\n/g, '<br>')}</div>
              ${ex.rubric ? `
                <h4>Rubric / Grilă de Evaluare (${ex.rubric.totalPoints} points)</h4>
                <ul class="rubric-list">
                  ${(ex.rubric.criteria || []).map(c => `
                    <li><strong>${c.name}</strong> (${c.maxPoints} pts): ${c.description}</li>
                  `).join('')}
                </ul>
              ` : ''}
              <div class="writing-self-eval">
                <p>Rate yourself / Autoevaluează-te:</p>
                <button class="btn btn-success" id="btn-writing-ok">✅ I did well / Am făcut bine</button>
                <button class="btn btn-secondary" id="btn-writing-meh">😐 Needs work / Mai am de lucrat</button>
              </div>
            </div>
          </div>
        `;
        document.getElementById('btn-show-model').addEventListener('click', () => {
          document.getElementById('model-answer-section').style.display = 'block';
          document.getElementById('btn-show-model').style.display = 'none';
        });
        document.getElementById('btn-writing-ok').addEventListener('click', () => {
          answers.push({ id: ex.id, correct: true });
          score++;
          showFeedback(ex, true);
          document.getElementById('btn-writing-ok').disabled = true;
          document.getElementById('btn-writing-meh').disabled = true;
        });
        document.getElementById('btn-writing-meh').addEventListener('click', () => {
          answers.push({ id: ex.id, correct: false });
          showFeedback(ex, false);
          document.getElementById('btn-writing-ok').disabled = true;
          document.getElementById('btn-writing-meh').disabled = true;
        });
        break;

      default:
        container.innerHTML = `<p>Exercise type '${ex.type}' not yet implemented.</p>`;
    }
  }

  function handleAnswer(btn, ex) {
    const isCorrect = btn.dataset.value === ex.answer;
    // Disable all buttons
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.value === ex.answer) b.classList.add('correct');
      if (b.dataset.value !== ex.answer && b === btn && !isCorrect) b.classList.add('incorrect');
    });
    answers.push({ id: ex.id, correct: isCorrect });
    if (isCorrect) score++;
    showFeedback(ex, isCorrect);
  }

  function handleFillAnswer(value, ex) {
    const userVal = value.trim().toLowerCase();
    const correct = (ex.answer || '').toLowerCase();
    const acceptable = (ex.acceptableAnswers || [ex.answer]).map(a => a.toLowerCase());
    const isCorrect = acceptable.includes(userVal);
    answers.push({ id: ex.id, correct: isCorrect });
    if (isCorrect) score++;
    const input = document.getElementById('fill-answer');
    input.disabled = true;
    input.classList.add(isCorrect ? 'correct' : 'incorrect');
    document.getElementById('btn-check-fill').disabled = true;
    showFeedback(ex, isCorrect);
  }

  function handleTranslationAnswer(value, ex) {
    const userVal = value.trim();
    const acceptable = (ex.acceptableAnswers || [ex.answer]).map(a => a.toLowerCase());
    const isCorrect = acceptable.some(a => {
      const user = userVal.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
      return user === a.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
    });
    answers.push({ id: ex.id, correct: isCorrect });
    if (isCorrect) score++;
    const textarea = document.getElementById('translation-answer');
    textarea.disabled = true;
    textarea.classList.add(isCorrect ? 'correct' : 'incorrect');
    document.getElementById('btn-check-translation').disabled = true;
    showFeedback(ex, isCorrect);
  }

  function showFeedback(ex, isCorrect) {
    const fb = document.getElementById('exercise-feedback');
    fb.style.display = 'block';
    fb.className = `exercise-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    fb.innerHTML = `
      <p class="feedback-label">${isCorrect ? '✅ Corect! / Correct!' : '❌ Nu e corect / Not correct'}</p>
      ${!isCorrect ? `<p class="correct-answer">Correct answer: <strong>${ex.answer}</strong></p>` : ''}
      ${ex.explanation ? `<p class="explanation">${ex.explanation}</p>` : ''}
      ${ex.explanationRo ? `<p class="explanation-ro">${ex.explanationRo}</p>` : ''}
    `;
  }

  // Navigation
  document.getElementById('ex-prev').addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderExerciseItem(currentIndex);
    }
  });

  document.getElementById('ex-next').addEventListener('click', () => {
    if (currentIndex < exercises.length - 1) {
      currentIndex++;
      renderExerciseItem(currentIndex);
    } else {
      // Show results
      const pct = Math.round((score / exercises.length) * 100);
      const problemExercises = answers.filter(a => !a.correct).map(a => a.id);
      store.recordExerciseScore(exerciseId, mode, pct, problemExercises);
      store.updateStreak();

      // Mark exercise as completed in progress tracking
      if (pct >= 70) {
        store.setLessonProgress(exerciseId, 'completed', pct);
      }

      // Track weak areas
      if (pct < 70 && mode === 'new') {
        store.addWeakArea(exerciseSet.prerequisites?.[0] || exerciseId);
      }

      document.getElementById('exercise-content').style.display = 'none';
      document.querySelector('.exercise-nav').style.display = 'none';
      document.getElementById('exercise-results').style.display = 'block';
      document.getElementById('exercise-results').innerHTML = `
        <div class="results-card">
          <h2>Rezultate / Results</h2>
          <div class="score-display ${pct >= 70 ? 'pass' : 'fail'}">${pct}%</div>
          <p>${score} / ${exercises.length} correct</p>
          ${pct >= 70 ? '<p class="pass-msg">🎉 Great job! / Felicitări!</p>' : '<p class="fail-msg">💪 Keep practicing! / Continuă să exersezi!</p>'}
          <div class="results-actions">
            <a href="#/" class="btn btn-secondary">← Dashboard</a>
            <button class="btn btn-primary" onclick="location.reload()">🔄 Try Again</button>
          </div>
        </div>
      `;
    }
  });

  // Render first exercise
  renderExerciseItem(0);
}
