import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { InputField } from './InputField';
import { analyzePDF } from '../utils/gemini';
import { savePDFToLibrary, getPDFLibrary, deletePDFFromLibrary } from '../utils/storage';
import { ExtractedData, Question, TestConfig, TestMode, SavedPDF } from '../types';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  BrainCircuit, 
  ArrowRight, 
  ArrowLeft,
  Save,
  Loader2,
  Edit2,
  Settings,
  Clock,
  Target,
  Zap,
  BookOpen,
  GraduationCap,
  Sliders,
  Library,
  Trash2,
  ScanSearch,
  FileSignature,
  Layers,
  Cpu,
  Gauge
} from 'lucide-react';

interface CreateTestFlowProps {
  onBack: () => void;
  onSave: (config: TestConfig, questions: Question[]) => void;
}

type Step = 'UPLOAD' | 'ANALYSIS' | 'REVIEW' | 'CONFIGURE';

export const CreateTestFlow: React.FC<CreateTestFlowProps> = ({ onBack, onSave }) => {
  const [step, setStep] = useState<Step>('UPLOAD');
  const [uploadTab, setUploadTab] = useState<'NEW' | 'LIBRARY'>('NEW');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPDFs, setSavedPDFs] = useState<SavedPDF[]>([]);

  // Editing State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Configuration State
  const [testName, setTestName] = useState('');
  const [numQuestions, setNumQuestions] = useState(0);
  const [duration, setDuration] = useState(60);
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState<('Easy' | 'Medium' | 'Hard')[]>(['Easy', 'Medium', 'Hard']);
  const [testMode, setTestMode] = useState<TestMode>('PRACTICE');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(false);

  // Load library on mount
  useEffect(() => {
    setSavedPDFs(getPDFLibrary());
  }, []);

  // Auto-generate test name and set max questions on data load
  useEffect(() => {
    if (extractedData) {
      const date = new Date();
      const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
      setTestName(`Test_${timestamp}`);
      setNumQuestions(extractedData.questions.length);
    }
  }, [extractedData]);

  // File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    setError(null);
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    // 200MB limit check
    if (f.size > 200 * 1024 * 1024) {
      setError('File size exceeds the 200MB limit.');
      return;
    }
    setFile(f);
  };

  // Processing Handler
  const processFile = async () => {
    if (!file) return;
    
    setStep('ANALYSIS');
    setIsProcessing(true);
    setProgressMsg('Preparing document...');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          const data = await analyzePDF(base64Data, file.type, (msg) => setProgressMsg(msg));
          
          // Auto-save to library
          const newPDF: SavedPDF = {
            id: Date.now().toString(),
            fileName: file.name,
            uploadDate: new Date().toISOString(),
            data: data
          };
          savePDFToLibrary(newPDF);
          
          setExtractedData(data);
          setStep('REVIEW');
        } catch (err) {
          setError('Failed to analyze PDF. Please try again.');
          setStep('UPLOAD');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setError('Error reading file.');
        setIsProcessing(false);
        setStep('UPLOAD');
      };
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsProcessing(false);
      setStep('UPLOAD');
    }
  };

  const handleSelectFromLibrary = (pdf: SavedPDF) => {
    setExtractedData(pdf.data);
    setStep('REVIEW'); // Skip analysis
  };

  const handleDeleteFromLibrary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Remove this PDF from library?")) {
      deletePDFFromLibrary(id);
      setSavedPDFs(prev => prev.filter(p => p.id !== id));
    }
  };

  // Edit Handlers
  const handleSaveEdit = () => {
    if (extractedData && editingQuestion) {
      const updatedQuestions = extractedData.questions.map(q => 
        q.id === editingQuestion.id ? editingQuestion : q
      );
      setExtractedData({
        ...extractedData,
        questions: updatedQuestions
      });
      setEditingQuestion(null);
    }
  };

  // Filter logic for max questions based on difficulty
  const maxAvailableQuestions = extractedData 
    ? extractedData.questions.filter(q => selectedDifficulties.includes(q.difficulty)).length 
    : 0;

  // Ensure numQuestions doesn't exceed available
  useEffect(() => {
    if (numQuestions > maxAvailableQuestions) {
      setNumQuestions(maxAvailableQuestions);
    }
  }, [selectedDifficulties, maxAvailableQuestions]);

  const handleCreateTest = () => {
    if (!extractedData) return;
    
    const config: TestConfig = {
      testName,
      questionCount: numQuestions,
      durationMinutes: noTimeLimit ? 0 : duration,
      difficulties: selectedDifficulties,
      mode: testMode,
      shuffleQuestions,
      shuffleOptions,
      negativeMarking
    };

    onSave(config, extractedData.questions);
  };

  const toggleDifficulty = (diff: 'Easy' | 'Medium' | 'Hard') => {
    if (selectedDifficulties.includes(diff)) {
      if (selectedDifficulties.length > 1) { // Prevent unselecting last one
        setSelectedDifficulties(prev => prev.filter(d => d !== diff));
      }
    } else {
      setSelectedDifficulties(prev => [...prev, diff]);
    }
  };

  // Review Components
  const DifficultyBadge = ({ level }: { level: string }) => {
    const colors = {
      Easy: 'bg-green-100 text-green-800 border-green-200',
      Medium: 'bg-blue-100 text-blue-800 border-blue-200',
      Hard: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[level as keyof typeof colors] || colors.Easy}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Create New Test</h2>
            <p className="text-xs text-slate-500">Step {step === 'UPLOAD' ? 1 : step === 'ANALYSIS' ? 2 : step === 'REVIEW' ? 3 : 4} of 4</p>
          </div>
        </div>
        
        {/* Progress Stepper */}
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className={`px-3 py-1 rounded-full transition-all ${step === 'UPLOAD' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>1. Upload</span>
          <div className="w-4 h-px bg-slate-300"></div>
          <span className={`px-3 py-1 rounded-full transition-all ${step === 'ANALYSIS' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>2. Analyze</span>
          <div className="w-4 h-px bg-slate-300"></div>
          <span className={`px-3 py-1 rounded-full transition-all ${step === 'REVIEW' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>3. Review</span>
          <div className="w-4 h-px bg-slate-300"></div>
          <span className={`px-3 py-1 rounded-full transition-all ${step === 'CONFIGURE' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>4. Config</span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        
        {/* STEP 1: UPLOAD / LIBRARY */}
        {step === 'UPLOAD' && (
          <div className="h-full flex flex-col max-w-3xl mx-auto p-6 animate-fadeIn">
            
            <div className="flex justify-center mb-8">
               <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                  <button 
                    onClick={() => setUploadTab('NEW')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${uploadTab === 'NEW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <UploadCloud className="h-4 w-4 inline-block mr-2" /> Upload New
                  </button>
                  <button 
                    onClick={() => setUploadTab('LIBRARY')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${uploadTab === 'LIBRARY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Library className="h-4 w-4 inline-block mr-2" /> My Library
                  </button>
               </div>
            </div>

            {uploadTab === 'NEW' ? (
              <div className="flex-1 flex flex-col justify-center">
                <div 
                  className={`
                    border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 bg-slate-50
                    ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300 hover:border-blue-400'}
                    ${file ? 'border-green-400 bg-green-50' : ''}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {!file ? (
                    <>
                      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-medium text-slate-700 mb-2">Drag & Drop your PDF here</p>
                      <p className="text-sm text-slate-500 mb-6">or click to browse files (Max 200MB)</p>
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileSelect} />
                        <span className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                          Browse Files
                        </span>
                      </label>
                    </>
                  ) : (
                    <div className="text-center w-full">
                      <div className="mx-auto h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mb-3 text-green-600">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-bold text-slate-800 truncate px-4">{file.name}</p>
                      <p className="text-sm text-slate-500 mb-6">{(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Ready</p>
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => setFile(null)}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                        <Button onClick={processFile} className="w-auto px-6">
                          Analyze PDF <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-200">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="mt-8 text-center text-xs text-slate-400">
                  <p>Supported Format: PDF only (Digital & Scanned).</p>
                  <p>Large files will be processed using high-memory AI models.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                {savedPDFs.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Library className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-600">Library is Empty</h3>
                    <p className="text-slate-400 text-sm">Upload and analyze PDFs to save them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedPDFs.map(pdf => (
                      <div key={pdf.id} onClick={() => handleSelectFromLibrary(pdf)} className="bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group relative">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600 flex-shrink-0">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 truncate text-sm">{pdf.fileName}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(pdf.uploadDate).toLocaleDateString()} • {pdf.data.summary.totalQuestions} Qs
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteFromLibrary(pdf.id, e)}
                          className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-600 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PROCESSING */}
        {step === 'ANALYSIS' && (
          <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn p-6">
             <div className="relative mb-8">
               <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
               <div className="relative bg-white p-6 rounded-full shadow-lg border-4 border-blue-50">
                 <BrainCircuit className="h-16 w-16 text-blue-600 animate-pulse" />
               </div>
             </div>
             
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Document</h3>
             <p className="text-slate-500 mb-8 max-w-md">
               Step 1: Auditing Complexity & OCR Quality...<br/>
               Step 2: Routing to Optimal AI Model...
             </p>

             <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
               <div className="bg-blue-600 h-2.5 rounded-full animate-progress w-2/3"></div>
             </div>
             
             <p className="text-sm font-medium text-blue-600 animate-pulse">{progressMsg}</p>
          </div>
        )}

        {/* STEP 3: REVIEW & EDIT */}
        {step === 'REVIEW' && extractedData && (
          <div className="h-full flex flex-col animate-fadeIn">
            {/* Audit & Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 px-6 pt-6 flex-shrink-0">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-500 font-bold uppercase">Total Questions</p>
                <p className="text-2xl font-black text-blue-700">{extractedData.summary.totalQuestions}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-500 font-bold uppercase">Complexity / Quality</p>
                <div className="flex items-center gap-1">
                   <span className="text-sm font-bold text-emerald-700">{extractedData.audit?.content_complexity || 'N/A'}</span>
                   <span className="text-emerald-400 text-xs">•</span>
                   <span className="text-sm font-bold text-emerald-700">{extractedData.audit?.ocr_quality || 'N/A'}</span>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-500 font-bold uppercase">AI Model Used</p>
                <div className="flex items-center gap-1 mt-1">
                   {extractedData.audit?.recommended_model === 'GEMINI_PRO' ? <Cpu className="h-4 w-4 text-purple-600" /> : <Zap className="h-4 w-4 text-purple-600" />}
                   <p className="text-sm font-bold text-purple-700 truncate" title={extractedData.audit?.recommended_model}>
                      {extractedData.audit?.recommended_model === 'GEMINI_PRO' ? 'Gemini Pro' : 'Gemini Flash'}
                   </p>
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <p className="text-xs text-orange-500 font-bold uppercase">Extraction Speed</p>
                <div className="flex items-center gap-1 mt-1">
                   <Gauge className="h-4 w-4 text-orange-600" />
                   <p className="text-sm font-bold text-orange-700">Optimized</p>
                </div>
              </div>
            </div>

            {/* Audit details snippet if available */}
            {extractedData.audit && (
              <div className="px-6 mb-4">
                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                       <span className={`w-2 h-2 rounded-full ${extractedData.audit.content_complexity === 'HIGH' ? 'bg-red-500' : 'bg-green-500'}`}></span> 
                       Complexity: {extractedData.audit.content_complexity}
                    </span>
                    <span className="flex items-center gap-1">
                       <span className={`w-2 h-2 rounded-full ${extractedData.audit.ocr_quality === 'POOR' ? 'bg-orange-500' : 'bg-green-500'}`}></span> 
                       Quality: {extractedData.audit.ocr_quality}
                    </span>
                 </div>
              </div>
            )}

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-20">
              {extractedData.questions.map((q, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                       <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                         {idx + 1}
                       </span>
                       <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 px-2 py-0.5 rounded">
                         {q.topic}
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <DifficultyBadge level={q.difficulty} />
                       <button 
                         onClick={() => setEditingQuestion(q)}
                         className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                         title="Edit Question"
                       >
                         <Edit2 className="h-4 w-4" />
                       </button>
                     </div>
                  </div>
                  
                  <p className="text-slate-800 font-medium mb-4">{q.text}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`text-sm p-2 rounded border ${
                        opt.includes(q.answer) || q.answer.includes(opt)
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-white border-slate-100 text-slate-600'
                      }`}>
                        {opt}
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 border border-slate-100">
                    <span className="font-bold text-slate-700">Explanation:</span> {q.explanation || 'No explanation provided.'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Sticky Action Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between items-center z-10">
              <span className="text-sm text-slate-500">
                {extractedData.questions.length} questions extracted
              </span>
              <div className="flex gap-3">
                 <Button variant="outline" onClick={() => setStep('UPLOAD')} className="w-auto">
                   Re-upload
                 </Button>
                 <Button onClick={() => setStep('CONFIGURE')} className="w-auto px-6">
                   Next: Configure Test <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIGURE */}
        {step === 'CONFIGURE' && extractedData && (
           <div className="h-full flex flex-col animate-fadeIn overflow-y-auto">
             <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8 pb-24">
                {/* ... Existing configuration UI ... */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <FileText className="h-5 w-5 text-blue-600" />
                     Test Details
                   </h3>
                   <InputField 
                     id="testName" 
                     label="Test Name" 
                     value={testName} 
                     onChange={(e) => setTestName(e.target.value)} 
                     placeholder="Enter a unique name for this test"
                   />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="space-y-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                           <Sliders className="h-4 w-4 text-slate-500" />
                           Question Count
                        </h3>
                        <div className="mb-6">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Total Questions</span>
                            <span className="text-sm font-bold text-blue-600">{numQuestions}</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max={maxAvailableQuestions} 
                            value={numQuestions} 
                            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <p className="text-xs text-slate-500 mt-2 text-right">Max available: {maxAvailableQuestions}</p>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                           <Clock className="h-4 w-4 text-slate-500" />
                           Timer Settings
                        </h3>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-slate-700">Duration</label>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={noTimeLimit} 
                                  onChange={(e) => setNoTimeLimit(e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                <span className="text-sm text-slate-600">No Time Limit</span>
                              </div>
                           </div>
                           
                           {!noTimeLimit && (
                             <select 
                               value={duration} 
                               onChange={(e) => setDuration(parseInt(e.target.value))}
                               className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                             >
                               <option value="15">15 Minutes</option>
                               <option value="30">30 Minutes</option>
                               <option value="45">45 Minutes</option>
                               <option value="60">60 Minutes (1 Hour)</option>
                               <option value="90">90 Minutes (1.5 Hours)</option>
                               <option value="120">120 Minutes (2 Hours)</option>
                             </select>
                           )}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                           <Target className="h-4 w-4 text-slate-500" />
                           Difficulty Level
                        </h3>
                        <div className="flex flex-wrap gap-3">
                           {['Easy', 'Medium', 'Hard'].map((diff) => {
                             const count = extractedData.questions.filter(q => q.difficulty === diff).length;
                             const isSelected = selectedDifficulties.includes(diff as any);
                             return (
                               <button
                                 key={diff}
                                 onClick={() => toggleDifficulty(diff as any)}
                                 className={`
                                   flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all
                                   ${isSelected 
                                     ? diff === 'Easy' ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-500' 
                                     : diff === 'Medium' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500'
                                     : 'bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-500'
                                     : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                   }
                                 `}
                               >
                                 <div className="flex justify-between items-center mb-1">
                                    <span>{diff}</span>
                                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                 </div>
                                 <div className="text-xs opacity-80">{count} Qs</div>
                               </button>
                             )
                           })}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                           <Zap className="h-4 w-4 text-slate-500" />
                           Test Mode
                         </h3>
                         <div className="space-y-3">
                            <div 
                              onClick={() => setTestMode('PRACTICE')}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${testMode === 'PRACTICE' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
                            >
                               <div className="flex items-center gap-3 mb-2">
                                  <div className={`p-2 rounded-full ${testMode === 'PRACTICE' ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <BookOpen className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${testMode === 'PRACTICE' ? 'text-indigo-900' : 'text-slate-700'}`}>Practice Mode</h4>
                                    <p className="text-xs text-slate-500">Instant feedback, explanations, no pressure</p>
                                  </div>
                               </div>
                            </div>

                            <div 
                              onClick={() => setTestMode('EXAM')}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${testMode === 'EXAM' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
                            >
                               <div className="flex items-center gap-3 mb-2">
                                  <div className={`p-2 rounded-full ${testMode === 'EXAM' ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <GraduationCap className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${testMode === 'EXAM' ? 'text-blue-900' : 'text-slate-700'}`}>Exam Mode</h4>
                                    <p className="text-xs text-slate-500">Timed, no help, final score submission</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                           <Settings className="h-4 w-4 text-slate-500" />
                           Additional Options
                         </h3>
                         <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                               <span className="text-sm text-slate-700">Shuffle Questions</span>
                               <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                               <span className="text-sm text-slate-700">Shuffle Options</span>
                               <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                               <span className="text-sm text-slate-700">Negative Marking (-0.25)</span>
                               <input type="checkbox" checked={negativeMarking} onChange={e => setNegativeMarking(e.target.checked)} className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                            </label>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Footer Actions */}
             <div className="fixed bottom-0 sm:absolute left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between items-center z-20 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <Button variant="secondary" onClick={() => onSave({
                  testName, 
                  questionCount: numQuestions, 
                  durationMinutes: noTimeLimit ? 0 : duration, 
                  difficulties: selectedDifficulties, 
                  mode: testMode, 
                  shuffleQuestions, 
                  shuffleOptions, 
                  negativeMarking
                }, extractedData.questions)} className="w-auto border border-blue-200">
                   Save as Draft
                </Button>
                <div className="flex gap-3">
                   <Button variant="outline" onClick={() => setStep('REVIEW')} className="w-auto">
                     Back
                   </Button>
                   <Button onClick={handleCreateTest} className="w-auto px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
                     <Save className="mr-2 h-4 w-4" /> CREATE TEST
                   </Button>
                </div>
             </div>
           </div>
        )}
      </div>

      {/* Editing Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" /> Edit Question
              </h3>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
                <textarea 
                  value={editingQuestion.text} 
                  onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer</label>
                  <input 
                    value={editingQuestion.answer}
                    onChange={(e) => setEditingQuestion({...editingQuestion, answer: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                  <input 
                    value={editingQuestion.topic}
                    onChange={(e) => setEditingQuestion({...editingQuestion, topic: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Options (One per line)</label>
                <textarea 
                  value={editingQuestion.options.join('\n')} 
                  onChange={(e) => setEditingQuestion({...editingQuestion, options: e.target.value.split('\n')})}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Explanation</label>
                <textarea 
                  value={editingQuestion.explanation} 
                  onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <Button variant="outline" onClick={() => setEditingQuestion(null)} className="w-auto">Cancel</Button>
              <Button onClick={handleSaveEdit} className="w-auto">Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};