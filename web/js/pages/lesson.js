// pages/lesson.js — Grammar lesson viewer

import { contentLoader } from '../content-loader.js';
import { store } from '../store.js';
import { renderProgressBar } from '../components/progress-bar.js';

export async function renderLesson(lessonId, curriculum) {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!lessonId) {
    container.innerHTML = '<p>Select a lesson from the sidebar.</p>';
    return;
  }

  container.innerHTML = '<div class="loading">Loading lesson...</div>';

  const lesson = await contentLoader.getGrammarLesson(lessonId);
  if (!lesson) {
    container.innerHTML = `<div class="error"><h2>Lesson not found</h2><p>${lessonId}</p></div>`;
    return;
  }

  const progress = store.getLessonProgress(lessonId);

  container.innerHTML = `
    <div class="lesson">
      <div class="lesson-header">
        <a href="#/" class="back-link">← Dashboard</a>
        <h1>${lesson.title} <small>/ ${lesson.titleEn}</small></h1>
        <span class="cefr-badge">${lesson.cefrLevel}</span>
        <span class="lesson-time">⏱ ${lesson.estimatedMinutes} min</span>
      </div>

      <!-- Introduction (bilingual) -->
      <div class="lesson-section introduction">
        <p class="intro-en">${lesson.introduction}</p>
        ${lesson.introductionRo ? `<p class="intro-ro">${lesson.introductionRo}</p>` : ''}
      </div>

      <!-- Lesson sections -->
      ${lesson.sections.map((section, i) => renderSection(section, i)).join('')}

      <!-- Summary -->
      <div class="lesson-section summary">
        <h2>Rezumat / Summary</h2>
        <ul class="summary-list">
          ${(lesson.summaryPoints || []).map(p => `<li>${p}</li>`).join('')}
        </ul>
        ${lesson.summaryPointsRo ? `
          <h3>Rezumat în Română</h3>
          <ul class="summary-list">
            ${lesson.summaryPointsRo.map(p => `<li>${p}</li>`).join('')}
          </ul>
        ` : ''}
      </div>

      <!-- Actions -->
      <div class="lesson-actions">
        ${lesson.relatedExercises && lesson.relatedExercises.length > 0 ? `
          <h3>Practice / Exerciții</h3>
          <div class="action-buttons">
            ${lesson.relatedExercises.map(eId => `
              <a href="#/exercise/${eId}/new" class="btn btn-primary">✏️ ${eId.replace('E', '').replace(/-/g, ' ')}</a>
            `).join('')}
          </div>
        ` : ''}
        <button class="btn btn-success" id="btn-complete-lesson">
          ${progress && progress.status === 'completed' ? '✅ Completed / Terminat' : '✅ Mark as Complete / Marchează ca Terminat'}
        </button>
      </div>
    </div>
  `;

  // Complete button
  const btnComplete = document.getElementById('btn-complete-lesson');
  if (btnComplete) {
    btnComplete.addEventListener('click', () => {
      store.setLessonProgress(lessonId, 'completed', 100);
      btnComplete.textContent = '✅ Completed / Terminat';
      btnComplete.disabled = true;
    });
  }
}

function renderSection(section, index) {
  let html = `<div class="lesson-section section-${section.type}">`;

  if (section.heading) {
    html += `<h2>${section.heading}</h2>`;
  }

  switch (section.type) {
    case 'explanation':
      if (section.content) html += `<p class="section-content">${section.content}</p>`;
      if (section.contentRo) html += `<p class="section-content-ro">${section.contentRo}</p>`;
      if (section.table) html += renderTable(section.table);
      if (section.rules) html += `<ul class="rules-list">${section.rules.map(r => `<li>${r}</li>`).join('')}</ul>`;
      if (section.examples) html += renderExamples(section.examples);
      break;

    case 'tip':
      html += `<div class="tip-box">
        <strong>💡 Tip${section.heading ? ': ' + section.heading : ''}</strong>
        <p>${section.content}</p>
        ${section.contentRo ? `<p class="tip-ro">${section.contentRo}</p>` : ''}
      </div>`;
      break;

    case 'practice-point':
      html += `<div class="practice-box">
        <strong>⚠️ Practice Point${section.heading ? ': ' + section.heading : ''}</strong>
        <p>${section.content}</p>
        ${section.contentRo ? `<p class="practice-ro">${section.contentRo}</p>` : ''}
        ${section.rules ? `<ul>${section.rules.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
        ${section.examples ? renderExamples(section.examples) : ''}
      </div>`;
      break;

    default:
      if (section.content) html += `<p>${section.content}</p>`;
      if (section.contentRo) html += `<p class="section-content-ro">${section.contentRo}</p>`;
  }

  html += '</div>';
  return html;
}

function renderTable(table) {
  let html = '<div class="table-wrapper"><table>';
  html += '<thead><tr>' + table.headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
  html += '<tbody>' + table.rows.map(row =>
    '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>'
  ).join('') + '</tbody>';
  html += '</table></div>';
  return html;
}

function renderExamples(examples) {
  return '<div class="examples">' + examples.map(ex => `
    <div class="example">
      <div class="example-ro">${ex.ro}</div>
      ${ex.en ? `<div class="example-en">${ex.en}</div>` : ''}
      ${ex.notes ? `<div class="example-notes">📝 ${ex.notes}</div>` : ''}
    </div>
  `).join('') + '</div>';
}
