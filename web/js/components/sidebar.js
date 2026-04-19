// components/sidebar.js

import { store } from '../store.js';

export function renderSidebar(curriculum, activeRoute) {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar || !curriculum) return;

  const weeks = curriculum.weeks || [];
  let weeksHtml = weeks.map(week => {
    const status = store.getWeekStatus(week.week);
    const statusClass = status;
    const statusIcon = status === 'completed' ? '✓' : status === 'active' ? '▶' : status === 'locked' ? '🔒' : '○';
    const isActive = activeRoute === '/lesson' || activeRoute.startsWith('/lesson/');
    const weekLink = status !== 'locked'
      ? `#/vocabulary/${week.vocabularyThemes[0]}`
      : '#';

    return `
      <div class="sidebar-week ${statusClass}" data-week="${week.week}">
        <div class="sidebar-week-header" onclick="document.querySelector('.sidebar-week[data-week=\\'${week.week}\\'] .sidebar-week-topics').classList.toggle('open')">
          <span class="week-icon">${statusIcon}</span>
          <span class="week-label">Săpt. ${week.week}</span>
          <span class="week-title">${week.title}</span>
        </div>
        <div class="sidebar-week-topics ${status !== 'locked' ? 'open' : ''}">
          ${week.grammarTopics.map(gId => {
            const lp = store.getLessonProgress(gId);
            const done = lp && lp.status === 'completed';
            return `<a href="#/lesson/${gId}" class="sidebar-topic ${done ? 'completed' : ''} ${status === 'locked' ? 'disabled' : ''}">
              <span>${done ? '✓' : '○'}</span> ${gId.replace('G', '').replace('-', ' ')}
            </a>`;
          }).join('')}
          ${week.exercisesNew.map(eId => {
            const lp = store.getLessonProgress(eId);
            const done = lp && lp.status === 'completed';
            return `<a href="#/exercise/${eId}/new" class="sidebar-topic ${done ? 'completed' : ''} ${status === 'locked' ? 'disabled' : ''}">
              <span>${done ? '✓' : '✏'}</span> ${eId.replace('E', '').replace('-', ' ')}
            </a>`;
          }).join('')}
          ${week.readings.map(rId => `
            <a href="#/reading/${rId}" class="sidebar-topic ${status === 'locked' ? 'disabled' : ''}">
              <span>📖</span> ${rId.replace('R', '').replace('-', ' ')}
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  sidebar.innerHTML = `
    <div class="sidebar-content">
      <div class="sidebar-section">
        <h3 class="sidebar-title">Săptămâni / Weeks</h3>
        ${weeksHtml}
      </div>
    </div>
  `;
}
