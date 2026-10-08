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
      phaseRef.current += 0.28;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const x1 = fromPos.x;
      const y1 = fromPos.y;
      const x2 = toPos.x;
      const y2 = toPos.y;

      // Pure vertical liquid jet straight down into mouth
      ctx.save();

      // 1. Fluid Glow Halo
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 14;
      ctx.strokeStyle = `${colorDef.hex}44`;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 2. Viscous Solid Fluid Column Body
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 8.5;
      ctx.strokeStyle = colorDef.hex;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 3. Central Glossy Specular Light Stripe
      ctx.beginPath();
      ctx.moveTo(x1 - 1, y1);
      ctx.lineTo(x2 - 1, y2);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineCap = 'round';
      ctx.stroke();


      // 5. Landing Impact Splash & Foam Cluster (Exact Match to Reference Image)
      const bubbleColor = colorDef.topHex || colorDef.hex;
      const foamColor = colorDef.hex;

      // Soft glow backing under the landing foam
      ctx.beginPath();
      ctx.arc(x2, y2 - 2, 16, 0, Math.PI * 2);
      ctx.fillStyle = `${colorDef.hex}55`;
      ctx.fill();

      // Cluster of 4 interlocking foamy splash bubbles (Foam Splash)
      const bubbles = [
        { dx: -7.5, dy: -2, r: 6.2, pulseOffset: 0 },
        { dx: 0, dy: -5, r: 8.5, pulseOffset: 1.2 },
        { dx: 7.5, dy: -2, r: 6.2, pulseOffset: 2.4 },
        { dx: -0.5, dy: 1, r: 7.8, pulseOffset: 0.6 },
      ];

      bubbles.forEach((b) => {
        const curR = b.r + Math.sin(phase * 4 + b.pulseOffset) * 0.8;
        const bx = x2 + b.dx;
        const by = y2 + b.dy;

        // Base sphere in bright fluid color
        ctx.beginPath();
        ctx.arc(bx, by, curR, 0, Math.PI * 2);
        ctx.fillStyle = bubbleColor;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = colorDef.shadeHex || foamColor;
        ctx.stroke();

        // 3D Specular highlight glint
        ctx.beginPath();
        ctx.arc(bx - curR * 0.28, by - curR * 0.3, curR * 0.36, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      // Small jumping airborne splash droplets
      const droplets = [
        { dx: -10, dy: -12, r: 2.2, phase: 0.5 },
        { dx: 10, dy: -14, r: 2.0, phase: 1.8 },
        { dx: -2, dy: -16, r: 1.8, phase: 2.9 },
      ];

      droplets.forEach((d) => {
        const bounce = Math.sin(phase * 5 + d.phase);
        if (bounce > -0.2) {
          const dy = d.dy + bounce * 3;
          ctx.beginPath();
          ctx.arc(x2 + d.dx, y2 + dy, d.r, 0, Math.PI * 2);
          ctx.fillStyle = bubbleColor;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x2 + d.dx - 0.5, y2 + dy - 0.5, d.r * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });

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
