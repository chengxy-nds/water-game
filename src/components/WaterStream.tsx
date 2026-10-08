import React, { useEffect, useRef } from 'react';
import { getColor } from '../utils/colors';

interface WaterStreamProps {
  fromPos: { x: number; y: number } | null;
  toPos: { x: number; y: number } | null;
  colorId: string;
  active: boolean;
}

export const WaterStream: React.FC<WaterStreamProps> = ({
  fromPos,
  toPos,
  colorId,
  active,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  const colorDef = getColor(colorId);

  useEffect(() => {
    if (!active || !fromPos || !toPos) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      phaseRef.current += 0.25;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const x1 = fromPos.x;
      const y1 = fromPos.y;
      const x2 = toPos.x;
      const y2 = toPos.y;

      // Natural gravity drop: arches slightly at spout mouth, then falls straight down into target bottle mouth
      const cp1x = x1 + (x2 - x1) * 0.4;
      const cp1y = y1 + 4;
      const cp2x = x2;
      const cp2y = y1 + (y2 - y1) * 0.5;

      ctx.save();

      // 1. Ambient Fluid Jet Glow
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.lineWidth = 14;
      ctx.strokeStyle = `${colorDef.hex}44`;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 2. Solid Fluid Core Body
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.lineWidth = 8.5;
      ctx.strokeStyle = colorDef.hex;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 3. Central Specular Reflection Stripe
      ctx.beginPath();
      ctx.moveTo(x1 - 1, y1);
      ctx.bezierCurveTo(cp1x - 1, cp1y, cp2x - 1, cp2y, x2 - 1, y2);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineCap = 'round';
      ctx.stroke();

      // 4. Smooth Spout Meniscus Node
      ctx.beginPath();
      ctx.arc(x1, y1, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = colorDef.hex;
      ctx.fill();

      // 5. Landing Impact Bubbles (Image 2 Match: 3 bubbly spheres on receiving liquid)
      const bubbleColor = colorDef.topHex || colorDef.hex;

      // Center bubble
      const cR = 5.5 + Math.sin(phase * 3) * 0.5;
      ctx.beginPath();
      ctx.arc(x2, y2 - 2, cR, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2 - 1.5, y2 - 3.5, cR * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Left bubble
      const lR = 4 + Math.cos(phase * 3.4) * 0.4;
      ctx.beginPath();
      ctx.arc(x2 - 5, y2 - 3.5, lR, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2 - 6, y2 - 4.5, lR * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Right bubble
      const rR = 4 + Math.sin(phase * 3.2) * 0.4;
      ctx.beginPath();
      ctx.arc(x2 + 5, y2 - 3.5, rR, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2 + 4, y2 - 4.5, rR * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Bouncing droplet
      const dropY = y2 - 9 + Math.sin(phase * 4) * 1.5;
      ctx.beginPath();
      ctx.arc(x2, dropY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor;
      ctx.fill();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, fromPos, toPos, colorDef.hex, colorDef.topHex]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};
