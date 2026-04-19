// router.js — Hash-based SPA router

export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.container = null;
    this.onNavigate = null; // callback after navigation
    window.addEventListener('hashchange', () => this.resolve());
  }

  init(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.resolve();
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.location.hash = path;
  }

  getHash() {
    return window.location.hash.slice(1) || '/';
  }

  getParams() {
    const hash = this.getHash();
    const parts = hash.split('/').filter(Boolean);
    return { route: parts[0] || '', params: parts.slice(1) };
  }

  resolve() {
    const { route, params } = this.getParams();

    // Try exact match first, then wildcard
    let handler = this.routes[`/${route}`] || this.routes['/'];

    if (handler) {
      this.currentRoute = `/${route}`;
      handler(params, route);
      if (this.onNavigate) this.onNavigate(`/${route}`, params);
    } else {
      // 404 — redirect to dashboard
      this.container.innerHTML = '<div class="error"><h2>Pagina nu a fost găsită</h2><p>The page was not found.</p></div>';
    }

    // Scroll to top on navigation
    window.scrollTo(0, 0);
  }
}

export const router = new Router();
