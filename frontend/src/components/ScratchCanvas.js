import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function ScratchCanvas({ width = 280, height = 180, onComplete, resultContent }) {
  const canvasRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [percentScratched, setPercentScratched] = useState(0);
  const [completed, setCompleted] = useState(false);

  const drawCover = useCallback((ctx) => {
    // Golden scratch cover
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#D4A843');
    gradient.addColorStop(0.3, '#F5D676');
    gradient.addColorStop(0.5, '#D4A843');
    gradient.addColorStop(0.7, '#F5D676');
    gradient.addColorStop(1, '#C4983A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Scratch pattern overlay
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < width; i += 8) {
      for (let j = 0; j < height; j += 8) {
        if ((i + j) % 16 === 0) {
          ctx.fillStyle = '#FFF';
          ctx.fillRect(i, j, 4, 4);
        }
      }
    }
    ctx.globalAlpha = 1;

    // "Raspa aquí" text
    ctx.fillStyle = '#8B6914';
    ctx.font = `bold ${Math.floor(width * 0.07)}px 'Playfair Display', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RASPA AQUÍ', width / 2, height / 2 - 10);
    ctx.font = `${Math.floor(width * 0.04)}px sans-serif`;
    ctx.fillStyle = '#A0842A';
    ctx.fillText('Desliza para descubrir', width / 2, height / 2 + 20);
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    drawCover(ctx);
  }, [width, height, drawCover]);

  const scratch = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas || completed) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    // Check percentage
    const imgData = ctx.getImageData(0, 0, width, height);
    let transparent = 0;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] === 0) transparent++;
    }
    const pct = (transparent / (width * height)) * 100;
    setPercentScratched(pct);
    if (pct > 45 && !completed) {
      setCompleted(true);
      if (onComplete) onComplete();
    }
  }, [width, height, completed, onComplete]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleStart = (e) => { e.preventDefault(); setIsScratching(true); const { x, y } = getPos(e); scratch(x, y); };
  const handleMove = (e) => { e.preventDefault(); if (!isScratching) return; const { x, y } = getPos(e); scratch(x, y); };
  const handleEnd = () => { setIsScratching(false); };

  return (
    <div className="relative inline-block rounded-2xl overflow-hidden shadow-lg" style={{ width: '100%', maxWidth: width }}>
      {/* Background result */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ width: '100%', aspectRatio: `${width}/${height}` }}>
        {resultContent}
      </div>
      {/* Scratch canvas on top */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', aspectRatio: `${width}/${height}`, cursor: 'grab', touchAction: 'none', position: 'relative', zIndex: 10 }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        data-testid="scratch-canvas"
      />
    </div>
  );
}
