import React, { useRef, useEffect } from 'react';

interface ImageCanvasProps {
  imageData: ImageData | null;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas size to match image data
    if (canvas.width !== imageData.width || canvas.height !== imageData.height) {
      canvas.width = imageData.width;
      canvas.height = imageData.height;
    }

    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  if (!imageData) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <p>No image loaded</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-100 flex items-center justify-center p-2">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-[70vh] object-contain block bg-white shadow-sm"
      />
    </div>
  );
};

export default ImageCanvas;