import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisCard } from './components/AnalysisCard';
import { PdfViewer } from './components/PdfViewer';
import { analyzePaper, translateAnalysis } from './services/geminiService';
import { AnalysisState, PaperAnalysis } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    data: null,
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Translation state
  const [translatedData, setTranslatedData] = useState<PaperAnalysis | null>(null);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Cleanup object URL when component unmounts or url changes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFileSelect = async (file: File) => {
    // Reset previous states
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setTranslatedData(null);
    setLanguage('en');
    
    // Create URL for preview
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setFileName(file.name);
    
    // Start analysis
    setState({ isLoading: true, error: null, data: null });

    try {
      const data = await analyzePaper(file);
      setState({ isLoading: false, error: null, data });
    } catch (err: any) {
      console.error(err);
      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      if (err.message?.includes("API Key")) {
        errorMessage = "Missing API Key. Please verify your settings.";
      }
      setState({ isLoading: false, error: errorMessage, data: null });
    }
  };

  const handleReset = () => {
    setState({ isLoading: false, error: null, data: null });
    setFileName(null);
    setPdfUrl(null);
    setTranslatedData(null);
    setLanguage('en');
  };

  const handleLanguageToggle = async (targetLang: 'en' | 'zh') => {
    if (targetLang === language) return;

    if (targetLang === 'zh' && !translatedData && state.data) {
      setIsTranslating(true);
      try {
        const result = await translateAnalysis(state.data);
        setTranslatedData(result);
        setLanguage('zh');
      } catch (err) {
        console.error("Translation failed:", err);
        alert("Translation failed. Please try again.");
      } finally {
        setIsTranslating(false);
      }
    } else {
      setLanguage(targetLang);
    }
  };

  const currentAnalysis = language === 'zh' && translatedData ? translatedData : state.data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
             </div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
               PaperInsight AI
             </h1>
          </div>
          {pdfUrl && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-indigo-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Analyze New Paper</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${pdfUrl ? 'max-w-[1920px]' : 'max-w-5xl'}`}>
        
        {/* Landing View (No PDF selected) */}
        {!pdfUrl && (
          <div className="mt-12">
            <div className="text-center mb-16 animate-fade-in-down">
                <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                    Research <span className="text-indigo-600">Simplified</span>
                </h2>
                <p className="max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed">
                    Upload your research paper PDF. Our AI reads it instantly and highlights the problem, innovations, and key comparisons—so you don't have to.
                </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isLoading={state.isLoading} />
          </div>
        )}

        {/* Split View (PDF Selected) */}
        {pdfUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)] min-h-[600px]">
            
            {/* Left Column: PDF Viewer */}
            <div className="h-full flex flex-col">
               <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-lg font-semibold text-slate-700 flex items-center space-x-2 truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate" title={fileName || 'Document'}>{fileName}</span>
                  </h3>
               </div>
               <div className="flex-grow">
                 <PdfViewer url={pdfUrl} />
               </div>
            </div>

            {/* Right Column: Analysis Results */}
            <div className="h-full flex flex-col overflow-hidden">
               <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-lg font-semibold text-slate-700 flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>AI Analysis</span>
                  </h3>
                  
                  {/* Translation Toggle */}
                  {state.data && (
                    <div className="flex bg-slate-200 p-1 rounded-lg">
                        <button
                            onClick={() => handleLanguageToggle('en')}
                            disabled={isTranslating}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                language === 'en' 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => handleLanguageToggle('zh')}
                            disabled={isTranslating}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1 ${
                                language === 'zh' 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {isTranslating && (
                                <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            <span>中文</span>
                        </button>
                    </div>
                  )}
               </div>
               
               <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 pb-4">
                  {/* Loading State */}
                  {state.isLoading && (
                    <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                      <div className="relative w-20 h-20 mb-6">
                         <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Analyzing Paper</h3>
                      <p className="text-slate-500 mt-2 text-center max-w-xs">
                        Reading the document and extracting key insights...
                      </p>
                    </div>
                  )}

                  {/* Error State */}
                  {state.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                         <h3 className="text-lg font-bold text-red-800">Analysis Failed</h3>
                         <p className="text-red-700 mt-1">{state.error}</p>
                         <button onClick={() => handleReset()} className="mt-4 text-sm font-medium text-red-600 hover:text-red-800 underline">
                           Please try uploading again
                         </button>
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {currentAnalysis && (
                    <AnalysisCard analysis={currentAnalysis} />
                  )}
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;