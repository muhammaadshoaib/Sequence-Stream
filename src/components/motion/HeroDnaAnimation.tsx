import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../utils/motion';

export const HeroDnaAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1200);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 320);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Responsive particle count (reduced on mobile for efficiency)
    const isMobile = width < 768;
    const particleCount = isMobile ? 8 : 18;

    // Particles travelling along the strands
    interface Particle {
      strand: 0 | 1;
      progress: number; // 0 to 1 along width
      speed: number;
      size: number;
    }

    const particles: Particle[] = Array.from({ length: particleCount }, (_, idx) => ({
      strand: idx % 2 === 0 ? 0 : 1,
      progress: (idx / particleCount) + Math.random() * 0.05,
      speed: 0.00035 + Math.random() * 0.0002, // Very slow
      size: 1.5 + Math.random() * 1.5
    }));

    let phase = 0;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerY = height * 0.5;
      const amplitude = Math.min(height * 0.28, 55);
      const frequency = 0.008; // Wave frequency along width

      // If prefers reduced motion, draw a static DNA wireframe once and return
      if (prefersReduced) {
        drawStaticDna(ctx, width, centerY, amplitude, frequency);
        return;
      }

      // Draw subtle dual strands
      ctx.lineWidth = 1.8;

      // Color transition from blue/cyan (#0ea5e9, #06b6d4) occasionally toward green (#10b981)
      const colorProgress = (Math.sin(phase * 0.5) + 1) / 2; // 0 to 1
      const strandColorTop = colorProgress > 0.65 
        ? `rgba(16, 185, 129, 0.45)` 
        : `rgba(14, 165, 233, 0.45)`;
      const strandColorBottom = colorProgress > 0.65 
        ? `rgba(6, 182, 212, 0.45)` 
        : `rgba(59, 130, 246, 0.45)`;

      // Draw rungs (base-pair connections) every 28px
      const rungSpacing = isMobile ? 38 : 26;
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += rungSpacing) {
        const rungPhase = phase + x * frequency;
        const y1 = centerY + Math.sin(rungPhase) * amplitude;
        const y2 = centerY - Math.sin(rungPhase) * amplitude;

        const rungAlpha = 0.15 + (Math.sin(rungPhase) + 1) * 0.1;
        ctx.strokeStyle = `rgba(56, 189, 248, ${rungAlpha})`;
        ctx.setLineDash([2, 4]);

        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();

        // Small base nodes
        ctx.setLineDash([]);
        ctx.fillStyle = Math.sin(rungPhase) > 0 ? '#38bdf8' : '#10b981';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x, y1, 2, 0, Math.PI * 2);
        ctx.arc(x, y2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Strand 1 (Top)
      ctx.beginPath();
      ctx.strokeStyle = strandColorTop;
      ctx.lineWidth = 2;
      for (let x = 0; x <= width; x += 4) {
        const y = centerY + Math.sin(phase + x * frequency) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Strand 2 (Bottom)
      ctx.beginPath();
      ctx.strokeStyle = strandColorBottom;
      ctx.lineWidth = 2;
      for (let x = 0; x <= width; x += 4) {
        const y = centerY - Math.sin(phase + x * frequency) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw travelling particles
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const px = p.progress * width;
        const py = p.strand === 0 
          ? centerY + Math.sin(phase + px * frequency) * amplitude
          : centerY - Math.sin(phase + px * frequency) * amplitude;

        ctx.fillStyle = p.strand === 0 ? '#38bdf8' : '#34d399';
        ctx.shadowColor = p.strand === 0 ? '#38bdf8' : '#34d399';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Advance phase slowly (gentle drift)
      phase += 0.007;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReduced]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-20 dark:opacity-25" aria-hidden="true">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

// Static fallback when prefers-reduced-motion is true
function drawStaticDna(
  ctx: CanvasRenderingContext2D,
  width: number,
  centerY: number,
  amplitude: number,
  frequency: number
) {
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  for (let x = 0; x <= width; x += 4) {
    const y = centerY + Math.sin(x * frequency) * amplitude;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let x = 0; x <= width; x += 4) {
    const y = centerY - Math.sin(x * frequency) * amplitude;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
