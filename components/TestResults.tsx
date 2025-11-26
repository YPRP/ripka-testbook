import React, { useState } from 'react';
import { TestResult } from '../types';
import { Button } from './Button';
import { FormattedText } from './FormattedText'; // Import
import { 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Clock, 
  BarChart2, 
  Download, 
  Share2, 
  RotateCcw, 
  Home, 
  ChevronDown, 
  ChevronUp,
  Brain,
  AlertTriangle,
  TrendingUp,
  Award
} from 'lucide-react';

interface TestResultsProps {
  result: TestResult;
  onBackToDashboard: () => void;
  onReattempt: () => void;
}

export const TestResults: React.FC<TestResultsProps> = ({ result, onBackToDashboard, onReattempt }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'review'>('overview');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'UNATTEMPTED'>('ALL');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const getAccuracyColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const strengths = result.topicAnalysis.filter(t => t.accuracy >= 75);
  const weaknesses = result.topicAnalysis.filter(t => t.accuracy < 50);

  const filteredAnswers = result.answers.filter(a => {
    if (reviewFilter === 'ALL') return true;
    if (reviewFilter === 'CORRECT') return a.isCorrect;
    if (reviewFilter === 'WRONG') return !a.isCorrect && a.selectedOption !== null;
    if (reviewFilter === 'UNATTEMPTED') return a.selectedOption === null;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-600" />
            Result Analysis
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBackToDashboard} className="w-auto px-4">
              <Home className="h-4 w-4 mr-2" /> Dashboard
            </Button>
            <Button onClick={onReattempt} className="w-auto px-4">
              <RotateCcw className="h-4 w-4 mr-2" /> Reattempt
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
        
        {/* Toggle View */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm inline-flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Performance Overview
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'review' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Question Review
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* 1. Immediate Result Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Score Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 ${result.status === 'PASS' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <h3 className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-4">Total Score</h3>
                
                <div className="relative h-40 w-40 flex items-center justify-center mb-4">
                   <svg className="h-full w-full transform -rotate-90">
                     <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                     <circle 
                        cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        className={result.status === 'PASS' ? 'text-green-500' : 'text-red-500'}
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * result.percentage) / 100}
                        strokeLinecap="round"
                     />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-slate-800">{result.percentage.toFixed(0)}%</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase mt-1 ${result.status === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {result.status}
                      </span>
                   </div>
                </div>
                
                <div className="text-center">
                   <p className="text-slate-600 font-medium">
                     <span className="text-2xl font-bold text-slate-900">{result.totalScore}</span> / {result.maxScore} Marks
                   </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                 <div className="bg-green-50 rounded-xl p-6 border border-green-100 flex items-center justify-between">
                    <div>
                      <p className="text-green-800 font-medium mb-1">Correct Answers</p>
                      <p className="text-3xl font-black text-green-600">{result.correctCount}</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-200" />
                 </div>
                 <div className="bg-red-50 rounded-xl p-6 border border-red-100 flex items-center justify-between">
                    <div>
                      <p className="text-red-800 font-medium mb-1">Wrong Answers</p>
                      <p className="text-3xl font-black text-red-600">{result.wrongCount}</p>
                    </div>
                    <XCircle className="h-10 w-10 text-red-200" />
                 </div>
                 <div className="bg-slate-100 rounded-xl p-6 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-slate-700 font-medium mb-1">Unattempted</p>
                      <p className="text-3xl font-black text-slate-600">{result.unattemptedCount}</p>
                    </div>
                    <MinusCircle className="h-10 w-10 text-slate-300" />
                 </div>
                 <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 font-medium mb-1">Total Time</p>
                      <p className="text-2xl font-black text-blue-600">{formatTime(result.totalTimeSeconds)}</p>
                    </div>
                    <Clock className="h-10 w-10 text-blue-200" />
                 </div>
              </div>
            </div>

            {/* 3. Strength & Weakness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" /> Strong Areas
                  </h3>
                  {strengths.length > 0 ? (
                    <div className="space-y-3">
                      {strengths.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                          <span className="font-medium text-slate-700">{t.topic}</span>
                          <span className="font-bold text-green-700">{t.accuracy.toFixed(0)}% Accuracy</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">Keep practicing to build your strengths!</p>
                  )}
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" /> Areas for Improvement
                  </h3>
                  {weaknesses.length > 0 ? (
                    <div className="space-y-3">
                      {weaknesses.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <span className="font-medium text-slate-700">{t.topic}</span>
                          <span className="font-bold text-orange-700">{t.accuracy.toFixed(0)}% Accuracy</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">Great job! No weak areas detected.</p>
                  )}
               </div>
            </div>

            {/* 2. Subject Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <BarChart2 className="h-5 w-5 text-blue-600" />
                   Subject-wise Performance
                 </h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                     <tr>
                       <th className="px-6 py-3">Topic</th>
                       <th className="px-6 py-3">Questions</th>
                       <th className="px-6 py-3">Correct</th>
                       <th className="px-6 py-3">Wrong</th>
                       <th className="px-6 py-3">Accuracy</th>
                       <th className="px-6 py-3">Avg Time/Q</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {result.topicAnalysis.map((topic, idx) => (
                       <tr key={idx} className="hover:bg-slate-50">
                         <td className="px-6 py-4 font-medium text-slate-800">{topic.topic}</td>
                         <td className="px-6 py-4">{topic.totalQuestions}</td>
                         <td className="px-6 py-4 text-green-600 font-bold">{topic.correct}</td>
                         <td className="px-6 py-4 text-red-600 font-bold">{topic.wrong}</td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className="w-16 bg-slate-200 rounded-full h-1.5">
                               <div 
                                 className={`h-1.5 rounded-full ${topic.accuracy >= 75 ? 'bg-green-500' : topic.accuracy >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                 style={{ width: `${topic.accuracy}%` }}
                               ></div>
                             </div>
                             <span className="text-xs font-medium">{topic.accuracy.toFixed(0)}%</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-slate-500">
                           {topic.totalQuestions > 0 
                              ? formatTime(Math.round(topic.timeSpent / topic.totalQuestions)) 
                              : '0s'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" className="w-auto border-blue-200 text-blue-700 bg-white">
                <Download className="h-4 w-4 mr-2" /> Download Report
              </Button>
              <Button variant="outline" className="w-auto border-blue-200 text-blue-700 bg-white">
                <Share2 className="h-4 w-4 mr-2" /> Share Result
              </Button>
            </div>
          </>
        )}

        {/* 4. Question Wise Review Tab */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 justify-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
               {['ALL', 'CORRECT', 'WRONG', 'UNATTEMPTED'].map((filter) => (
                 <button
                   key={filter}
                   onClick={() => setReviewFilter(filter as any)}
                   className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                     ${reviewFilter === filter 
                       ? 'bg-slate-800 text-white shadow' 
                       : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                     }
                   `}
                 >
                   {filter}
                 </button>
               ))}
            </div>

            {/* List */}
            <div className="space-y-4">
               {filteredAnswers.map((ans, idx) => {
                 const isExpanded = expandedQuestion === ans.questionId;
                 return (
                   <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div 
                       className="p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                       onClick={() => setExpandedQuestion(isExpanded ? null : ans.questionId)}
                     >
                       <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border-2 
                         ${ans.isCorrect ? 'border-green-500 bg-green-50 text-green-600' : 
                           ans.selectedOption === null ? 'border-slate-300 bg-slate-50 text-slate-400' : 
                           'border-red-500 bg-red-50 text-red-600'
                         }`}
                       >
                         {ans.isCorrect ? <CheckCircle className="h-5 w-5" /> : 
                          ans.selectedOption === null ? <MinusCircle className="h-5 w-5" /> : 
                          <XCircle className="h-5 w-5" />}
                       </div>
                       
                       <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="font-medium text-slate-800 text-sm sm:text-base pr-4">
                               <span className="font-bold text-slate-400 mr-2">Q{idx + 1}.</span>
                               {ans.questionText}
                             </h4>
                             {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                          </div>
                          
                          <div className="flex gap-3 text-xs">
                             <span className={`px-2 py-0.5 rounded border ${
                               ans.difficulty === 'Easy' ? 'bg-green-50 border-green-100 text-green-700' :
                               ans.difficulty === 'Medium' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                               'bg-orange-50 border-orange-100 text-orange-700'
                             }`}>
                               {ans.difficulty}
                             </span>
                             <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                               {ans.topic}
                             </span>
                             <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${ans.timeSpentSeconds > 120 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                               <Clock className="h-3 w-3" /> {ans.timeSpentSeconds}s
                             </span>
                          </div>
                       </div>
                     </div>

                     {isExpanded && (
                       <div className="border-t border-slate-100 bg-slate-50 p-6 animate-slideUp">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                               <p className="text-xs font-bold text-slate-400 uppercase mb-2">Your Answer</p>
                               <div className={`p-3 rounded-lg border ${
                                  ans.isCorrect ? 'bg-green-100 border-green-200 text-green-800' : 
                                  ans.selectedOption ? 'bg-red-100 border-red-200 text-red-800' : 
                                  'bg-slate-200 border-slate-300 text-slate-500 italic'
                               }`}>
                                 {ans.selectedOption || "Not Attempted"}
                               </div>
                            </div>
                            <div>
                               <p className="text-xs font-bold text-slate-400 uppercase mb-2">Correct Answer</p>
                               <div className="p-3 rounded-lg bg-green-100 border border-green-200 text-green-800 font-medium">
                                 {ans.correctOption}
                               </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                             <h5 className="flex items-center gap-2 font-bold text-blue-700 mb-2">
                               <Brain className="h-4 w-4" /> Explanation
                             </h5>
                             <div className="text-slate-700 text-sm leading-relaxed">
                               <FormattedText text={ans.explanation} />
                             </div>
                          </div>
                       </div>
                     )}
                   </div>
                 );
               })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};