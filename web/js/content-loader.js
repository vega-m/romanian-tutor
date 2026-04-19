// content-loader.js — Fetch and cache JSON content files

export class ContentLoader {
  constructor(basePath = 'content') {
    this.basePath = basePath;
    this.cache = new Map();
  }

  async loadJSON(path) {
    if (this.cache.has(path)) return this.cache.get(path);

    try {
      const bust = Date.now();
      const response = await fetch(`${this.basePath}/${path}?v=${bust}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
      const data = await response.json();
      this.cache.set(path, data);
      return data;
    } catch (e) {
      console.error(`Failed to load ${path}:`, e);
      return null;
    }
  }

  async loadText(path) {
    try {
      const response = await fetch(`${this.basePath}/${path}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
      return await response.text();
    } catch (e) {
      console.error(`Failed to load ${path}:`, e);
      return null;
    }
  }

  // Convenience methods
  async getCurriculum() {
    return this.loadJSON('curriculum.json');
  }

  async getGrammarLesson(lessonId) {
    return this.loadJSON(`grammar/${lessonId}.json`);
  }

  async getVocabularyTheme(themeId) {
    return this.loadJSON(`vocabulary/${themeId}.json`);
  }

  async getExerciseSet(exerciseId, mode = 'new') {
    return this.loadJSON(`exercises/${mode}/${exerciseId}.json`);
  }

  async getReadingSet(readingId) {
    return this.loadJSON(`reading/${readingId}.json`);
  }

  async getWritingPrompts() {
    return this.loadJSON('data/writing-prompts.json');
  }

  clearCache() {
    this.cache.clear();
  }
}

// Singleton
export const contentLoader = new ContentLoader();
