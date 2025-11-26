import React, { useState, useEffect, useRef } from 'react';
import { TestSession, Question, TestResult, UserAnswer, TopicAnalysis } from '../types';
import { Button } from './Button';
import { saveActiveSession, clearActiveSession } from '../utils/storage';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Bookmark, 
  AlertTriangle,
  RotateCcw,
  Maximize,
  Minimize,
  Menu,
  X,
  Save,
  PauseCircle
} from 'lucide-react';

interface ExamTestProps {
  session: TestSession;
  onExit: () => void;
  onComplete: (result: TestResult) => void;
}

export const ExamTest: React.FC<ExamTestProps> = ({ session, onExit, onComplete }) => {
  // Initialize state from session.progress if available
  const [currentQIndex, setCurrentQIndex] = useState(session.progress?.currentQIndex || 0);
  const [answers, setAnswers] = useState<Record<number, string>>(session.progress?.answers || {}); 
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set(session.progress?.markedQuestions || []));
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([session.questions[0].id]));
  
  // Timer State
  const initialTime = session.config.durationMinutes > 0 
    ? (session.progress?.elapsedSeconds 
        ? (session.config.durationMinutes * 60) - session.progress.elapsedSeconds 
        : session.config.durationMinutes * 60) 
    : 0;
    
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [elapsedTime, setElapsedTime] = useState(session.progress?.elapsedSeconds || 0); 
  const [showPalette, setShowPalette] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Time tracking per question
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<Record<number, number>>({});

  const currentQuestion = session.questions[currentQIndex];
  const totalQuestions = session.questions.length;

  // Main Timer Loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPaused) return;

      // 1. Update Global Timer
      if (session.config.durationMinutes > 0) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitTest(); // Auto submit
            return 0;
          }
          return prev - 1;
        });
      } else {
        setElapsedTime(prev => prev + 1);
      }

      // 2. Update Question Specific Timer
      if (!showSubmitModal) { // Don't count time when modal is open
        setTimeSpentPerQuestion(prev => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
        }));
      }

    }, 1000);
    return () => clearInterval(timer);
  }, [session.config.durationMinutes, currentQuestion.id, showSubmitModal, isPaused]);

  // Auto-Save
  useEffect(() => {
    if (!isPaused) {
        saveCurrentState();
    }
  }, [answers, markedQuestions, currentQIndex, timeLeft, elapsedTime]);

  const saveCurrentState = () => {
    const progress = {
        answers,
        statuses: {}, // Exam mode typically doesn't show statuses mid-test
        markedQuestions: Array.from(markedQuestions),
        elapsedSeconds: session.config.durationMinutes > 0 ? (session.config.durationMinutes * 60) - timeLeft : elapsedTime,
        currentQIndex,
        lastUpdated: new Date().toISOString()
      };
      
      const updatedSession = { ...session, progress };
      saveActiveSession(updatedSession);
  };

  useEffect(() => {
    setVisitedQuestions(prev => new Set(prev).add(currentQuestion.id));
  }, [currentQIndex, currentQuestion.id]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const clearResponse = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
  };

  const toggleMark = () => {
    setMarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  const handleMarkAndNext = () => {
    setMarkedQuestions(prev => new Set(prev).add(currentQuestion.id));
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const navigateTo = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQIndex(index);
    }
  };

  const handleSaveAndPause = () => {
    setIsPaused(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }
    saveCurrentState();
    onExit(); // Returns to dashboard
  };

  const handleSubmitTest = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }

    clearActiveSession();

    // 1. Calculate Results
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let score = 0;

    const userAnswers: UserAnswer[] = session.questions.map(q => {
      const selected = answers[q.id] || null;
      const isCorrect = selected === q.answer;
      
      if (selected) {
        if (isCorrect) {
          correctCount++;
          score += 1; // Assuming 1 mark per question
        } else {
          wrongCount++;
          if (session.config.negativeMarking) score -= 0.25;
        }
      } else {
        unattemptedCount++;
      }

      return {
        questionId: q.id,
        questionText: q.text,
        selectedOption: selected,
        correctOption: q.answer,
        isCorrect,
        timeSpentSeconds: timeSpentPerQuestion[q.id] || 0,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        options: q.options
      };
    });

    // 2. Topic Analysis
    const topicMap = new Map<string, TopicAnalysis>();
    session.questions.forEach(q => {
      if (!topicMap.has(q.topic)) {
        topicMap.set(q.topic, { 
          topic: q.topic, totalQuestions: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0, timeSpent: 0 
        });
      }
      const stats = topicMap.get(q.topic)!;
      stats.totalQuestions++;
      stats.timeSpent += timeSpentPerQuestion[q.id] || 0;
      
      const selected = answers[q.id];
      if (selected) {
        if (selected === q.answer) stats.correct++;
        else stats.wrong++;
      } else {
        stats.unattempted++;
      }
    });

    // Calculate accuracy per topic
    const topicAnalysis = Array.from(topicMap.values()).map(t => ({
      ...t,
      accuracy: t.totalQuestions > 0 ? (t.correct / t.totalQuestions) * 100 : 0
    }));

    // 3. Final Result Object
    const maxScore = totalQuestions; // Assuming 1 mark each
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const totalTime = session.config.durationMinutes > 0 
      ? (session.config.durationMinutes * 60) - timeLeft 
      : elapsedTime;

    const result: TestResult = {
      id: session.id || Date.now().toString(),
      testName: session.config.testName,
      date: new Date().toISOString(),
      mode: session.config.mode,
      totalScore: Math.max(0, score), // Don't show negative total score
      maxScore,
      percentage: Math.max(0, percentage),
      totalTimeSeconds: totalTime,
      correctCount,
      wrongCount,
      unattemptedCount,
      answers: userAnswers,
      topicAnalysis,
      status: percentage >= 40 ? 'PASS' : 'FAIL'
    };

    onComplete(result);
  };

  const stats = {
    answered: Object.keys(answers).length,
    marked: markedQuestions.size,
    notAnswered: visitedQuestions.size - Object.keys(answers).length, 
    notVisited: totalQuestions - visitedQuestions.size
  };

  const isLowTime = session.config.durationMinutes > 0 && timeLeft < 300; 

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white h-14 px-4 flex justify-between items-center shadow-md z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-sm sm:text-lg font-bold truncate max-w-[200px]">
            {session.config.testName}
          </h1>
        </div>

        <div className="flex items-center gap-6">
           <div className={`flex items-center gap-2 px-4 py-1.5 rounded bg-slate-800 border border-slate-700 ${isLowTime ? 'animate-pulse text-red-400 border-red-900 bg-red-900/20' : ''}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold text-lg">
                {session.config.durationMinutes > 0 ? formatTime(timeLeft) : formatTime(elapsedTime)}
              </span>
              <span className="text-xs text-slate-400 ml-1">
                {session.config.durationMinutes > 0 ? 'Left' : 'Elapsed'}
              </span>
           </div>

           <button onClick={toggleFullScreen} className="hidden sm:block text-slate-400 hover:text-white transition-colors" title="Toggle Full Screen">
             {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
           </button>
           
           <button 
             className="lg:hidden text-slate-300"
             onClick={() => setShowPalette(!showPalette)}
           >
             <Menu className="h-6 w-6" />
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative bg-slate-100">
        {/* Left Panel: Question */}
        <div className={`flex-1 flex flex-col h-full overflow-y-auto transition-all duration-300 ${showPalette ? 'mr-0 lg:mr-[320px]' : 'mr-0'}`}>
           <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <div className="flex items-center gap-3">
                     <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded">
                       Q{currentQIndex + 1}
                     </span>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                       {currentQuestion.topic}
                     </span>
                     {session.config.negativeMarking && (
                       <span className="text-[10px] text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-100">
                         -0.25 Negative Marking
                       </span>
                     )}
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                     <Clock className="h-3 w-3" /> Time: {formatTime(timeSpentPerQuestion[currentQuestion.id] || 0)}
                   </div>
                </div>

                <div className="p-6 sm:p-8 flex-1">
                  <p className="text-lg sm:text-xl font-medium text-slate-800 leading-relaxed mb-8 select-none">
                    {currentQuestion.text}
                  </p>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = answers[currentQuestion.id] === option;
                      return (
                        <div 
                          key={idx}
                          onClick={() => handleOptionSelect(option)}
                          className={`
                            relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 group
                            ${isSelected 
                              ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 z-10' 
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                            }
                          `}
                        >
                          <div className={`
                            h-5 w-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors
                            ${isSelected ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}
                          `}>
                            {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                          </div>
                          <span className={`text-base ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                   <button 
                     onClick={toggleMark}
                     className={`flex items-center gap-2 text-sm font-medium transition-colors ${markedQuestions.has(currentQuestion.id) ? 'text-purple-600' : 'text-slate-500 hover:text-purple-600'}`}
                   >
                     <Bookmark className={`h-4 w-4 ${markedQuestions.has(currentQuestion.id) ? 'fill-current' : ''}`} />
                     {markedQuestions.has(currentQuestion.id) ? 'Unmark' : 'Mark for Review'}
                   </button>
                   
                   {answers[currentQuestion.id] && (
                     <button 
                       onClick={clearResponse}
                       className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                     >
                       <RotateCcw className="h-4 w-4" /> Clear Response
                     </button>
                   )}
                </div>
              </div>
           </div>

           <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-20 flex justify-between items-center shadow-lg">
              <button 
                 onClick={() => navigateTo(currentQIndex - 1)}
                 disabled={currentQIndex === 0}
                 className="flex items-center px-5 py-2.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
               >
                 <ChevronLeft className="h-4 w-4 mr-1" /> Previous
               </button>

               <div className="flex gap-3">
                 <button 
                    onClick={handleMarkAndNext}
                    className="hidden sm:flex items-center px-5 py-2.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg font-medium transition-colors"
                 >
                   <Bookmark className="h-4 w-4 mr-2" /> Mark & Next
                 </button>
                 
                 {currentQIndex < totalQuestions - 1 ? (
                   <button 
                     onClick={() => navigateTo(currentQIndex + 1)}
                     className="flex items-center px-8 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                   >
                     Next <ChevronRight className="h-4 w-4 ml-1" />
                   </button>
                 ) : (
                    <button 
                     onClick={() => setShowSubmitModal(true)}
                     className="flex items-center px-8 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                   >
                     Submit Test
                   </button>
                 )}
               </div>
           </div>
        </div>

        {/* Right Panel: Palette */}
        <div className={`
            fixed lg:absolute top-14 right-0 bottom-0 w-[320px] bg-white border-l border-slate-200 shadow-xl lg:shadow-none transform transition-transform duration-300 z-30 flex flex-col
            ${showPalette ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
             <h3 className="font-bold text-slate-800">Question Palette</h3>
             <button onClick={() => setShowPalette(false)} className="lg:hidden text-slate-400">
               <X className="h-5 w-5" />
             </button>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-100">
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="h-3 w-3 rounded bg-green-500"></span> Answered ({stats.answered})
             </div>
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="h-3 w-3 rounded bg-red-500"></span> Not Answered ({stats.notAnswered})
             </div>
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="h-3 w-3 rounded bg-purple-500"></span> Marked ({stats.marked})
             </div>
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="h-3 w-3 rounded bg-slate-200 border border-slate-300"></span> Not Visited ({stats.notVisited})
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
             <div className="grid grid-cols-5 gap-2">
               {session.questions.map((q, idx) => {
                 const isAnswered = !!answers[q.id];
                 const isMarked = markedQuestions.has(q.id);
                 const isVisited = visitedQuestions.has(q.id);
                 const isCurrent = currentQIndex === idx;

                 let bgClass = "bg-white text-slate-600 border border-slate-200"; 
                 
                 if (isMarked) {
                   bgClass = "bg-purple-500 text-white border-purple-600";
                 } else if (isAnswered) {
                   bgClass = "bg-green-500 text-white border-green-600";
                 } else if (isVisited) {
                   bgClass = "bg-red-500 text-white border-red-600";
                 }

                 if (isCurrent) {
                    bgClass += " ring-2 ring-blue-500 ring-offset-2 z-10 transform scale-110";
                 }

                 return (
                   <button
                     key={idx}
                     onClick={() => {
                        navigateTo(idx);
                        if (window.innerWidth < 1024) setShowPalette(false);
                     }}
                     className={`h-10 w-10 rounded-md text-sm font-bold shadow-sm transition-all hover:scale-105 ${bgClass} relative`}
                   >
                     {idx + 1}
                     {isMarked && isAnswered && (
                       <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border border-white"></div>
                     )}
                   </button>
                 );
               })}
             </div>
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-white">
             <Button onClick={handleSaveAndPause} variant="secondary" className="w-full mb-2">
               Save & Pause
             </Button>
             <Button onClick={() => setShowSubmitModal(true)} className="w-full bg-green-600 hover:bg-green-700">
               Submit Test
             </Button>
          </div>
        </div>

      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-6">
               <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                 <AlertTriangle className="h-8 w-8 text-yellow-600" />
               </div>
               <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Submit Test?</h3>
               <p className="text-center text-slate-500 text-sm mb-6">
                 Are you sure you want to submit? You cannot change your answers after submission.
               </p>

               <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="flex justify-between">
                     <span className="text-slate-600">Answered:</span>
                     <span className="font-bold text-slate-800">{stats.answered}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Marked:</span>
                     <span className="font-bold text-slate-800">{stats.marked}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Skipped:</span>
                     <span className="font-bold text-slate-800">{totalQuestions - stats.answered}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Time Left:</span>
                     <span className="font-bold text-slate-800">
                       {session.config.durationMinutes > 0 ? formatTime(timeLeft) : 'N/A'}
                     </span>
                   </div>
                 </div>
               </div>

               <div className="flex gap-3">
                 <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
                   Continue Test
                 </Button>
                 <Button onClick={handleSubmitTest} className="bg-green-600 hover:bg-green-700">
                   Yes, Submit
                 </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};