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

export interface ExtractedData {
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

export interface TestSession {
  config: TestConfig;
  questions: Question[];
  startTime: string;
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
  testName: string;
  date: string;
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