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
      phaseRef.current += 0.16;
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

      const bubbleColor = colorDef.topHex || colorDef.hex;
      const foamColor = colorDef.hex;

      ctx.save();

      // Keep both ends fixed while the middle of the stream breathes with the flow.
      const streamPath = new Path2D();
      streamPath.moveTo(x1, y1);
      const dy = Math.max(20, y2 - y1);
      const sway = Math.sin(phase * 1.8) * Math.min(4, Math.abs(x2 - x1) * 0.035 + 1.5);
      const cp1x = x1 + (x2 - x1) * 0.18 + sway;
      const cp1y = y1 + dy * 0.28;
      const cp2x = x1 + (x2 - x1) * 0.82 - sway * 0.6;
      const cp2y = y1 + dy * 0.55;
      streamPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);

      // Soft edge and saturated body keep the stream liquid rather than neon.
      ctx.lineWidth = 9;
      ctx.strokeStyle = `${colorDef.hex}28`;
      ctx.lineCap = 'round';
      ctx.stroke(streamPath);

      ctx.lineWidth = 6.4;
      ctx.strokeStyle = colorDef.hex;
      ctx.lineCap = 'round';
      ctx.stroke(streamPath);

      ctx.lineWidth = 4.1;
      ctx.strokeStyle = colorDef.topHex || colorDef.hex;
      ctx.lineCap = 'round';
      ctx.stroke(streamPath);

      // Traveling caustic streaks provide visible downward motion without breaking the jet.
      const pointOnCurve = (t: number) => {
        const inverse = 1 - t;
        return {
          x: inverse ** 3 * x1 + 3 * inverse ** 2 * t * cp1x + 3 * inverse * t ** 2 * cp2x + t ** 3 * x2,
          y: inverse ** 3 * y1 + 3 * inverse ** 2 * t * cp1y + 3 * inverse * t ** 2 * cp2y + t ** 3 * y2,
        };
      };
      for (let i = 0; i < 3; i++) {
        const t = 0.12 + ((phase * 0.035 + i / 3) % 0.76);
        const point = pointOnCurve(t);
        const before = pointOnCurve(Math.max(0, t - 0.01));
        const after = pointOnCurve(Math.min(1, t + 0.01));
        const angle = Math.atan2(after.y - before.y, after.x - before.x) + Math.PI / 2;
        const alpha = 0.24 + 0.18 * Math.sin(phase + i * 2.1);
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 0.8, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // A small meniscus bulge sits on the actual receiving surface.
      const moundPulse = Math.sin(phase * 3.2) * 0.55;
      const moundY = y2;

      ctx.beginPath();
      ctx.ellipse(x2, moundY - 1, 7.2, 2.8, 0, Math.PI, Math.PI * 2);
      ctx.fillStyle = colorDef.hex;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x2, moundY - 2.2 + moundPulse * 0.35, 3.5, 2.2, 0, Math.PI, Math.PI * 2);
      ctx.fillStyle = bubbleColor;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x2 - 0.7, moundY - 2.8 + moundPulse * 0.35, 1.2, 0.55, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();

      // Short ripples spread over the receiving liquid surface.
      for (let i = 0; i < 2; i++) {
        const tRing = ((phase * 0.2 + i * 0.5) % 1);
        const rx = 2 + tRing * 8;
        const ry = 1.2 + tRing * 1.8;
        const alpha = (1 - tRing) * 0.38;
        ctx.beginPath();
        ctx.ellipse(x2, y2, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
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
