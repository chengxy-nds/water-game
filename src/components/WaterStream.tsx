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
  const fromPosRef = useRef(fromPos);
  const toPosRef = useRef(toPos);

  const colorDef = getColor(colorId);

  useEffect(() => {
    fromPosRef.current = fromPos;
    toPosRef.current = toPos;
  }, [fromPos, toPos]);

  useEffect(() => {
    if (!active) {
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
      phaseRef.current += 0.11;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentFrom = fromPosRef.current;
      const currentTo = toPosRef.current;
      if (!currentFrom || !currentTo) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const x1 = currentFrom.x;
      const y1 = currentFrom.y;
      const x2 = currentTo.x;
      const y2 = currentTo.y;
      const dx = x2 - x1;
      const dy = Math.max(22, y2 - y1);
      const sway = Math.sin(phase * 2) * Math.min(12, Math.abs(dx) * 0.05 + 2.8);

      const cp1x = x1 + dx * 0.2 + sway;
      const cp1y = y1 + dy * 0.26;
      const cp2x = x1 + dx * 0.82 - sway * 0.7;
      const cp2y = y1 + dy * 0.58;

      const streamPath = new Path2D();
      streamPath.moveTo(x1, y1);
      streamPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);

      const mainHex = colorDef.hex;
      const topHex = colorDef.topHex || mainHex;
      const glowHex = `${mainHex}aa`;

      const pointOnCurve = (t: number) => {
        const inverse = 1 - t;
        return {
          x: inverse ** 3 * x1 + 3 * inverse ** 2 * t * cp1x + 3 * inverse * t ** 2 * cp2x + t ** 3 * x2,
          y: inverse ** 3 * y1 + 3 * inverse ** 2 * t * cp1y + 3 * inverse * t ** 2 * cp2y + t ** 3 * y2,
        };
      };

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.shadowBlur = 28;
      ctx.shadowColor = mainHex;
      ctx.lineWidth = 18;
      ctx.strokeStyle = glowHex;
      ctx.stroke(streamPath);

      ctx.shadowBlur = 18;
      ctx.lineWidth = 12;
      ctx.strokeStyle = mainHex;
      ctx.stroke(streamPath);

      ctx.shadowBlur = 0;
      ctx.lineWidth = 5.2;
      ctx.strokeStyle = topHex;
      ctx.stroke(streamPath);

      for (let i = 0; i < 4; i += 1) {
        const t = 0.08 + ((phase * 0.06 + i * 0.24) % 0.8);
        const p = pointOnCurve(t);
        const before = pointOnCurve(Math.max(0, t - 0.02));
        const after = pointOnCurve(Math.min(1, t + 0.02));
        const angle = Math.atan2(after.y - before.y, after.x - before.x) + Math.PI / 2;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : topHex;
        ctx.globalAlpha = 0.34 + 0.2 * Math.sin(phase * 2 + i);
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.4, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const moundY = y2;
      const splashPulse = 1 + Math.sin(phase * 4.4) * 0.24;

      ctx.beginPath();
      ctx.ellipse(x2, moundY, 12 * splashPulse, 4.2 * splashPulse, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${mainHex}aa`;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x2 + 3, moundY - 2, 7.5 * splashPulse, 2.8 * splashPulse, 0, 0, Math.PI * 2);
      ctx.fillStyle = topHex;
      ctx.fill();

      for (let i = 0; i < 6; i += 1) {
        const drift = ((phase * 18 + i * 11) % 30) - 15;
        const dropletX = x2 + drift * 0.35;
        const dropletY = moundY - 2 + (i % 2 === 0 ? 0 : 4) + Math.sin(phase * 5 + i) * 3;
        ctx.beginPath();
        ctx.ellipse(dropletX, dropletY, 1.8 + (i % 3), 3.2 + (i % 3), 0, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : topHex;
        ctx.globalAlpha = 0.6;
        ctx.fill();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, colorDef.hex, colorDef.topHex]);

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
