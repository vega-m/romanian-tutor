// app.js — Main application initialization and orchestration

import { router } from './router.js';
import { contentLoader } from './content-loader.js';
import { store } from './store.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderLesson } from './pages/lesson.js';
import { renderExercise } from './pages/exercise.js';
import { renderReading } from './pages/reading.js';
import { renderFlashcards } from './pages/flashcards.js';
import { renderWriting } from './pages/writing.js';
import { renderVocabulary } from './pages/vocabulary.js';
import { renderProgress } from './pages/progress.js';
import { renderSettings } from './pages/settings.js';
import { renderHeader } from './components/header.js';
import { renderSidebar } from './components/sidebar.js';

let curriculum = null;

export async function initApp() {
  // Load curriculum
  curriculum = await contentLoader.getCurriculum();

  // Register routes
  router.register('/', (params) => renderDashboard(curriculum));
  router.register('/lesson', (params) => renderLesson(params[0], curriculum));
  router.register('/exercise', (params) => renderExercise(params[0], params[1], curriculum)); // exerciseId, mode
  router.register('/reading', (params) => renderReading(params[0], curriculum));
  router.register('/flashcards', (params) => renderFlashcards(curriculum));
  router.register('/writing', (params) => renderWriting(curriculum));
  router.register('/vocabulary', (params) => renderVocabulary(params[0], curriculum));
  router.register('/progress', (params) => renderProgress(curriculum));
  router.register('/settings', (params) => renderSettings());

  // Navigation callback — update active states
  router.onNavigate = (route, params) => {
    renderHeader(curriculum, route);
    renderSidebar(curriculum, route);
    updateActiveNavLink(route);
  };

  // Initialize layout
  renderHeader(curriculum, '/');
  renderSidebar(curriculum, '/');

  // Start router
  router.init('#app-content');

  // Update streak
  store.updateStreak();
}

function updateActiveNavLink(route) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${route}` || (route === '/' && href === '#/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Boot
document.addEventListener('DOMContentLoaded', initApp);
