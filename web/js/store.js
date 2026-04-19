// store.js — localStorage wrapper with week gating logic

const STORAGE_KEY = 'romanian_tutor';

const DEFAULT_STATE = {
  currentWeek: 1,
  weekUnlocked: 1,
  weekReadiness: {},
  exerciseScores: { new: {}, review: {} },
  lessonProgress: {},
  flashcards: {},
  weakAreas: [],
  streak: { current: 0, longest: 0, lastDate: null },
  settings: {
    newCardsPerDay: 10,
    reviewCardsPerDay: 30,
    studyLanguage: 'bilingual'
  }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const saved = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...saved };
  } catch (e) {
    console.error('Failed to load state:', e);
    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// Singleton state
let _state = loadState();

export const store = {
  getState() {
    return _state;
  },

  // Week gating
  isWeekUnlocked(week) {
    return true; // All weeks accessible without gating
  },

  isWeekCompleted(week) {
    const r = _state.weekReadiness[week];
    return r && r.ready === true;
  },

  isWeekActive(week) {
    return week === _state.weekUnlocked && !this.isWeekCompleted(week);
  },

  getWeekStatus(week) {
    if (this.isWeekCompleted(week)) return 'completed';
    if (this.isWeekActive(week)) return 'active';
    if (this.isWeekUnlocked(week)) return 'unlocked';
    return 'locked';
  },

  getWeakAreas() {
    return _state.weakAreas;
  },

  addWeakArea(areaId) {
    if (!_state.weakAreas.includes(areaId)) {
      _state.weakAreas.push(areaId);
      saveState(_state);
    }
  },

  removeWeakArea(areaId) {
    _state.weakAreas = _state.weakAreas.filter(id => id !== areaId);
    saveState(_state);
  },

  // Lesson progress
  setLessonProgress(lessonId, status, score) {
    _state.lessonProgress[lessonId] = {
      status,
      score,
      completedAt: score !== null ? new Date().toISOString() : null
    };
    saveState(_state);
  },

  getLessonProgress(lessonId) {
    return _state.lessonProgress[lessonId] || null;
  },

  // Exercise scores
  recordExerciseScore(exerciseId, mode, score, problemExercises) {
    const modeScores = _state.exerciseScores[mode];
    const prev = modeScores[exerciseId] || { bestScore: 0, lastScore: 0, attempts: 0, problemExercises: [] };
    modeScores[exerciseId] = {
      bestScore: Math.max(prev.bestScore, score),
      lastScore: score,
      attempts: prev.attempts + 1,
      problemExercises: problemExercises || prev.problemExercises,
      lastAttemptDate: new Date().toISOString().split('T')[0]
    };
    saveState(_state);
  },

  getExerciseScore(exerciseId, mode) {
    const modeScores = _state.exerciseScores[mode];
    return modeScores[exerciseId] || null;
  },

  // Week readiness
  confirmWeekReady(week) {
    _state.weekReadiness[week] = {
      ready: true,
      confirmedAt: new Date().toISOString(),
      avgScore: this.getWeekAvgScore(week)
    };
    // Unlock next week
    if (week >= _state.weekUnlocked) {
      _state.weekUnlocked = week + 1;
    }
    saveState(_state);
  },

  markWeekNeedsPractice(week, weakTopics) {
    _state.weekReadiness[week] = {
      ready: false,
      avgScore: this.getWeekAvgScore(week),
      weakTopics: weakTopics || []
    };
    saveState(_state);
  },

  getWeekAvgScore(week) {
    // Calculate average from exercise scores for this week
    // Will be populated when curriculum is loaded
    const scores = [];
    const lp = _state.lessonProgress;
    Object.values(lp).forEach(p => {
      if (p.score !== null) scores.push(p.score);
    });
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  },

  // Streak
  updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const last = _state.streak.lastDate;

    if (last === today) return; // Already studied today

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (last === yesterday) {
      _state.streak.current += 1;
    } else if (last !== today) {
      _state.streak.current = 1; // Reset streak
    }

    _state.streak.lastDate = today;
    _state.streak.longest = Math.max(_state.streak.longest, _state.streak.current);
    saveState(_state);
  },

  getStreak() {
    return _state.streak;
  },

  // Flashcard SM-2 data
  getFlashcardData(wordId) {
    return _state.flashcards[wordId] || null;
  },

  updateFlashcard(wordId, sm2Result) {
    _state.flashcards[wordId] = sm2Result;
    saveState(_state);
  },

  // Export / Import
  exportData() {
    return JSON.stringify(_state, null, 2);
  },

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      _state = { ...DEFAULT_STATE, ...data };
      saveState(_state);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  resetData() {
    _state = { ...DEFAULT_STATE };
    saveState(_state);
  }
};
