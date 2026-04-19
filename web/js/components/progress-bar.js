// components/progress-bar.js

export function renderProgressBar(container, percentage, label = '', colorClass = '') {
  const clamped = Math.max(0, Math.min(100, percentage));
  const bar = document.createElement('div');
  bar.className = `progress-bar ${colorClass}`;
  bar.innerHTML = `
    ${label ? `<div class="progress-label">${label} <span class="progress-pct">${clamped}%</span></div>` : ''}
    <div class="progress-track">
      <div class="progress-fill" style="width: ${clamped}%"></div>
    </div>
  `;
  container.appendChild(bar);
  return bar;
}

export function renderMiniProgress(percentage) {
  const clamped = Math.max(0, Math.min(100, percentage));
  return `<div class="mini-progress" title="${clamped}%"><div class="mini-fill" style="width:${clamped}%"></div></div>`;
}
