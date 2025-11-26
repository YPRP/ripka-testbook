import React, { useState, useEffect } from 'react';
import { UserProgress, Badge, UnlockedBadge } from '../types';
import { getUserProgress, getTestResults } from '../utils/storage';
import { calculateLevel, AVAILABLE_BADGES } from '../utils/gamification';
import { Button } from './Button';
import {
  Trophy,
  Award,
  Star,
  Target,
  Zap,
  Crown,
  Lock,
  ArrowLeft,
  Share2,
  Download,
  Flame,
  Flag,
  BookOpen,
  Brain
} from 'lucide-react';

interface AchievementsProps {
  onBack: () => void;
}

const IconMap: Record<string, React.ReactNode> = {
  Flag: <Flag className="h-6 w-6" />,
  Flame: <Flame className="h-6 w-6" />,
  Star: <Star className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
  Target: <Target className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Award: <Award className="h-6 w-6" />,
  Brain: <Brain className="h-6 w-6" />,
  Crown: <Crown className="h-6 w-6" />,
};

export const Achievements: React.FC<AchievementsProps> = ({ onBack }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [levelInfo, setLevelInfo] = useState<{ level: number; progress: number; nextLevelXp: number }>({ level: 1, progress: 0, nextLevelXp: 500 });
  
  useEffect(() => {
    const p = getUserProgress();
    setProgress(p);
    setLevelInfo(calculateLevel(p.totalXp));
  }, []);

  if (!progress) return null;

  const isUnlocked = (badgeId: string) => progress.badges.some(b => b.badgeId === badgeId);
  const getUnlockDate = (badgeId: string) => {
    const badge = progress.badges.find(b => b.badgeId === badgeId);
    return badge ? new Date(badge.unlockedAt).toLocaleDateString() : null;
  };

  const tiers = {
    BRONZE: { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
    SILVER: { color: 'text-slate-600', bg: 'bg-slate-200', border: 'border-slate-300' },
    GOLD: { color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' },
    PLATINUM: { color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-300' }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={onBack} className="w-auto p-2 h-10 w-10 flex items-center justify-center rounded-full border-slate-200">
               <ArrowLeft className="h-5 w-5 text-slate-600" />
             </Button>
             <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Trophy className="h-6 w-6 text-yellow-500" />
               Achievements & Rewards
             </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
         
         {/* Level Progress Section */}
         <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            <div className="p-8 flex flex-col md:flex-row items-center gap-8">
               {/* Level Circle */}
               <div className="relative flex-shrink-0">
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl ring-4 ring-indigo-50">
                     <div className="text-center text-white">
                        <span className="block text-xs font-bold uppercase tracking-widest opacity-80">Level</span>
                        <span className="block text-5xl font-black">{levelInfo.level}</span>
                     </div>
                  </div>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-sm whitespace-nowrap">
                     {progress.totalXp} XP
                  </div>
               </div>

               {/* XP Bar */}
               <div className="flex-1 w-full">
                  <div className="flex justify-between items-end mb-2">
                     <div>
                        <h2 className="text-2xl font-bold text-slate-800">Keep growing!</h2>
                        <p className="text-slate-500 text-sm">You need {levelInfo.nextLevelXp - progress.totalXp} more XP to reach Level {levelInfo.level + 1}</p>
                     </div>
                     <span className="text-indigo-600 font-bold">{Math.round(levelInfo.progress)}%</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                     <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: `${levelInfo.progress}%` }}
                     ></div>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-slate-600">
                     <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="font-bold">{progress.currentStreak} Day Streak</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-bold">{progress.testsCompleted} Tests Done</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Badges Grid */}
         <div>
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Award className="h-6 w-6 text-indigo-600" /> Badge Collection
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {AVAILABLE_BADGES.map((badge) => {
                  const unlocked = isUnlocked(badge.id);
                  const style = tiers[badge.tier];
                  const unlockDate = getUnlockDate(badge.id);

                  return (
                     <div 
                        key={badge.id}
                        className={`
                           relative rounded-xl border-2 p-6 flex flex-col items-center text-center transition-all duration-300
                           ${unlocked 
                              ? `bg-white ${style.border} shadow-md hover:shadow-lg hover:-translate-y-1` 
                              : 'bg-slate-50 border-slate-200 opacity-60 grayscale'
                           }
                        `}
                     >
                        <div className={`
                           h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-inner
                           ${unlocked ? style.bg : 'bg-slate-200'}
                        `}>
                           <div className={unlocked ? style.color : 'text-slate-400'}>
                              {unlocked ? IconMap[badge.icon] : <Lock className="h-8 w-8" />}
                           </div>
                        </div>
                        
                        <h4 className="font-bold text-slate-800 mb-1">{badge.name}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${unlocked ? style.bg + ' ' + style.color : 'bg-slate-200 text-slate-500'}`}>
                           {badge.tier}
                        </span>
                        
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                           {badge.description}
                        </p>

                        {unlocked && (
                           <div className="mt-auto text-[10px] font-medium text-slate-400 flex items-center gap-1">
                              <Award className="h-3 w-3" /> Unlocked {unlockDate}
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Certificates Section */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
               <FileText className="h-6 w-6 text-blue-600" /> Certificates
            </h3>
            
            {progress.testsCompleted > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                           <Award className="h-6 w-6" />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 text-sm">First Milestone</h4>
                           <p className="text-xs text-slate-500">Completed 1st Test</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600" title="Download PDF">
                           <Download className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600" title="Share">
                           <Share2 className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
                  {/* Placeholder for more */}
               </div>
            ) : (
               <div className="text-center py-8 text-slate-500 text-sm">
                  Complete tests to earn certificates!
               </div>
            )}
         </div>

      </div>
    </div>
  );
};

// Missing icon import helper
import { FileText, CheckCircle } from 'lucide-react';