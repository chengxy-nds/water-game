import React, { useEffect, useRef } from 'react';
import { getColor } from '../utils/colors';

export interface WaterStreamTargetPoints {
  from: { x: number; y: number };
  mouth?: { x: number; y: number };
  impact: { x: number; y: number };
  tiltAngle?: number;
}

export interface WaterStreamProps {
  streamPoints?: WaterStreamTargetPoints | null;
  fromPos?: { x: number; y: number } | null;
  toPos?: { x: number; y: number } | null;
  colorId: string;
  active: boolean;
  showSplash?: boolean;
}

export const WaterStream: React.FC<WaterStreamProps> = ({
  streamPoints,
  fromPos,
  toPos,
  colorId,
  active,
  showSplash = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const pointsRef = useRef<{
    from: { x: number; y: number };
    mouth: { x: number; y: number };
    impact: { x: number; y: number };
    tiltAngle: number;
  } | null>(null);

  const colorDef = getColor(colorId);

  useEffect(() => {
    if (streamPoints) {
      pointsRef.current = {
        from: streamPoints.from,
        mouth: streamPoints.mouth ?? streamPoints.impact,
        impact: streamPoints.impact,
        tiltAngle: streamPoints.tiltAngle ?? 0,
      };
    } else if (fromPos && toPos) {
      pointsRef.current = {
        from: fromPos,
        mouth: toPos,
        impact: toPos,
        tiltAngle: 0,
      };
    } else {
      pointsRef.current = null;
    }
  }, [streamPoints, fromPos, toPos]);

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
      phaseRef.current += 0.12;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = pointsRef.current;
      if (!pts) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const x1 = pts.from.x;
      const y1 = pts.from.y;
      const xm = pts.mouth.x;
      const ym = pts.mouth.y;
      const xImp = pts.impact.x;
      const yImp = Math.max(ym, pts.impact.y);

      const dx = xm - x1;
      const dyAir = ym - y1;
      const isPourDown = dyAir > 0;
      const curveDir = dx >= 0 ? 1 : -1;

      // Natural gravity arc from tilted spout down into target bottle mouth:
      // Spout velocity launches along tilt slope, then gravity curves straight down into bottle neck.
      const cp1x = x1 + dx * 0.38 + curveDir * Math.max(3, Math.abs(dx) * 0.08);
      const cp1y = y1 + (isPourDown ? dyAir * 0.18 : 6);
      const cp2x = xm;
      const cp2y = ym - Math.max(6, Math.abs(dyAir) * 0.22);

      // 1. Center streamline path: from tilted lip -> curve into mouth -> straight down to liquid surface
      const streamPath = new Path2D();
      streamPath.moveTo(x1, y1);
      if (Math.abs(dyAir) > 3) {
        streamPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xm, ym);
      }
      streamPath.lineTo(xImp, yImp);

      // Colors from palette
      const mainHex = colorDef.hex;
      const topHex = colorDef.topHex || mainHex;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Layer 1: Ambient outer liquid halo / soft glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = mainHex;
      ctx.lineWidth = 14;
      ctx.strokeStyle = `${mainHex}66`;
      ctx.stroke(streamPath);

      // Layer 2: Solid viscous fluid body (Pure high-saturation fluid color matching Fig 2)
      ctx.shadowBlur = 0;
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = mainHex;
      ctx.stroke(streamPath);

      // Layer 3: Cylindrical front volume highlight
      ctx.lineWidth = 5.2;
      ctx.strokeStyle = topHex;
      ctx.stroke(streamPath);

      // Layer 4: Specular reflection highlight streak (Offset leftwards toward light source)
      // Gives the stream an authentic glass-like / viscous syrup 3D cylindrical sheen.
      const specularPath = new Path2D();
      const specOffset = -2.2;
      specularPath.moveTo(x1 + specOffset * 0.6, y1);
      if (Math.abs(dyAir) > 3) {
        specularPath.bezierCurveTo(
          cp1x + specOffset,
          cp1y,
          cp2x + specOffset,
          cp2y,
          xm + specOffset,
          ym
        );
      }
      specularPath.lineTo(xImp + specOffset, Math.max(ym, yImp - 2));

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.stroke(specularPath);

      // Spout root meniscus: Smooth teardrop joint anchoring stream firmly onto bottle lip
      ctx.beginPath();
      ctx.ellipse(x1, y1, 5.5, 3.8, (pts.tiltAngle * Math.PI) / 180, 0, Math.PI * 2);
      ctx.fillStyle = mainHex;
      ctx.fill();

      // Liquid Surface Impact Interaction (Matching Reference Fig 2)
      if (showSplash && yImp >= ym) {
        const pulse = 1 + Math.sin(phase * 4.5) * 0.12;
        const moundW = 11 * pulse;
        const moundH = 5 * pulse;

        // A. Surging Impact Dome (Rising liquid mound where stream hits surface)
        ctx.beginPath();
        ctx.ellipse(xImp, yImp - 1, moundW, moundH, 0, 0, Math.PI * 2);
        ctx.fillStyle = mainHex;
        ctx.fill();

        // B. Top rim highlight of the impact mound
        ctx.beginPath();
        ctx.ellipse(xImp, yImp - 2.5, moundW * 0.72, moundH * 0.55, 0, 0, Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // C. Left & Right bouncing liquid pearls (authentic droplet pearls with specular glint)
        const leftPearlX = xImp - moundW * 0.72;
        const rightPearlX = xImp + moundW * 0.72;
        const waveSway = Math.sin(phase * 3.6) * 1.2;

        // Left water droplet pearl
        ctx.beginPath();
        ctx.arc(leftPearlX, yImp - 2.8 + waveSway, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = topHex;
        ctx.fill();
        // Left pearl specular glint
        ctx.beginPath();
        ctx.arc(leftPearlX - 1.0, yImp - 3.8 + waveSway, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Right water droplet pearl
        ctx.beginPath();
        ctx.arc(rightPearlX, yImp - 2.4 - waveSway, 3.0, 0, Math.PI * 2);
        ctx.fillStyle = topHex;
        ctx.fill();
        // Right pearl specular glint
        ctx.beginPath();
        ctx.arc(rightPearlX - 0.8, yImp - 3.2 - waveSway, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // D. Floating frothy micro-bubbles around impact center
        for (let i = 0; i < 4; i += 1) {
          const bAngle = phase * 2.2 + (i * Math.PI) / 2;
          const bRadius = 4.5 + (i % 2) * 3;
          const bx = xImp + Math.cos(bAngle) * bRadius;
          const by = yImp - 2 + Math.sin(bAngle) * 2;
          const bSize = 1.2 + (i % 2) * 0.6;

          ctx.beginPath();
          ctx.arc(bx, by, bSize, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : topHex;
          ctx.globalAlpha = 0.85;
          ctx.fill();
        }

        // E. Tiny energetic airborne droplets jumping slightly above the surface
        for (let i = 0; i < 3; i += 1) {
          const dropCycle = (phase * 0.08 + i * 0.33) % 1;
          const dropH = Math.sin(dropCycle * Math.PI) * 7.5;
          const dropSpread = (i - 1) * 6;
          const dxDrop = xImp + dropSpread;
          const dyDrop = yImp - 3 - dropH;

          ctx.beginPath();
          ctx.arc(dxDrop, dyDrop, 1.1, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = (1 - dropCycle) * 0.8;
          ctx.fill();
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, colorDef.hex, colorDef.topHex, colorDef.shadeHex, showSplash]);

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
