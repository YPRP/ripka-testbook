import React, { useState, useEffect } from 'react';
import { User, TestSession, TestConfig, Question, TestResult } from '../types';
import { CreateTestFlow } from './CreateTestFlow';
import { PracticeTest } from './PracticeTest';
import { ExamTest } from './ExamTest';
import { TestResults } from './TestResults';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { TestHistory } from './TestHistory';
import { Achievements } from './Achievements';
import { SettingsPage } from './SettingsPage';
import { AIStudyCompanion } from './AIStudyCompanion';
import { SmartRevision } from './SmartRevision';
import { saveTestResult, getUserProgress, saveUserProgress, getTestResults, getActiveSession, clearActiveSession } from '../utils/storage';
import { processTestCompletion } from '../utils/gamification';
import {
  LogOut,
  BookOpen,
  History,
  BarChart3,
  Trophy,
  Settings,
  Bot,
  Plus,
  ChevronRight,
  GraduationCap,
  Timer,
  Zap,
  FilePlus,
  LayoutDashboard,
  Brain,
  Layers,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  // Main Views
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  
  const [activeTestSession, setActiveTestSession] = useState<TestSession | null>(null);
  const [pausedSession, setPausedSession] = useState<TestSession | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(user);
  
  // Local state for stats to update UI immediately
  const [userStats, setUserStats] = useState({ 
    tests: 0, 
    streak: 0, 
    level: 1 
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Load initial stats
    const progress = getUserProgress();
    setUserStats({
      tests: progress.testsCompleted,
      streak: progress.currentStreak,
      level: progress.level
    });

    // Check for paused session
    const active = getActiveSession();
    if (active) {
      setPausedSession(active);
    }

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  };

  const handleCreateTest = (config: TestConfig, questions: Question[]) => {
    const sessionQuestions = questions.slice(0, config.questionCount);
    
    const newSession: TestSession = {
      config,
      questions: sessionQuestions,
      startTime: new Date().toISOString()
    };
    
    setShowCreateFlow(false);
    setTestResult(null); 
    setActiveTestSession(newSession);
    // Clear any old paused session since we started a new one
    clearActiveSession();
    setPausedSession(null);
  };

  const handleResumeTest = () => {
    if (pausedSession) {
      setActiveTestSession(pausedSession);
      setPausedSession(null); // It's now active
    }
  };

  const handleExamComplete = (result: TestResult) => {
    // 1. Gamification Processing
    const currentProgress = getUserProgress();
    const history = getTestResults();
    const { newProgress, unlockedBadges } = processTestCompletion(currentProgress, result, history);
    
    if (unlockedBadges.length > 0) {
      console.log("Unlocked badges:", unlockedBadges);
      alert(`🎉 Congratulations! You unlocked ${unlockedBadges.length} new badge(s)!`);
    }

    saveUserProgress(newProgress);
    saveTestResult(result);
    clearActiveSession(); // Done with this session
    
    // Update local stats
    setUserStats({
      tests: newProgress.testsCompleted,
      streak: newProgress.currentStreak,
      level: newProgress.level
    });

    setActiveTestSession(null);
    setTestResult(result);
  };

  const handleExitTest = () => {
    // Just close the test view. If it was paused, it's saved in storage by the component.
    // If we want to refresh the "Resume" button state:
    const active = getActiveSession();
    setPausedSession(active);
    setActiveTestSession(null);
  };

  // 0. Show Settings
  if (showSettings) {
    return (
      <SettingsPage 
        user={currentUser} 
        onBack={() => setShowSettings(false)} 
        onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
        onLogout={onLogout}
      />
    );
  }

  // 0. Show AI Companion
  if (showAI) {
    return <AIStudyCompanion onBack={() => setShowAI(false)} />;
  }

  // 0. Show Smart Revision
  if (showRevision) {
    return <SmartRevision onBack={() => setShowRevision(false)} />;
  }

  // 0. Show Achievements
  if (showAchievements) {
    return <Achievements onBack={() => setShowAchievements(false)} />;
  }

  // 0. Show History
  if (showHistory) {
    return (
      <TestHistory 
        onBack={() => setShowHistory(false)} 
        onViewResult={(r) => {
          setShowHistory(false);
          setTestResult(r);
        }}
        onReattempt={() => {
          setShowHistory(false);
          setShowCreateFlow(true);
        }}
      />
    );
  }

  // 1. Show Analytics
  if (showAnalytics) {
    return <AnalyticsDashboard onBack={() => setShowAnalytics(false)} />;
  }

  // 2. Show Result Screen
  if (testResult) {
    return (
      <TestResults 
        result={testResult} 
        onBackToDashboard={() => setTestResult(null)}
        onReattempt={() => {
           setTestResult(null);
           setShowCreateFlow(true); 
        }} 
      />
    );
  }

  // 3. Show Active Test Interface
  if (activeTestSession) {
    if (activeTestSession.config.mode === 'EXAM') {
      return (
        <ExamTest
          session={activeTestSession}
          onExit={handleExitTest}
          onComplete={handleExamComplete}
        />
      );
    }
    return (
      <PracticeTest 
        session={activeTestSession} 
        onExit={handleExitTest} 
        onComplete={handleExamComplete} // Added to ensure Practice Test stats are saved
      />
    );
  }

  // Quick Stats
  const stats = [
    { label: 'Tests Taken', value: userStats.tests.toString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Level', value: userStats.level.toString(), icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    { label: 'Study Time', value: '0h', icon: Timer, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Current Streak', value: `${userStats.streak} Days`, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];

  // Navigation Grid Cards
  const navCards = [
    { title: 'AI Study Companion', icon: Bot, desc: 'Chat with AI Tutor', bg: 'bg-indigo-600', iconColor: 'text-white', isFeatured: true, action: () => setShowAI(true) },
    { title: 'Smart Revision', icon: Layers, desc: 'Review wrong answers', bg: 'bg-purple-600', iconColor: 'text-white', isFeatured: true, action: () => setShowRevision(true) },
    { title: 'Dashboard', icon: LayoutDashboard, desc: 'Performance overview', bg: 'bg-white', iconColor: 'text-blue-600', border: 'border-blue-200', action: () => {} },
    { title: 'My Tests', icon: BookOpen, desc: 'All created tests', bg: 'bg-white', iconColor: 'text-blue-600', border: 'border-blue-200', action: () => setShowHistory(true) }, // Wired "My Tests" to History
    { title: 'Analytics', icon: BarChart3, desc: 'Detailed metrics', bg: 'bg-white', iconColor: 'text-emerald-600', border: 'border-emerald-200', action: () => setShowAnalytics(true) },
    { title: 'History', icon: History, desc: 'Past test attempts', bg: 'bg-white', iconColor: 'text-orange-600', border: 'border-orange-200', action: () => setShowHistory(true) },
    { title: 'Achievements', icon: Trophy, desc: 'Badges & milestones', bg: 'bg-white', iconColor: 'text-yellow-600', border: 'border-yellow-200', action: () => setShowAchievements(true) },
    { title: 'Settings', icon: Settings, desc: 'App preferences', bg: 'bg-white', iconColor: 'text-slate-600', border: 'border-slate-200', action: () => setShowSettings(true) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-bold text-xl text-slate-800 tracking-tight leading-none">
                  RIPKA
                </span>
                <span className="text-[10px] font-bold text-blue-600 tracking-[0.2em] leading-none">
                  TESTBOOK
                </span>
              </div>
            </div>

            {/* Date & Time (Desktop) */}
            <div className="hidden md:flex flex-col justify-center items-center">
              <div className="text-sm font-semibold text-slate-700 font-mono tracking-tight">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-1">
                 <span className="text-sm font-bold text-slate-800">{currentUser.fullName}</span>
                 <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full tracking-wide">
                   Lvl {userStats.level} • {currentUser.role}
                 </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-white ring-2 ring-slate-100">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="h-8 w-px bg-slate-200 mx-1"></div>
              <button 
                onClick={onLogout}
                className="group p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                title="Logout"
              >
                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Create Test Flow Overlay */}
        {showCreateFlow ? (
          <div className="animate-slideUp h-[calc(100vh-8rem)]">
            <CreateTestFlow 
              onBack={() => setShowCreateFlow(false)} 
              onSave={handleCreateTest}
            />
          </div>
        ) : (
          <>
            {/* Resume Test Banner */}
            {pausedSession && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8 flex justify-between items-center shadow-sm animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <PauseCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-900">Resume In-Progress Test</h3>
                    <p className="text-sm text-orange-700">
                      {pausedSession.config.testName} • {pausedSession.progress?.currentQIndex} of {pausedSession.questions.length} Questions
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleResumeTest}
                  className="flex items-center px-6 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg font-bold shadow-sm transition-colors"
                >
                  Resume <PlayCircle className="ml-2 h-4 w-4" />
                </button>
              </div>
            )}

            {/* Quick Stats Section */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, idx) => (
                 <div key={idx} className={`bg-white p-4 rounded-xl border ${stat.border} shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl font-black text-slate-900">{stat.value}</p>
                    </div>
                 </div>
              ))}
            </section>

            {/* Primary Action Button */}
            <section className="mb-10 flex justify-center">
              <button 
                onClick={() => setShowCreateFlow(true)}
                className="group relative w-full max-w-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                
                <div className="relative flex items-center justify-center gap-5 py-6 px-8">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
                     <Plus className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block text-2xl font-black tracking-tight">CREATE NEW TEST</span>
                    <span className="block text-blue-100 text-sm font-medium opacity-90">Start a new assessment session</span>
                  </div>
                  <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <ChevronRight className="h-8 w-8 text-white/50" />
                  </div>
                </div>
              </button>
            </section>

            {/* Main Navigation Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
               {navCards.map((card, idx) => (
                 <button 
                   key={idx} 
                   onClick={card.action}
                   className={`relative overflow-hidden group p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-left flex flex-col h-full
                    ${card.isFeatured 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 col-span-1 sm:col-span-2 lg:col-span-1' 
                      : card.title === 'Smart Revision' 
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-200 col-span-1 sm:col-span-2 lg:col-span-1'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                    }
                   `}
                 >
                   <div className="flex justify-between items-start mb-4 w-full">
                     <div className={`p-3 rounded-lg ${card.isFeatured ? 'bg-white/20 text-white' : 'bg-slate-50 ' + card.iconColor}`}>
                       <card.icon className="h-6 w-6" />
                     </div>
                     {card.isFeatured && (
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                          {card.title === 'AI Study Companion' ? 'Powered by Gemini' : 'Beta'}
                        </span>
                     )}
                   </div>
                   
                   <div className="mt-auto">
                     <h3 className={`text-lg font-bold mb-1 ${card.isFeatured ? 'text-white' : 'text-slate-800'}`}>
                       {card.title}
                     </h3>
                     <p className={`text-sm ${card.isFeatured ? 'text-indigo-100' : 'text-slate-500'}`}>
                       {card.desc}
                     </p>
                   </div>
                   
                   {/* Hover Effect Arrow */}
                   <div className={`absolute bottom-6 right-6 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300
                     ${card.isFeatured ? 'text-white' : 'text-blue-600'}
                   `}>
                     <ChevronRight className="h-5 w-5" />
                   </div>
                 </button>
               ))}
            </section>

            {/* Recent Activity Widget - Empty State */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <History className="h-5 w-5 text-slate-400" />
                   Recent Activity
                 </h3>
                 <button onClick={() => setShowHistory(true)} className="text-sm font-bold text-blue-600 hover:text-blue-800">View All</button>
              </div>
              
              <div className="p-10 text-center">
                 <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                   <FilePlus className="h-8 w-8 text-slate-300" />
                 </div>
                 <h4 className="text-lg font-bold text-slate-900 mb-2">No activity recorded</h4>
                 <p className="text-slate-500 max-w-sm mx-auto mb-6 text-sm">
                   Your recent test results and activities will appear here once you start taking assessments.
                 </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};