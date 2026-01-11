import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Play, Pause, Download, RefreshCw, AlertCircle, Scissors } from 'lucide-react';
import Button from './components/Button';
import ImageCanvas from './components/ImageCanvas';
import { removeHorizontalSeam, removeVerticalSeam } from './utils/seamCarving';
import { ProcessingStatus } from './types';

// Max resolution to prevent browser freeze in this JS-only implementation
const MAX_DIMENSION = 600;

function App() {
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [currentImageData, setCurrentImageData] = useState<ImageData | null>(null);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to control the animation loop
  const processingRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize if too large (performance safeguard)
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
          const ratio = w / h;
          if (w > h) {
            w = MAX_DIMENSION;
            h = MAX_DIMENSION / ratio;
          } else {
            h = MAX_DIMENSION;
            w = MAX_DIMENSION * ratio;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);

        setOriginalImageData(data);
        setCurrentImageData(data);
        setTargetWidth(w);
        setTargetHeight(h);
        setStatus(ProcessingStatus.IDLE);
        setError(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processStep = useCallback(() => {
    if (isPausedRef.current) return;

    setCurrentImageData((prevData) => {
      if (!prevData) return null;

      let nextData = prevData;
      let changed = false;

      // Prioritize width reduction, then height
      if (nextData.width > targetWidth) {
        nextData = removeVerticalSeam(nextData);
        changed = true;
      } else if (nextData.height > targetHeight) {
        nextData = removeHorizontalSeam(nextData);
        changed = true;
      }

      if (changed) {
        // Continue loop
        processingRef.current = requestAnimationFrame(processStep);
        return nextData;
      } else {
        // Done
        setStatus(ProcessingStatus.COMPLETED);
        return nextData;
      }
    });
  }, [targetWidth, targetHeight]);

  const startProcessing = () => {
    if (!currentImageData) return;
    if (targetWidth > currentImageData.width || targetHeight > currentImageData.height) {
      setError("Scaling UP is not supported in this demo (Seam Insertion is complex). Please target a smaller size.");
      return;
    }
    
    setError(null);
    setStatus(ProcessingStatus.PROCESSING);
    isPausedRef.current = false;
    processStep();
  };

  const pauseProcessing = () => {
    isPausedRef.current = true;
    if (processingRef.current) {
      cancelAnimationFrame(processingRef.current);
    }
    setStatus(ProcessingStatus.PAUSED);
  };

  const resetImage = () => {
    if (originalImageData) {
      pauseProcessing();
      setCurrentImageData(originalImageData);
      setTargetWidth(originalImageData.width);
      setTargetHeight(originalImageData.height);
      setStatus(ProcessingStatus.IDLE);
      setError(null);
    }
  };

  const handleDownload = () => {
    if (!currentImageData) return;
    const canvas = document.createElement('canvas');
    canvas.width = currentImageData.width;
    canvas.height = currentImageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(currentImageData, 0, 0);
    
    const link = document.createElement('a');
    link.download = 'retargeted-image.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black mb-2 flex items-center justify-center gap-3">
          <Scissors className="w-10 h-10 transform -rotate-12" />
          Retarget.js
        </h1>
        <p className="text-gray-600 font-medium max-w-lg mx-auto">
          Client-side Content-Aware Scaling (Seam Carving). 
          Resize images while preserving the important parts.
        </p>
      </header>

      {/* Main Layout */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Upload Block */}
          <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload size={20} /> Upload
            </h2>
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-gray-400 p-8 rounded text-center group-hover:bg-gray-50 transition-colors">
                <p className="text-sm font-bold text-gray-500">Click or Drag Image</p>
                <p className="text-xs text-gray-400 mt-1">Max processing size: {MAX_DIMENSION}px</p>
              </div>
            </div>
          </div>

          {/* Dimensions Block */}
          <div className={`bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-opacity ${!originalImageData ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Target Size</h2>
                <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                   Original: {originalImageData?.width} x {originalImageData?.height}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-4">
               <div>
                 <label className="block text-xs font-bold uppercase mb-1">Width (px)</label>
                 <input 
                    type="number" 
                    value={targetWidth}
                    max={originalImageData?.width}
                    onChange={(e) => setTargetWidth(Number(e.target.value))}
                    className="w-full p-2 border-2 border-black rounded focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase mb-1">Height (px)</label>
                 <input 
                    type="number" 
                    value={targetHeight}
                    max={originalImageData?.height}
                    onChange={(e) => setTargetHeight(Number(e.target.value))}
                    className="w-full p-2 border-2 border-black rounded focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                 />
               </div>
             </div>

             <div className="flex flex-col gap-2">
               {status === ProcessingStatus.PROCESSING ? (
                 <Button variant="secondary" onClick={pauseProcessing} icon={<Pause size={18}/>}>
                   Pause Processing
                 </Button>
               ) : (
                 <Button 
                    variant="accent" 
                    onClick={startProcessing} 
                    icon={<Play size={18}/>}
                    disabled={status === ProcessingStatus.COMPLETED || !originalImageData}
                 >
                   Start Retargeting
                 </Button>
               )}
               
               <Button variant="secondary" onClick={resetImage} icon={<RefreshCw size={18}/>}>
                 Reset Original
               </Button>
             </div>
          </div>
        </div>

        {/* Right Column: Canvas & Output */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ImageCanvas imageData={currentImageData} />
          
          {/* Status Bar */}
          <div className="bg-white p-4 border-2 border-black rounded-lg flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full border border-black ${
                status === ProcessingStatus.PROCESSING ? 'bg-green-400 animate-pulse' : 
                status === ProcessingStatus.COMPLETED ? 'bg-blue-400' : 'bg-gray-300'
              }`}></div>
              <span className="font-bold uppercase tracking-wider text-sm">
                Status: {status}
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 px-3 py-1 rounded border border-red-200">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {currentImageData && (
               <div className="text-sm font-mono font-bold">
                 {currentImageData.width}px × {currentImageData.height}px
               </div>
            )}

            <Button 
              variant="primary" 
              onClick={handleDownload} 
              disabled={!currentImageData}
              icon={<Download size={18} />}
            >
              Download
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;