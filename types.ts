export interface User {
  username: string;
  fullName: string;
  role: 'Administrator' | 'Candidate';
  lastLogin: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export enum LoginStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

export interface PreExtractionAudit {
  total_questions: number;
  content_complexity: 'HIGH' | 'LOW';
  ocr_quality: 'CLEAN' | 'POOR';
  recommended_model: 'GEMINI_PRO' | 'GEMINI_FLASH';
  // Optional legacy fields to maintain UI compatibility if AI provides them
  topics_detected?: string[]; 
  content_structure?: {
    with_solutions: number;
    key_only: number;
  };
}

export interface ExtractedData {
  audit?: PreExtractionAudit;
  summary: {
    totalQuestions: number;
    topics: string[];
    difficultyDistribution?: {
      Easy: number;
      Medium: number;
      Hard: number;
    };
  };
  questions: Question[];
}

export type TestMode = 'PRACTICE' | 'EXAM';

export interface TestConfig {
  testName: string;
  questionCount: number;
  durationMinutes: number; // 0 for no limit
  difficulties: ('Easy' | 'Medium' | 'Hard')[];
  mode: TestMode;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  negativeMarking: boolean;
}

export type QuestionStatus = 'CORRECT' | 'WRONG' | 'UNANSWERED' | 'MARKED' | 'SKIPPED';

export interface TestProgress {
  answers: Record<number, string>;
  statuses: Record<number, QuestionStatus>;
  markedQuestions: number[]; // Array for JSON serialization (Set not supported)
  elapsedSeconds: number;
  currentQIndex: number;
  lastUpdated: string;
}

export interface TestSession {
  id?: string; // Unique session ID
  config: TestConfig;
  questions: Question[];
  startTime: string;
  progress?: TestProgress; // For resuming
}

export interface UserAnswer {
  questionId: number;
  questionText: string;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  explanation: string;
  difficulty: string;
  topic: string;
  options: string[];
}

export interface TopicAnalysis {
  topic: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unattempted: number;
  accuracy: number; // percentage
  timeSpent: number; // seconds
}

export interface TestResult {
  id: string;
  testName: string;
  date: string;
  mode: TestMode;
  totalScore: number;
  maxScore: number;
  percentage: number;
  totalTimeSeconds: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  answers: UserAnswer[];
  topicAnalysis: TopicAnalysis[];
  status: 'PASS' | 'FAIL';
}

// --- PDF Library Types ---
export interface SavedPDF {
  id: string;
  fileName: string;
  uploadDate: string;
  data: ExtractedData;
}

// --- Gamification Types ---

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name reference
  tier: BadgeTier;
  condition: (history: TestResult[], progress: UserProgress) => boolean;
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  currentStreak: number;
  lastLoginDate: string;
  testsCompleted: number;
  perfectScores: number;
  badges: UnlockedBadge[];
}

// --- Settings Types ---

export interface AppSettings {
  testPreferences: {
    defaultDuration: number;
    defaultQuestionCount: number;
    preferredDifficulty: ('Easy' | 'Medium' | 'Hard')[];
    autoSubmit: boolean;
  };
  interface: {
    theme: 'light' | 'dark';
    fontSize: 'small' | 'medium' | 'large';
    language: 'en' | 'te' | 'hi';
    soundEffects: boolean;
  };
  notifications: {
    dailyReminder: boolean;
    achievementAlerts: boolean;
    studyStreakAlerts: boolean;
    emailNotifications: boolean;
  };
}

// --- AI & Revision Types ---

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  explanation: string;
  topic: string;
  lastReviewed?: string;
  strength: number; // 0-5 scale
}