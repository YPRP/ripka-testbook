import { TestResult, UserProgress, AppSettings, SavedPDF, TestSession } from '../types';

const STORAGE_KEY_HISTORY = 'ripka_v2_test_history';
const STORAGE_KEY_PROGRESS = 'ripka_v2_user_progress';
const STORAGE_KEY_SETTINGS = 'ripka_v2_settings';
const STORAGE_KEY_PDF_LIBRARY = 'ripka_v2_pdf_library';
const STORAGE_KEY_ACTIVE_SESSION = 'ripka_v2_active_session';

// --- Test History ---

export const saveTestResult = (result: TestResult): void => {
  try {
    const existing = getTestResults();
    const updated = [result, ...existing];
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save test result', error);
  }
};

export const getTestResults = (): TestResult[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to retrieve test results', error);
    return [];
  }
};

export const deleteTestResult = (id: string): void => {
  try {
    const existing = getTestResults();
    const updated = existing.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete test result', error);
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY_HISTORY);
  localStorage.removeItem(STORAGE_KEY_PROGRESS);
  localStorage.removeItem(STORAGE_KEY_PDF_LIBRARY);
  localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
};

export const exportHistoryToCSV = (results: TestResult[]): string => {
  const headers = ['Date', 'Test Name', 'Mode', 'Score', 'Max Score', 'Percentage', 'Status', 'Time (s)'];
  const rows = results.map(r => [
    new Date(r.date).toLocaleDateString(),
    `"${r.testName.replace(/"/g, '""')}"`, // Escape quotes
    r.mode,
    r.totalScore,
    r.maxScore,
    `${r.percentage.toFixed(2)}%`,
    r.status,
    r.totalTimeSeconds
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

// --- User Progress ---

const DEFAULT_PROGRESS: UserProgress = {
  totalXp: 0,
  level: 1,
  currentStreak: 1,
  lastLoginDate: new Date().toISOString(),
  testsCompleted: 0,
  perfectScores: 0,
  badges: []
};

export const getUserProgress = (): UserProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!stored) return DEFAULT_PROGRESS;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get user progress', error);
    return DEFAULT_PROGRESS;
  }
};

export const saveUserProgress = (progress: UserProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save user progress', error);
  }
};

// --- App Settings ---

const DEFAULT_SETTINGS: AppSettings = {
  testPreferences: {
    defaultDuration: 60,
    defaultQuestionCount: 20,
    preferredDifficulty: ['Easy', 'Medium', 'Hard'],
    autoSubmit: true
  },
  interface: {
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
    soundEffects: true
  },
  notifications: {
    dailyReminder: true,
    achievementAlerts: true,
    studyStreakAlerts: true,
    emailNotifications: false
  }
};

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }; // Merge to ensure new keys exist
  } catch (error) {
    console.error('Failed to get settings', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings', error);
  }
};

// --- PDF Library ---

export const savePDFToLibrary = (pdf: SavedPDF): void => {
  try {
    const existing = getPDFLibrary();
    // Check for duplicate file names to update instead of add
    const filtered = existing.filter(p => p.fileName !== pdf.fileName);
    const updated = [pdf, ...filtered];
    
    // Limit to last 10 PDFs to save space
    if (updated.length > 10) updated.pop();
    
    localStorage.setItem(STORAGE_KEY_PDF_LIBRARY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save PDF to library (Quota exceeded?)', error);
    alert("Failed to save PDF to library. Storage might be full.");
  }
};

export const getPDFLibrary = (): SavedPDF[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PDF_LIBRARY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get PDF library', error);
    return [];
  }
};

export const deletePDFFromLibrary = (id: string): void => {
  try {
    const existing = getPDFLibrary();
    const updated = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PDF_LIBRARY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete PDF from library', error);
  }
};

// --- Active Session (Pause/Resume) ---

export const saveActiveSession = (session: TestSession): void => {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save active session', error);
  }
};

export const getActiveSession = (): TestSession | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get active session', error);
    return null;
  }
};

export const clearActiveSession = (): void => {
  localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
};