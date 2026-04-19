// pages/dashboard.js

import { store } from '../store.js';
import { contentLoader } from '../content-loader.js';
import { renderProgressBar } from '../components/progress-bar.js';

export async function renderDashboard(curriculum) {
  const container = document.getElementById('app-content');
  if (!container || !curriculum) return;

  const state = store.getState();
  const streak = store.getStreak();
  const weeks = curriculum.weeks || [];
  const currentWeek = weeks.find(w => w.week === state.weekUnlocked) || weeks[0];
  const readiness = state.weekReadiness[currentWeek?.week];

  // Calculate overall progress
  const completedWeeks = weeks.filter(w => store.isWeekCompleted(w.week)).length;
  const overallPct = Math.round((completedWeeks / weeks.length) * 100);

  // Calculate current week progress
  let weekLessonCount = 0;
  let weekCompletedCount = 0;
  if (currentWeek) {
    const allIds = [...(currentWeek.grammarTopics || []), ...(currentWeek.exercisesNew || []), ...(currentWeek.readings || [])];
    weekLessonCount = allIds.length;
    weekCompletedCount = allIds.filter(id => {
      const lp = store.getLessonProgress(id);
      return lp && lp.status === 'completed';
    }).length;
  }
  const weekPct = weekLessonCount ? Math.round((weekCompletedCount / weekLessonCount) * 100) : 0;

  // Get weak areas
  const weakAreas = store.getWeakAreas();

  container.innerHTML = `
    <div class="dashboard">
      <h1>🇷🇴 Română B1 — Dashboard</h1>

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">🔥 ${streak.current}</div>
          <div class="stat-label">Day Streak / Zi</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${completedWeeks}/${weeks.length}</div>
          <div class="stat-label">Weeks Done / Săptămâni</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Object.keys(state.lessonProgress).length}</div>
          <div class="stat-label">Lessons Done / Lecții</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${weakAreas.length}</div>
          <div class="stat-label">Weak Areas / Zone Slabe</div>
        </div>
      </div>

      <!-- Overall progress -->
      <div class="dashboard-section" id="overall-progress"></div>

      <!-- Current week -->
      <div class="dashboard-section">
        <h2>Săptămâna Curentă / Current Week: ${currentWeek ? currentWeek.week : '?'}</h2>
        ${currentWeek ? `
          <div class="current-week-card">
            <h3>${currentWeek.title} <small>/ ${currentWeek.titleEn}</small></h3>
            <p>${currentWeek.description}</p>
            <div id="week-progress"></div>
            <div class="week-content-links">
              ${currentWeek.grammarTopics.map(gId => `
                <a href="#/lesson/${gId}" class="content-link grammar-link">📖 ${gId.split('-').slice(1).join(' ')}</a>
              `).join('')}
              ${currentWeek.exercisesNew.map(eId => `
                <a href="#/exercise/${eId}/new" class="content-link exercise-link">✏️ ${eId.split('-').slice(1).join(' ')}</a>
              `).join('')}
              ${currentWeek.exercisesReview.map(eId => `
                <a href="#/exercise/${eId}/review" class="content-link review-link">🔄 Review: ${eId.split('-').slice(1).join(' ')}</a>
              `).join('')}
              ${currentWeek.readings.map(rId => `
                <a href="#/reading/${rId}" class="content-link reading-link">📚 ${rId.split('-').slice(1).join(' ')}</a>
              `).join('')}
              <a href="#/vocabulary/${currentWeek.vocabularyThemes[0]}" class="content-link vocab-link">📝 Vocabular: ${currentWeek.vocabularyThemes[0].split('-').slice(1).join(' ')}</a>
            </div>
          </div>
        ` : '<p>No curriculum loaded.</p>'}
      </div>

      <!-- Week readiness check -->
      <div class="dashboard-section" id="readiness-section">
        ${renderReadinessSection(currentWeek, readiness, weekPct, weakAreas)}
      </div>

      <!-- Weak areas -->
      ${weakAreas.length > 0 ? `
        <div class="dashboard-section">
          <h2>Zone Slabe / Weak Areas</h2>
          <p class="hint">These topics need more practice. Click to review.</p>
          <div class="weak-areas">
            ${weakAreas.map(area => `
              <a href="#/lesson/${area}" class="weak-area-tag">${area.replace('G', '').replace('-', ' ')}</a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Quick actions -->
      <div class="dashboard-section">
        <h2>Acțiuni Rapide / Quick Actions</h2>
        <div class="quick-actions">
          <a href="#/flashcards" class="action-btn">🃏 Flashcards</a>
          <a href="#/writing" class="action-btn">✍️ Writing Practice</a>
          <a href="#/progress" class="action-btn">📊 Full Progress</a>
          <a href="#/vocabulary" class="action-btn">📝 Vocabulary</a>
        </div>
      </div>
    </div>
  `;

  // Render progress bars
  const overallEl = document.getElementById('overall-progress');
  if (overallEl) {
    renderProgressBar(overallEl, overallPct, 'Overall Progress / Progres General', 'overall');
  }

  const weekEl = document.getElementById('week-progress');
  if (weekEl) {
    renderProgressBar(weekEl, weekPct, `Week ${currentWeek.week} Progress / Progres`, 'week');
  }

  // Attach readiness button handlers
  attachReadinessHandlers(currentWeek);
}

function renderReadinessSection(currentWeek, readiness, weekPct, weakAreas) {
  if (!currentWeek) return '';

  if (readiness && readiness.ready === true) {
    return `
      <div class="readiness-card ready">
        <h3>✅ Week ${currentWeek.week} Completed! / Săptămâna ${currentWeek.week} Terminată!</h3>
        <p>Average score: ${readiness.avgScore}%</p>
        <p>Week ${currentWeek.week + 1} is now unlocked.</p>
      </div>
    `;
  }

  if (readiness && readiness.ready === false) {
    return `
      <div class="readiness-card needs-practice">
        <h3>💪 More Practice Needed / Mai Nevoie de Exerciții</h3>
        <p>Your score: ${readiness.avgScore}%</p>
        ${readiness.weakTopics && readiness.weakTopics.length > 0 ? `
          <p>Focus on these topics:</p>
          <ul>
            ${readiness.weakTopics.map(t => `<li><a href="#/lesson/${t}">${t.replace('G', '').replace('-', ' ')}</a></li>`).join('')}
          </ul>
        ` : ''}
        <button class="btn btn-primary" id="btn-mark-ready">✅ I'm Ready Now / Sunt Gata Acum</button>
        <button class="btn btn-secondary" onclick="document.querySelector('.content-link.review-link')?.click()">🔄 Practice More</button>
      </div>
    `;
  }

  // Not yet evaluated
  if (weekPct < 100) {
    return `
      <div class="readiness-card">
        <h3>📋 Week Progress / Progresul Săptămânii</h3>
        <p>Complete all lessons and exercises for Week ${currentWeek.week} to unlock the readiness check.</p>
        <p>Progress: ${weekPct}%</p>
      </div>
    `;
  }

  // All done, show readiness check
  return `
    <div class="readiness-card">
      <h3>🎯 Ready to Advance? / Ești Gata să Treci Mai Departe?</h3>
      <p>You've completed all content for Week ${currentWeek.week}. How do you feel about it?</p>
      <div class="readiness-actions">
        <button class="btn btn-primary" id="btn-ready-yes">✅ Yes, I'm ready! / Da, sunt gata!</button>
        <button class="btn btn-warning" id="btn-ready-no">🔄 I need more practice / Mai am nevoie de exerciții</button>
      </div>
    </div>
  `;
}

function attachReadinessHandlers(currentWeek) {
  if (!currentWeek) return;

  const btnYes = document.getElementById('btn-ready-yes');
  const btnNo = document.getElementById('btn-ready-no');
  const btnMarkReady = document.getElementById('btn-mark-ready');

  if (btnYes) {
    btnYes.addEventListener('click', () => {
      store.confirmWeekReady(currentWeek.week);
      renderDashboard(window._curriculum);
    });
  }

  if (btnNo) {
    btnNo.addEventListener('click', () => {
      // Determine weak topics from low scores
      const weakTopics = [];
      const state = store.getState();
      (currentWeek.grammarTopics || []).forEach(gId => {
        const lp = store.getLessonProgress(gId);
        if (lp && lp.score !== null && lp.score < 70) {
          weakTopics.push(gId);
        }
      });
      (currentWeek.exercisesNew || []).forEach(eId => {
        const score = store.getExerciseScore(eId, 'new');
        if (score && score.lastScore < 70) {
          weakTopics.push(eId);
        }
      });

      store.markWeekNeedsPractice(currentWeek.week, weakTopics);
      renderDashboard(window._curriculum);
    });
  }

  if (btnMarkReady) {
    btnMarkReady.addEventListener('click', () => {
      store.confirmWeekReady(currentWeek.week);
      renderDashboard(window._curriculum);
    });
  }
}
