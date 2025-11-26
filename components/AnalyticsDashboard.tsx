import React, { useMemo } from 'react';
import { Button } from './Button';
import { getTestResults } from '../utils/storage';
import { TestResult } from '../types';
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  Zap,
  Activity,
  BarChart2,
  Brain,
  Timer,
  Users
} from 'lucide-react';

interface AnalyticsDashboardProps {
  onBack: () => void;
}

// --- Custom SVG Charts ---

const LineChart = ({ data }: { data: number[] }) => {
  const max = 100;
  const points = data.length > 1 
    ? data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (val / max) * 100;
        return `${x},${y}`;
      }).join(' ')
    : data.length === 1 
      ? `0,${100 - (data[0]/100)*100} 100,${100 - (data[0]/100)*100}`
      : "";

  if (data.length === 0) return <div className="h-48 w-full flex items-center justify-center text-slate-400 text-sm">No data available</div>;

  return (
    <div className="relative h-48 w-full">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
        ))}
        {/* Path */}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        {/* Dots */}
        {data.map((val, i) => {
          const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
          const y = 100 - (val / max) * 100;
          return (
             <g key={i} className="group">
                <circle cx={x} cy={y} r="1.5" className="fill-blue-600 stroke-white stroke-2 hover:r-2 transition-all" />
                <rect x={x - 10} y={y - 15} width="20" height="10" rx="2" fill="#1e293b" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                <text x={x} y={y - 8} textAnchor="middle" fontSize="4" fill="white" className="opacity-0 group-hover:opacity-100">{val}%</text>
             </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-slate-400 mt-2">
        <span>Oldest</span>
        <span>Newest</span>
      </div>
    </div>
  );
};

const RadarChart = ({ data }: { data: { subject: string; score: number }[] }) => {
  if (data.length < 3) return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Need at least 3 topics for radar chart</div>;

  const numPoints = data.length;
  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const x = centerX + (value / 100) * radius * Math.cos(angle);
    const y = centerY + (value / 100) * radius * Math.sin(angle);
    return { x, y };
  };

  const polyPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(d.score, i);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="h-64 w-full flex items-center justify-center relative">
       <svg width="250" height="250" viewBox="0 0 200 200" className="overflow-visible">
          {/* Background Grid */}
          {gridLevels.map(level => (
             <polygon
               key={level}
               points={data.map((_, i) => {
                 const { x, y } = getCoordinates(level, i);
                 return `${x},${y}`;
               }).join(' ')}
               fill="none"
               stroke="#e2e8f0"
               strokeWidth="1"
             />
          ))}
          {/* Axes */}
          {data.map((_, i) => {
             const { x, y } = getCoordinates(100, i);
             return <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
          })}
          {/* Data Shape */}
          <polygon
            points={polyPoints}
            fill="rgba(37, 99, 235, 0.2)"
            stroke="#2563eb"
            strokeWidth="2"
          />
          {/* Labels */}
          {data.map((d, i) => {
             const { x, y } = getCoordinates(115, i);
             return (
               <text 
                 key={i} 
                 x={x} 
                 y={y} 
                 textAnchor="middle" 
                 dominantBaseline="middle" 
                 className="text-[10px] font-bold fill-slate-500 uppercase"
                 fontSize="8"
               >
                 {d.subject.split(' ')[0]}
               </text>
             );
          })}
       </svg>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onBack }) => {
  const results = getTestResults();

  // Aggregates
  const totalTests = results.length;
  const avgScore = totalTests > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / totalTests) : 0;
  const totalTimeSeconds = results.reduce((acc, curr) => acc + curr.totalTimeSeconds, 0);
  const streak = totalTests > 0 ? 1 : 0; // Simple logic for now

  // Process Topic Mastery
  const topicMap = new Map<string, { total: number, score: number }>();
  results.forEach(r => {
    r.topicAnalysis.forEach(t => {
      const current = topicMap.get(t.topic) || { total: 0, score: 0 };
      topicMap.set(t.topic, { 
        total: current.total + t.totalQuestions, 
        score: current.score + t.correct 
      });
    });
  });
  
  const masteryData = Array.from(topicMap.entries()).map(([topic, data]) => ({
    subject: topic,
    score: data.total > 0 ? (data.score / data.total) * 100 : 0
  })).slice(0, 6); 

  // Process Time Analysis
  const timeMap = new Map<string, { totalTime: number, count: number }>();
  results.forEach(r => {
    r.topicAnalysis.forEach(t => {
      const current = timeMap.get(t.topic) || { totalTime: 0, count: 0 };
      timeMap.set(t.topic, {
        totalTime: current.totalTime + t.timeSpent,
        count: current.count + t.totalQuestions
      });
    });
  });

  const timeAnalysisData = Array.from(timeMap.entries()).map(([topic, data]) => ({
    subject: topic,
    avgTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
    idealTime: 60
  })).slice(0, 5);

  const formatTime = (seconds: number) => {
     const h = Math.floor(seconds / 3600);
     const m = Math.floor((seconds % 3600) / 60);
     return `${h}h ${m}m`;
  };

  // Mock Peer Data Calculation
  const peerAvg = 68; // Mock average
  const yourPercentile = Math.min(99, Math.max(1, Math.round((avgScore / 100) * 100 + (Math.random() * 10 - 5))));

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
               <BarChart2 className="h-6 w-6 text-indigo-600" />
               Performance Analytics
             </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
             <Calendar className="h-4 w-4" />
             Lifetime
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
         
         {/* 1. Overview Cards */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Target className="h-5 w-5" /></div>
               </div>
               <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Tests</p>
                  <p className="text-2xl font-black text-slate-800">{totalTests}</p>
               </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Award className="h-5 w-5" /></div>
               </div>
               <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Avg. Score</p>
                  <p className="text-2xl font-black text-slate-800">{avgScore}%</p>
               </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock className="h-5 w-5" /></div>
               </div>
               <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Study Time</p>
                  <p className="text-2xl font-black text-slate-800">{formatTime(totalTimeSeconds)}</p>
               </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><Zap className="h-5 w-5" /></div>
               </div>
               <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Current Streak</p>
                  <p className="text-2xl font-black text-slate-800">{streak} Days</p>
               </div>
            </div>
         </div>

         {results.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 border-dashed p-12 text-center">
              <p className="text-slate-500 font-medium">No test data available yet. Take a test to see analytics!</p>
            </div>
         ) : (
           <>
             {/* Peer Comparison (Simulated) */}
             <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                         <Users className="h-5 w-5" /> Peer Comparison
                      </h3>
                      <p className="text-indigo-100 text-sm mb-4">Compare your performance with thousands of other aspirants.</p>
                   </div>
                   <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">SSC CGL Rank</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                   <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                      <p className="text-indigo-200 text-xs font-bold uppercase">Your Percentile</p>
                      <p className="text-3xl font-black">{yourPercentile}th</p>
                      <p className="text-xs text-indigo-200 mt-1">Top {100 - yourPercentile}% of students</p>
                   </div>
                   <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                      <p className="text-indigo-200 text-xs font-bold uppercase">Avg. Peer Score</p>
                      <p className="text-3xl font-black">{peerAvg}%</p>
                      <p className="text-xs text-indigo-200 mt-1">You are {avgScore > peerAvg ? 'Ahead' : 'Behind'}</p>
                   </div>
                   <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10 relative overflow-hidden">
                      <p className="text-indigo-200 text-xs font-bold uppercase">Predicted Rank</p>
                      <p className="text-3xl font-black">#{Math.floor(10000 * (1 - yourPercentile/100)) + 1}</p>
                      <div className="absolute -bottom-2 -right-2">
                         <TrendingUp className="h-16 w-16 text-white/10" />
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Performance Trends (Line Chart) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" /> Performance Trend
                   </h3>
                   <div className="pl-2">
                     <LineChart data={results.map(t => t.percentage).reverse()} />
                   </div>
                </div>

                {/* 3. Subject Mastery (Radar Chart) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                   <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 w-full">
                      <Brain className="h-5 w-5 text-purple-600" /> Subject Mastery
                   </h3>
                   <RadarChart data={masteryData} />
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* 4. Time Management Analysis */}
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Timer className="h-5 w-5 text-orange-600" /> Time Management
                       </h3>
                       <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Your Time</div>
                          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-300 rounded-sm"></span> Ideal Time</div>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       {timeAnalysisData.map((item, idx) => (
                          <div key={idx}>
                             <div className="flex justify-between text-xs mb-1 font-medium text-slate-600">
                                <span>{item.subject}</span>
                                <span>{item.avgTime}s / {item.idealTime}s</span>
                             </div>
                             <div className="h-6 w-full bg-slate-100 rounded-full relative overflow-hidden">
                                {/* Ideal Marker */}
                                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" style={{ left: '60%' }}></div>
                                {/* Actual Bar */}
                                <div 
                                   className={`h-full rounded-full ${item.avgTime > item.idealTime ? 'bg-orange-400' : 'bg-blue-500'}`} 
                                   style={{ width: `${Math.min((item.avgTime / 100) * 100, 100)}%` }}
                                ></div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* 5. Difficulty Progression */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                       <Activity className="h-5 w-5 text-red-600" /> Difficulty Analysis
                    </h3>
                    <div className="space-y-6">
                       {[
                         { level: 'Easy', color: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-700' },
                         { level: 'Medium', color: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-700' },
                         { level: 'Hard', color: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-700' }
                       ].map((d, i) => {
                          // Calculate accuracy per difficulty from all results
                          let correct = 0;
                          let total = 0;
                          results.forEach(r => {
                            r.answers.forEach(a => {
                               if (a.difficulty === d.level) {
                                  total++;
                                  if (a.isCorrect) correct++;
                               }
                            });
                          });
                          const acc = total > 0 ? Math.round((correct/total) * 100) : 0;
                          
                          return (
                            <div key={i}>
                               <div className="flex justify-between mb-2 text-sm font-bold">
                                  <span className={d.text}>{d.level}</span>
                                  <span className="text-slate-600">{acc}% Accuracy</span>
                               </div>
                               <div className={`w-full h-3 ${d.bg} rounded-full`}>
                                  <div className={`h-3 rounded-full ${d.color}`} style={{ width: `${acc}%` }}></div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                    
                    <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                       <p className="text-xs text-blue-800 leading-relaxed">
                          <strong>Insight:</strong> Consistent practice on higher difficulty questions will improve your percentile score.
                       </p>
                    </div>
                 </div>
             </div>
           </>
         )}

         {/* 6. Recent Activity Table */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Recent Activity</h3>
            </div>
            {results.length === 0 ? (
               <div className="p-6 text-center text-slate-500">No recent activity.</div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                           <th className="px-6 py-3 font-bold">Date</th>
                           <th className="px-6 py-3 font-bold">Test Name</th>
                           <th className="px-6 py-3 font-bold">Mode</th>
                           <th className="px-6 py-3 font-bold">Score</th>
                           <th className="px-6 py-3 font-bold">Time</th>
                           <th className="px-6 py-3 font-bold">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {results.slice(0, 5).map((test) => (
                           <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-slate-600">{new Date(test.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{test.testName}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${test.mode === 'EXAM' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                    {test.mode}
                                 </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-800">{test.percentage.toFixed(0)}%</td>
                              <td className="px-6 py-4 text-slate-500 font-mono">{Math.floor(test.totalTimeSeconds/60)}m</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${test.percentage >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {test.status}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};