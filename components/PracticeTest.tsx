import React, { useState, useEffect } from 'react';
import { TestSession, QuestionStatus, TestResult, UserAnswer, TopicAnalysis } from '../types';
import { Button } from './Button';
import { Whiteboard } from './Whiteboard';
import { FormattedText } from './FormattedText'; 
import { saveActiveSession, clearActiveSession } from '../utils/storage';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Bookmark, 
  FileText, 
  BarChart2, 
  PauseCircle, 
  PlayCircle,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Menu,
  Maximize2,
  HelpCircle,
  PenTool,
  Save,
  AlertTriangle
} from 'lucide-react';

interface PracticeTestProps {
  session: TestSession;
  onExit: () => void;
  onComplete: (result: TestResult) => void;
}

export const PracticeTest: React.FC<PracticeTestProps> = ({ session, onExit, onComplete }) => {
  // Initialize state from session.progress if available
  const [currentQIndex, setCurrentQIndex] = useState(session.progress?.currentQIndex || 0);
  const [answers, setAnswers] = useState<Record<number, string>>(session.progress?.answers || {});
  const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>(session.progress?.statuses || {});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set(session.progress?.markedQuestions || []));
  const [elapsedSeconds, setElapsedSeconds] = useState(session.progress?.elapsedSeconds || 0);
  
  const [isPaused, setIsPaused] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false); 
  const [notes, setNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Track time per question for analytics
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<Record<number, number>>({});

  const currentQuestion = session.questions[currentQIndex];
  const totalQuestions = session.questions.length;

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setElapsedSeconds(prev => prev + 1);
        
        // Track per-question time if modal is not open
        if (!showSubmitModal && !showSummary) {
          setTimeSpentPerQuestion(prev => ({
            ...prev,
            [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
          }));
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, currentQuestion.id, showSubmitModal, showSummary]);

  // Auto-Save on significant changes
  useEffect(() => {
    if (!isPaused) { 
        saveCurrentState();
    }
  }, [answers, statuses, markedQuestions, currentQIndex, elapsedSeconds]);

  const saveCurrentState = () => {
    const progress = {
        answers,
        statuses,
        markedQuestions: Array.from(markedQuestions),
        elapsedSeconds,
        currentQIndex,
        lastUpdated: new Date().toISOString()
      };
      
      const updatedSession = { ...session, progress };
      saveActiveSession(updatedSession);
  };

  // Format Timer HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (option: string) => {
    if (statuses[currentQuestion.id] === 'CORRECT' || statuses[currentQuestion.id] === 'WRONG') {
      return; 
    }

    const isCorrect = option === currentQuestion.answer;
    
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    
    setStatuses(prev => ({
      ...prev,
      [currentQuestion.id]: isCorrect ? 'CORRECT' : 'WRONG'
    }));
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

  const navigateTo = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQIndex(index);
    }
  };

  const handleSaveAndPause = () => {
    setIsPaused(true);
    saveCurrentState();
    onExit(); 
  };

  const handleSubmitTest = () => {
    clearActiveSession();

    // --- Result Calculation Logic ---
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
          score += 1; 
        } else {
          wrongCount++;
          // Practice mode usually doesn't have negative marking, but check config
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

    // Topic Analysis
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

    const topicAnalysis = Array.from(topicMap.values()).map(t => ({
      ...t,
      accuracy: t.totalQuestions > 0 ? (t.correct / t.totalQuestions) * 100 : 0
    }));

    // Final Result Object
    const maxScore = totalQuestions;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    const result: TestResult = {
      id: session.id || Date.now().toString(),
      testName: session.config.testName,
      date: new Date().toISOString(),
      mode: session.config.mode,
      totalScore: Math.max(0, score),
      maxScore,
      percentage: Math.max(0, percentage),
      totalTimeSeconds: elapsedSeconds,
      correctCount,
      wrongCount,
      unattemptedCount,
      answers: userAnswers,
      topicAnalysis,
      status: percentage >= 40 ? 'PASS' : 'FAIL'
    };

    onComplete(result);
  };

  // Calculate Stats for UI
  const stats = {
    correct: Object.values(statuses).filter(s => s === 'CORRECT').length,
    wrong: Object.values(statuses).filter(s => s === 'WRONG').length,
    attempted: Object.keys(statuses).length,
    marked: markedQuestions.size
  };

  const getOptionLabel = (idx: number) => String.fromCharCode(65 + idx); 

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans">
      
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 h-16 px-4 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md">
              {session.config.testName}
            </h1>
            <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
              Practice Mode
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Timer Display */}
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isPaused ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold text-lg">{formatTime(elapsedSeconds)}</span>
           </div>

           <button 
             onClick={() => setIsPaused(!isPaused)} 
             className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
             title={isPaused ? "Resume" : "Pause"}
           >
             {isPaused ? <PlayCircle className="h-6 w-6 text-green-600" /> : <PauseCircle className="h-6 w-6" />}
           </button>

           <Button variant="outline" onClick={handleSaveAndPause} className="hidden sm:flex w-auto px-4 py-1.5 text-xs">
             Save & Exit
           </Button>
           
           <button 
             className="sm:hidden p-2 text-slate-600"
             onClick={() => setShowPalette(!showPalette)}
           >
             <Menu className="h-6 w-6" />
           </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANEL: Question Area */}
        <div className={`flex-1 flex flex-col h-full overflow-y-auto transition-all duration-300 ${showPalette ? 'mr-0 lg:mr-[320px]' : 'mr-0'}`}>
           
           {isPaused && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
               <PauseCircle className="h-16 w-16 text-blue-500 mb-4" />
               <h2 className="text-2xl font-bold text-slate-800">Test Paused</h2>
               <p className="text-slate-500 mb-6">Take a break! Your progress is saved.</p>
               <div className="flex gap-4">
                 <Button onClick={() => setIsPaused(false)} className="w-auto px-8">Resume</Button>
                 <Button variant="outline" onClick={handleSaveAndPause} className="w-auto px-8">Exit to Dashboard</Button>
               </div>
             </div>
           )}

           <div className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
              {/* Question Header */}
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded mb-2">
                     Question {currentQIndex + 1} of {totalQuestions}
                   </span>
                   <span className="ml-2 inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded mb-2 uppercase">
                     {currentQuestion.topic}
                   </span>
                 </div>
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={toggleMark} 
                     className={`p-2 rounded-full transition-colors ${markedQuestions.has(currentQuestion.id) ? 'text-orange-500 bg-orange-50' : 'text-slate-300 hover:bg-slate-100'}`}
                     title="Mark for Review"
                   >
                     <Bookmark className={`h-5 w-5 ${markedQuestions.has(currentQuestion.id) ? 'fill-current' : ''}`} />
                   </button>
                 </div>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                 {/* Use FormattedText for Question Text to support multi-line/formatting */}
                 <div className="text-xl sm:text-2xl font-medium text-slate-800 leading-relaxed">
                    <FormattedText text={currentQuestion.text} />
                 </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  const status = statuses[currentQuestion.id];
                  const isCorrectAnswer = option === currentQuestion.answer;
                  
                  let btnClass = "border-slate-200 hover:bg-slate-50 hover:border-blue-300";
                  let icon = <span className="font-bold text-slate-400 w-6">{getOptionLabel(idx)}</span>;

                  // Visual Feedback Logic
                  if (status === 'CORRECT' && isSelected) {
                    btnClass = "bg-green-50 border-green-500 ring-1 ring-green-500";
                    icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
                  } else if (status === 'WRONG' && isSelected) {
                    btnClass = "bg-red-50 border-red-500 ring-1 ring-red-500";
                    icon = <XCircle className="h-5 w-5 text-red-600" />;
                  } else if (status === 'WRONG' && isCorrectAnswer) {
                     btnClass = "bg-green-50 border-green-400 border-dashed";
                     icon = <CheckCircle2 className="h-5 w-5 text-green-600 opacity-50" />;
                  } else if (isSelected) {
                    btnClass = "bg-blue-50 border-blue-500 ring-1 ring-blue-500";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={!!status} 
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group ${btnClass}`}
                    >
                      <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm group-hover:border-blue-200">
                        {icon}
                      </div>
                      <span className={`text-base ${status && isCorrectAnswer ? 'font-bold text-green-800' : 'text-slate-700'}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {statuses[currentQuestion.id] && (
                <div className="animate-slideUp bg-blue-50 rounded-xl p-5 border border-blue-100 mb-8">
                  <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold">
                    <HelpCircle className="h-5 w-5" />
                    Explanation
                  </div>
                  <div className="text-blue-900 text-sm">
                    <FormattedText text={currentQuestion.explanation} />
                  </div>
                </div>
              )}

           </div>

           {/* Bottom Navigation Bar */}
           <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-20 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <div className="flex gap-2">
               <button 
                 onClick={() => navigateTo(currentQIndex - 1)}
                 disabled={currentQIndex === 0}
                 className="flex items-center px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
               >
                 <ChevronLeft className="h-4 w-4 mr-1" /> Prev
               </button>
               
               <button 
                 onClick={() => setShowNotes(true)}
                 className="hidden sm:flex items-center px-4 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                 title="Text Notes"
               >
                 <FileText className="h-4 w-4 mr-1" /> Notes
               </button>

               <button 
                 onClick={() => setShowWhiteboard(true)}
                 className="flex items-center px-4 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                 title="Handwritten Notes"
               >
                 <PenTool className="h-4 w-4 mr-1" /> Scribble
               </button>
             </div>

             <div className="flex gap-2">
                {currentQIndex < totalQuestions - 1 ? (
                  <button 
                    onClick={() => navigateTo(currentQIndex + 1)}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowSummary(true)}
                    className="flex items-center px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium shadow-md hover:shadow-lg"
                  >
                    View Summary
                  </button>
                )}
             </div>
           </div>
        </div>

        {/* RIGHT PANEL: Question Palette */}
        <div className={`
            fixed lg:absolute top-16 right-0 bottom-0 w-[320px] bg-white border-l border-slate-200 shadow-xl lg:shadow-none transform transition-transform duration-300 z-30 flex flex-col
            ${showPalette ? 'translate-x-0' : 'translate-x-full'}
        `}>
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Maximize2 className="h-4 w-4" /> Question Palette
             </h3>
             <button onClick={() => setShowPalette(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
               <X className="h-5 w-5" />
             </button>
           </div>

           {/* Stats Overview */}
           <div className="grid grid-cols-2 gap-2 p-4 border-b border-slate-100">
             <div className="bg-green-50 p-2 rounded text-center">
               <span className="block text-xl font-bold text-green-600">{stats.correct}</span>
               <span className="text-[10px] text-green-800 uppercase font-bold">Correct</span>
             </div>
             <div className="bg-red-50 p-2 rounded text-center">
               <span className="block text-xl font-bold text-red-600">{stats.wrong}</span>
               <span className="text-[10px] text-red-800 uppercase font-bold">Wrong</span>
             </div>
             <div className="bg-slate-50 p-2 rounded text-center">
               <span className="block text-xl font-bold text-slate-600">{totalQuestions - stats.attempted}</span>
               <span className="text-[10px] text-slate-500 uppercase font-bold">Remaining</span>
             </div>
             <div className="bg-orange-50 p-2 rounded text-center">
               <span className="block text-xl font-bold text-orange-600">{stats.marked}</span>
               <span className="text-[10px] text-orange-800 uppercase font-bold">Marked</span>
             </div>
           </div>

           {/* Grid */}
           <div className="flex-1 overflow-y-auto p-4">
             <div className="grid grid-cols-5 gap-2">
               {session.questions.map((q, idx) => {
                 const status = statuses[q.id];
                 const isMarked = markedQuestions.has(q.id);
                 const isCurrent = currentQIndex === idx;

                 let bgClass = "bg-slate-100 text-slate-600 hover:bg-slate-200"; 
                 
                 if (status === 'CORRECT') bgClass = "bg-green-500 text-white hover:bg-green-600";
                 else if (status === 'WRONG') bgClass = "bg-red-500 text-white hover:bg-red-600";
                 else if (isMarked) bgClass = "bg-orange-100 text-orange-700 border-2 border-orange-400";
                 
                 if (isCurrent) bgClass += " ring-2 ring-blue-500 ring-offset-2";

                 return (
                   <button
                     key={idx}
                     onClick={() => {
                        navigateTo(idx);
                        if (window.innerWidth < 1024) setShowPalette(false);
                     }}
                     className={`h-10 w-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${bgClass} relative`}
                   >
                     {idx + 1}
                     {isMarked && !status && <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full border border-white"></span>}
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

      {/* Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" /> My Notes
              </h3>
              <button onClick={() => setShowNotes(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <textarea 
                className="w-full h-48 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-700"
                placeholder="Type your notes here... (e.g. formulas, key concepts)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setShowNotes(false)} className="w-auto px-6">Save & Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Whiteboard Modal */}
      {showWhiteboard && (
        <Whiteboard 
          id={currentQuestion.id.toString()} 
          onClose={() => setShowWhiteboard(false)} 
        />
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
             <div className="p-6 text-center">
                <BarChart2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Test Summary</h3>
                <p className="text-slate-500 text-sm mb-6">Here is how you are doing so far.</p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Correct</span>
                    <span className="text-green-800 font-bold">{stats.correct}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700 font-medium">Wrong</span>
                    <span className="text-red-800 font-bold">{stats.wrong}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">Attempted</span>
                    <span className="text-slate-800 font-bold">{stats.attempted} / {totalQuestions}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowSummary(false)}>Keep Practicing</Button>
                  <Button onClick={handleSubmitTest}>Finish Test</Button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-6">
               <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                 <AlertTriangle className="h-8 w-8 text-yellow-600" />
               </div>
               <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Finish Practice Session?</h3>
               <p className="text-center text-slate-500 text-sm mb-6">
                 Are you sure you want to end this session? You can always start a new one later.
               </p>

               <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="flex justify-between">
                     <span className="text-slate-600">Correct:</span>
                     <span className="font-bold text-green-600">{stats.correct}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Wrong:</span>
                     <span className="font-bold text-red-600">{stats.wrong}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Remaining:</span>
                     <span className="font-bold text-slate-800">{totalQuestions - stats.attempted}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Time:</span>
                     <span className="font-bold text-slate-800">
                       {formatTime(elapsedSeconds)}
                     </span>
                   </div>
                 </div>
               </div>

               <div className="flex gap-3">
                 <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
                   Continue
                 </Button>
                 <Button onClick={handleSubmitTest} className="bg-green-600 hover:bg-green-700">
                   Yes, Finish
                 </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};