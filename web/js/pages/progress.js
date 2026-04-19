// pages/progress.js — Detailed progress dashboard

import { store } from '../store.js';

export async function renderProgress(curriculum) {
  const container = document.getElementById('app-content');
  if (!container) return;

  const state = store.getState();
  const streak = store.getStreak();
  const weeks = curriculum?.weeks || [];
  const completedWeeks = weeks.filter(w => store.isWeekCompleted(w.week));
  const totalLessons = Object.keys(state.lessonProgress).length;
  const completedLessons = Object.values(state.lessonProgress).filter(p => p.status === 'completed').length;

  container.innerHTML = `
    <div class="progress-page">
      <div class="progress-header">
        <a href="#/" class="back-link">← Dashboard</a>
        <h1>📊 Progress / Progres</h1>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">${completedWeeks.length}/${weeks.length}</div>
          <div class="stat-label">Weeks / Săptămâni</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${completedLessons}/${totalLessons}</div>
          <div class="stat-label">Lessons / Lecții</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">🔥 ${streak.current}</div>
          <div class="stat-label">Current Streak / Serie</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">🏆 ${streak.longest}</div>
          <div class="stat-label">Longest Streak / Record</div>
        </div>
      </div>

      <div class="progress-section">
        <h2>Week Details / Detalii pe Săptămâni</h2>
        <div class="week-progress-list">
          ${weeks.map(w => {
            const status = store.getWeekStatus(w.week);
            const readiness = state.weekReadiness[w.week];
            return `
              <div class="week-progress-item ${status}">
                <div class="week-status-icon">${status === 'completed' ? '✅' : status === 'active' ? '▶️' : status === 'locked' ? '🔒' : '⬜'}</div>
                <div class="week-info">
                  <strong>Week ${w.week}: ${w.title}</strong>
                  <span class="week-status-text">${status}</span>
                  ${readiness?.avgScore ? `<span class="week-score">Score: ${readiness.avgScore}%</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="progress-section">
        <h2>Exercise Scores / Scoruri la Exerciții</h2>
        <div class="exercise-scores">
          ${Object.entries(state.exerciseScores.new).length === 0
            ? '<p class="empty">No exercises completed yet.</p>'
            : Object.entries(state.exerciseScores.new).map(([id, data]) => `
              <div class="score-item ${data.bestScore >= 70 ? 'pass' : 'fail'}">
                <span class="score-id">${id.replace(/E\d+-/, '')}</span>
                <span class="score-best">Best: ${data.bestScore}%</span>
                <span class="score-last">Last: ${data.lastScore}%</span>
                <span class="score-attempts">×${data.attempts}</span>
              </div>
            `).join('')
          }
        </div>
      </div>

      ${state.weakAreas.length > 0 ? `
        <div class="progress-section">
          <h2>⚠️ Weak Areas / Zone Slabe</h2>
          <div class="weak-areas-list">
            ${state.weakAreas.map(area => `
              <a href="#/lesson/${area}" class="weak-area-link">${area.replace(/G\d+-/, '')}</a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="progress-section">
        <h2>Flashcard Stats</h2>
        <p>Total words in system: <strong>${Object.keys(state.flashcards).length}</strong></p>
        <p>Due for review today: <strong>${Object.values(state.flashcards).filter(f => f.nextReview <= new Date().toISOString().split('T')[0]).length}</strong></p>
      </div>
    </div>
  `;
}
