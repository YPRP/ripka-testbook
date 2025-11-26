import React, { useState, useEffect } from 'react';
import { getTestResults } from '../utils/storage';
import { Flashcard } from '../types';
import { Button } from './Button';
import { FormattedText } from './FormattedText'; // Import
import { 
  ArrowLeft, 
  Brain, 
  RotateCcw, 
  Check, 
  X, 
  BookOpen,
  Layers
} from 'lucide-react';

interface SmartRevisionProps {
  onBack: () => void;
}

export const SmartRevision: React.FC<SmartRevisionProps> = ({ onBack }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const results = getTestResults();
    const wrongAnswers: Flashcard[] = [];
    const seenQuestions = new Set<string>();

    results.forEach(r => {
      r.answers.forEach(a => {
        if (!a.isCorrect && !seenQuestions.has(a.questionText)) {
          seenQuestions.add(a.questionText);
          wrongAnswers.push({
            id: a.questionId,
            question: a.questionText,
            answer: a.correctOption,
            explanation: a.explanation,
            topic: a.topic,
            strength: 0
          });
        }
      });
    });

    setFlashcards(wrongAnswers.sort(() => Math.random() - 0.5));
  }, []);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      setIsComplete(true);
    }
  };

  const handleRetry = () => {
    setFlashcards(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsComplete(false);
    setIsFlipped(false);
  };

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">All Caught Up!</h2>
          <p className="text-slate-500 mb-6">You don't have any wrong answers to review. Great job!</p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="w-auto p-2 h-10 w-10 flex items-center justify-center rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-6 w-6 text-purple-600" />
            Smart Revision
          </h1>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Card {currentIndex + 1} / {flashcards.length}
        </div>
      </div>

      {isComplete ? (
        <div className="flex-1 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md w-full">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Complete!</h2>
            <p className="text-slate-500 mb-8">You've reviewed {flashcards.length} cards today.</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={onBack}>Dashboard</Button>
              <Button onClick={handleRetry}>Review Again</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-2xl perspective-1000 h-[400px] sm:h-[500px] relative group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* Front */}
              <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 flex flex-col backface-hidden">
                <div className="flex justify-between items-center mb-6">
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    {currentCard.topic}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Tap to flip
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center text-center">
                  <p className="text-xl sm:text-2xl font-medium text-slate-800 leading-relaxed">
                    {currentCard.question}
                  </p>
                </div>
              </div>

              {/* Back */}
              <div className="absolute w-full h-full bg-purple-50 rounded-2xl shadow-xl border border-purple-100 p-8 flex flex-col backface-hidden rotate-y-180">
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Correct Answer</h3>
                  <p className="text-xl font-bold text-purple-900">{currentCard.answer}</p>
                </div>
                <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Explanation</h3>
                  <div className="text-slate-700 leading-relaxed text-sm">
                    <FormattedText text={currentCard.explanation} />
                  </div>
                </div>
                <div className="mt-6 flex justify-center pt-4 border-t border-purple-100">
                  <p className="text-xs text-purple-400 italic">Tap anywhere to flip back</p>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-8 flex gap-4 w-full max-w-sm">
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="flex-1 py-3 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
            >
              <X className="h-5 w-5" /> Still Tricky
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="flex-1 py-3 rounded-xl bg-green-100 text-green-700 font-bold hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5" /> Got It
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};