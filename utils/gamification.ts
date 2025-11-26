import { TestResult, UserProgress, Badge, BadgeTier } from '../types';

export const XP_PER_TEST = 100;
export const XP_PER_PERFECT_SCORE = 50;
export const XP_PER_DAILY_LOGIN = 10;
export const XP_PER_STREAK = 25;

// Level calculation: Level N requires N * 500 cumulative XP (simplified)
// Or use a formula: Level = Math.floor(Math.sqrt(XP / 100))
export const calculateLevel = (xp: number): { level: number; progress: number; nextLevelXp: number } => {
  const baseXp = 500;
  const level = Math.floor(xp / baseXp) + 1;
  const currentLevelBaseXp = (level - 1) * baseXp;
  const nextLevelBaseXp = level * baseXp;
  const progress = ((xp - currentLevelBaseXp) / baseXp) * 100;
  
  return {
    level,
    progress,
    nextLevelXp: nextLevelBaseXp
  };
};

export const AVAILABLE_BADGES: Badge[] = [
  // --- BRONZE ---
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your first test',
    icon: 'Flag',
    tier: 'BRONZE',
    condition: (history) => history.length >= 1
  },
  {
    id: 'warming_up',
    name: 'Warming Up',
    description: 'Complete 5 tests',
    icon: 'Flame',
    tier: 'BRONZE',
    condition: (history) => history.length >= 5
  },
  {
    id: 'perfect_start',
    name: 'Perfectionist',
    description: 'Achieve your first 100% score',
    icon: 'Star',
    tier: 'BRONZE',
    condition: (history) => history.some(r => r.percentage === 100)
  },

  // --- SILVER ---
  {
    id: 'dedicated',
    name: 'Dedicated Student',
    description: 'Complete 10 tests',
    icon: 'BookOpen',
    tier: 'SILVER',
    condition: (history) => history.length >= 10
  },
  {
    id: 'sharp_shooter',
    name: 'Sharp Shooter',
    description: 'Maintain >80% average accuracy (min 5 tests)',
    icon: 'Target',
    tier: 'SILVER',
    condition: (history) => {
      if (history.length < 5) return false;
      const avg = history.reduce((sum, r) => sum + r.percentage, 0) / history.length;
      return avg >= 80;
    }
  },
  {
    id: 'streak_week',
    name: 'Week Warrior',
    description: 'Reach a 7-day study streak',
    icon: 'Zap',
    tier: 'SILVER',
    condition: (_, progress) => progress.currentStreak >= 7
  },

  // --- GOLD ---
  {
    id: 'veteran',
    name: 'Exam Veteran',
    description: 'Complete 50 tests',
    icon: 'Award',
    tier: 'GOLD',
    condition: (history) => history.length >= 50
  },
  {
    id: 'mastermind',
    name: 'Mastermind',
    description: 'Achieve 100% accuracy in 5 different tests',
    icon: 'Brain',
    tier: 'GOLD',
    condition: (history) => history.filter(r => r.percentage === 100).length >= 5
  },
  
  // --- PLATINUM ---
  {
    id: 'legend',
    name: 'Ripka Legend',
    description: 'Reach Level 50',
    icon: 'Crown',
    tier: 'PLATINUM',
    condition: (_, progress) => progress.level >= 50
  }
];

export const processTestCompletion = (
  currentProgress: UserProgress,
  result: TestResult,
  history: TestResult[]
): { newProgress: UserProgress; unlockedBadges: Badge[] } => {
  
  let xpGained = XP_PER_TEST;
  
  if (result.percentage === 100) {
    xpGained += XP_PER_PERFECT_SCORE;
  }
  
  // Create updated progress object
  const newProgress: UserProgress = {
    ...currentProgress,
    totalXp: currentProgress.totalXp + xpGained,
    testsCompleted: currentProgress.testsCompleted + 1,
    perfectScores: result.percentage === 100 ? currentProgress.perfectScores + 1 : currentProgress.perfectScores,
  };

  // Recalculate level
  const { level } = calculateLevel(newProgress.totalXp);
  newProgress.level = level;

  // Check for new badges
  const unlockedBadges: Badge[] = [];
  const allHistory = [result, ...history]; // Include current result

  AVAILABLE_BADGES.forEach(badge => {
    // Skip if already owned
    if (newProgress.badges.some(b => b.badgeId === badge.id)) return;

    if (badge.condition(allHistory, newProgress)) {
      unlockedBadges.push(badge);
      newProgress.badges.push({
        badgeId: badge.id,
        unlockedAt: new Date().toISOString()
      });
    }
  });

  return { newProgress, unlockedBadges };
};