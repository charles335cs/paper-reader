import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Handle potential default export structure depending on the environment/bundler
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Configure the worker source. 
// Using cdnjs for the worker as it reliably provides the classic script format required for workers.
// The version must match the one in index.html (3.11.174).
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PdfViewerProps {
  url: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0); // 100%
  const [isLoading, setIsLoading] = useState(true);
  
  // Keep track of the current render task to cancel it if needed
  const renderTaskRef = useRef<any>(null);

  // Load PDF Document
  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const loadingTask = pdfjs.getDocument(url);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPageNum(1);
        setPageInput("1");
        setScale(1.0);
      } catch (error) {
        console.error("Error loading PDF:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (url) {
      loadPdf();
    }
  }, [url]);

  // Render Page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any pending render task to avoid conflicts
    if (renderTaskRef.current) {
        try {
            await renderTaskRef.current.cancel();
        } catch (e) {
            // Cancellation error is expected, ignore it
        }
    }

    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
    } catch (error: any) {
        if (error.name !== 'RenderingCancelledException') {
            console.error('Render error:', error);
        }
    }
  }, [pdfDoc, pageNum, scale]);

  // Trigger render when dependencies change
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Sync input field when pageNum changes programmatically
  useEffect(() => {
    setPageInput(pageNum.toString());
  }, [pageNum]);

  // Handle Wheel Events (Zoom & Pagination)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Ctrl + Wheel to Zoom
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomStep = 0.1;
        if (e.deltaY < 0) {
           // Scroll Up -> Zoom In
           setScale(prev => Math.min(prev + zoomStep, 3.0));
        } else {
           // Scroll Down -> Zoom Out
           setScale(prev => Math.max(prev - zoomStep, 0.5));
        }
        return;
      }

      // Wheel Navigation (Pagination)
      // Only navigate if content is at the edge or fits entirely
      // Prevents jumping when user just wants to scroll the page content
      if (isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 1;

      if (e.deltaY > 0 && isAtBottom) {
        // Scroll Down at bottom -> Next Page
        if (pageNum < numPages) {
          setPageNum(prev => prev + 1);
          container.scrollTop = 0; // Reset scroll to top
          e.preventDefault();
        }
      } else if (e.deltaY < 0 && isAtTop) {
        // Scroll Up at top -> Prev Page
        if (pageNum > 1) {
          setPageNum(prev => prev - 1);
          container.scrollTop = 0; // Reset scroll to top
          e.preventDefault();
        }
      }
    };

    // Add passive: false to allow preventDefault()
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [pageNum, numPages, isLoading, scale]);

  // Handlers
  const changePage = (delta: number) => {
    const newPage = Math.min(Math.max(1, pageNum + delta), numPages);
    setPageNum(newPage);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput);
    if (!isNaN(p) && p >= 1 && p <= numPages) {
      setPageNum(p);
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    } else {
      setPageInput(pageNum.toString()); // Reset to current page if invalid
    }
  };

  const handleZoom = (delta: number) => {
    setScale(prev => {
        const newScale = prev + delta;
        // Limit zoom between 50% and 300%
        return Math.min(Math.max(0.5, newScale), 3.0);
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-10 shrink-0 gap-2">
        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
           <button 
             onClick={() => changePage(-1)} 
             disabled={pageNum <= 1}
             className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
             title="Previous Page"
             aria-label="Previous Page"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
             </svg>
           </button>
           
           <form onSubmit={handlePageSubmit} className="flex items-center space-x-1.5">
             <input 
               type="text" 
               value={pageInput}
               onChange={(e) => setPageInput(e.target.value)}
               className="w-12 px-1 py-1 text-center text-sm border border-slate-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
               aria-label="Page Number"
             />
             <span className="text-slate-500 text-sm font-medium">/ {numPages}</span>
           </form>

           <button 
             onClick={() => changePage(1)} 
             disabled={pageNum >= numPages}
             className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
             title="Next Page"
             aria-label="Next Page"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
             </svg>
           </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 border-l border-slate-200 pl-4">
           <button 
             onClick={() => handleZoom(-0.1)} 
             className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
             title="Zoom Out"
             aria-label="Zoom Out"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
             </svg>
           </button>
           
           <span className="text-sm font-medium text-slate-600 w-14 text-center tabular-nums">
             {Math.round(scale * 100)}%
           </span>

           <button 
             onClick={() => handleZoom(0.1)} 
             className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
             title="Zoom In"
             aria-label="Zoom In"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
             </svg>
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto bg-slate-100 relative p-8 flex justify-center items-start custom-scrollbar"
      >
         {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
         )}
         <canvas 
            ref={canvasRef} 
            className="bg-white shadow-xl transition-all duration-200 ease-linear" 
            style={{ marginBottom: '2rem' }}
         />
      </div>
    </div>
  );
};
