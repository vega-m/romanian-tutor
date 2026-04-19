// components/header.js

import { store } from '../store.js';

export function renderHeader(curriculum, activeRoute) {
  const header = document.getElementById('app-header');
  if (!header) return;

  const streak = store.getStreak();

  header.innerHTML = `
    <header class="main-header">
      <div class="header-left">
        <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">☰</button>
        <a href="#/" class="logo">🇷🇴 Română B1</a>
      </div>
      <nav class="header-nav">
        <a href="#/" class="nav-link" data-route="/">Dashboard</a>
        <a href="#/flashcards" class="nav-link" data-route="/flashcards">Flashcards</a>
        <a href="#/writing" class="nav-link" data-route="/writing">Writing</a>
        <a href="#/progress" class="nav-link" data-route="/progress">Progress</a>
        <a href="#/settings" class="nav-link" data-route="/settings">Settings</a>
      </nav>
      <div class="header-right">
        <div class="streak-badge" title="Current study streak">
          🔥 ${streak.current}
        </div>
      </div>
    </header>
  `;

  // Mobile menu toggle
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('app-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}
