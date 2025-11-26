import React, { useState, useEffect } from 'react';
import { TestResult, TestMode } from '../types';
import { getTestResults, deleteTestResult, exportHistoryToCSV } from '../utils/storage';
import { Button } from './Button';
import {
  Search,
  Calendar,
  Filter,
  Download,
  Trash2,
  Eye,
  RotateCcw,
  Share2,
  ArrowLeft,
  CheckSquare,
  Square,
  BarChart2,
  FileText,
  Clock,
  MoreVertical,
  X
} from 'lucide-react';

interface TestHistoryProps {
  onBack: () => void;
  onViewResult: (result: TestResult) => void;
  onReattempt: () => void; // Simplify: just redirect to create flow in this demo
}

export const TestHistory: React.FC<TestHistoryProps> = ({ onBack, onViewResult, onReattempt }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'PRACTICE' | 'EXAM'>('ALL');
  const [sortOrder, setSortOrder] = useState<'DATE_DESC' | 'DATE_ASC' | 'SCORE_DESC' | 'SCORE_ASC'>('DATE_DESC');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    setResults(getTestResults());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this test record?')) {
      deleteTestResult(id);
      setResults(prev => prev.filter(r => r.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCSV = () => {
    const csvContent = exportHistoryToCSV(results);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ripka_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort Logic
  const filteredResults = results
    .filter(r => {
      const matchesSearch = r.testName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMode = modeFilter === 'ALL' || r.mode === modeFilter;
      return matchesSearch && matchesMode;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'DATE_ASC': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'SCORE_DESC': return b.percentage - a.percentage;
        case 'SCORE_ASC': return a.percentage - b.percentage;
        case 'DATE_DESC': 
        default: return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Comparison Data
  const compareData = results.filter(r => selectedIds.has(r.id));

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
               <Calendar className="h-6 w-6 text-orange-600" />
               Test History
             </h1>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 1 && (
              <Button onClick={() => setShowCompareModal(true)} className="w-auto px-4 bg-indigo-600 hover:bg-indigo-700 animate-fadeIn">
                <BarChart2 className="h-4 w-4 mr-2" /> Compare ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" onClick={handleExportCSV} className="hidden sm:flex w-auto px-4">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
        
        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
           <div className="relative w-full md:w-96">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by test name..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
             />
           </div>
           
           <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
             <select 
               value={modeFilter} 
               onChange={(e) => setModeFilter(e.target.value as any)}
               className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-blue-500"
             >
               <option value="ALL">All Modes</option>
               <option value="PRACTICE">Practice</option>
               <option value="EXAM">Exam</option>
             </select>

             <select 
               value={sortOrder} 
               onChange={(e) => setSortOrder(e.target.value as any)}
               className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-blue-500"
             >
               <option value="DATE_DESC">Newest First</option>
               <option value="DATE_ASC">Oldest First</option>
               <option value="SCORE_DESC">High Score</option>
               <option value="SCORE_ASC">Low Score</option>
             </select>
           </div>
        </div>

        {/* History Cards Grid */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No records found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your filters or take a new test.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((result) => (
              <div 
                key={result.id} 
                onClick={() => onViewResult(result)}
                className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md relative overflow-hidden group
                  ${selectedIds.has(result.id) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'}
                `}
              >
                {/* Selection Checkbox */}
                <div 
                  onClick={(e) => handleToggleSelect(result.id, e)}
                  className="absolute top-4 left-4 z-10 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {selectedIds.has(result.id) ? <CheckSquare className="h-5 w-5 text-blue-600 fill-blue-50" /> : <Square className="h-5 w-5" />}
                </div>

                {/* Card Content */}
                <div className="p-6 pt-10">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 line-clamp-1 mb-1" title={result.testName}>{result.testName}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(result.date)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border 
                        ${result.mode === 'EXAM' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}
                      `}>
                        {result.mode}
                      </span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Score</span>
                         <span className={`text-xl font-black ${result.percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                           {result.percentage.toFixed(0)}%
                         </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Time</span>
                         <span className="text-xl font-black text-slate-700">
                           {formatTime(result.totalTimeSeconds)}
                         </span>
                      </div>
                   </div>

                   <div className="flex gap-2">
                      <Button variant="outline" className="text-xs h-8" onClick={(e) => { e.stopPropagation(); onViewResult(result); }}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button variant="outline" className="text-xs h-8 text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200" onClick={(e) => handleDelete(result.id, e)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-indigo-600" /> Comparison View
              </h3>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border-b-2 border-slate-100 bg-slate-50 text-slate-500 uppercase font-bold text-xs sticky top-0 left-0 z-10">Metric</th>
                    {compareData.map(d => (
                      <th key={d.id} className="p-3 border-b-2 border-slate-100 bg-white min-w-[180px]">
                        <div className="font-bold text-slate-800 line-clamp-1">{d.testName}</div>
                        <div className="text-xs text-slate-500 font-normal">{formatDate(d.date)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Total Score', key: 'percentage', format: (v: any) => `${v.toFixed(0)}%` },
                    { label: 'Status', key: 'status', format: (v: any) => v },
                    { label: 'Correct Answers', key: 'correctCount', format: (v: any) => v },
                    { label: 'Wrong Answers', key: 'wrongCount', format: (v: any) => v },
                    { label: 'Time Taken', key: 'totalTimeSeconds', format: (v: any) => formatTime(v) },
                    { label: 'Accuracy', key: 'percentage', format: (v: any) => `${v.toFixed(1)}%` },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 border-b border-slate-100 font-medium text-slate-600 bg-slate-50">{row.label}</td>
                      {compareData.map(d => (
                        <td key={d.id} className="p-3 border-b border-slate-100 font-bold text-slate-800">
                          {row.format((d as any)[row.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <Button onClick={() => setShowCompareModal(false)} className="w-auto px-6">Close Comparison</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};