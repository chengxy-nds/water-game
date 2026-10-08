import React, { useEffect, useRef } from 'react';
import { getColor } from '../utils/colors';

interface WaterStreamProps {
  fromPos: { x: number; y: number } | null;
  toPos: { x: number; y: number } | null;
  colorId: string;
  active: boolean;
}

interface FluidParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'splash' | 'spill' | 'stream-pulse';
}

interface SurfaceRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export const WaterStream: React.FC<WaterStreamProps> = ({
  fromPos,
  toPos,
  colorId,
  active,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<FluidParticle[]>([]);
  const ripplesRef = useRef<SurfaceRipple[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  const colorDef = getColor(colorId);

  useEffect(() => {
    if (!active || !fromPos || !toPos) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      particlesRef.current = [];
      ripplesRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    // Helper: Point on Quadratic Bezier
    const getBezierPoint = (t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      const mt = 1 - t;
      return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
      };
    };

    const render = () => {
      if (!running) return;
      phaseRef.current += 0.22;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const x1 = fromPos.x;
      const y1 = fromPos.y;
      const x2 = toPos.x;
      const y2 = toPos.y;

      const dx = x2 - x1;
      const dy = y2 - y1;

      // Parabolic gravity control point (organic fluid arc)
      const cx = x1 + dx * 0.45;
      const cy = Math.min(y1, y2) - 18 + Math.sin(phase * 1.5) * 2;
      const p0 = { x: x1, y: y1 };
      const p1 = { x: cx, y: cy };
      const p2 = { x: x2, y: y2 };

      ctx.save();

      // ==========================================
      // 1. VISCOUS MAIN STREAM (Tapered Thick Liquid Jet)
      // ==========================================

      // Layer 1.1: Outer Glow & Fluid Halo
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
      ctx.lineWidth = 18;
      ctx.strokeStyle = `${colorDef.hex}44`;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Layer 1.2: Dense Vibrant Fluid Core
      const streamGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      streamGrad.addColorStop(0, colorDef.hex);
      streamGrad.addColorStop(0.7, colorDef.hex);
      streamGrad.addColorStop(1, '#ffffff');

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
      ctx.lineWidth = 10;
      ctx.strokeStyle = streamGrad;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Layer 1.3: Specular Longitudinal Light Stripe (The shiny crest of the flowing stream)
      ctx.beginPath();
      ctx.moveTo(x1 - 1, y1);
      ctx.quadraticCurveTo(cx - 1, cy, x2 - 1, y2);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineCap = 'round';
      ctx.stroke();

      // ==========================================
      // 2. TRAVELING VISCOUS FLUID BEADS & NECKING BULGES
      // ==========================================
      // Creates the organic "glug-glug" surging liquid texture
      const numPulses = 4;
      for (let i = 0; i < numPulses; i++) {
        const pulseT = ((phase * 0.2 + (i / numPulses)) % 1);
        const pt = getBezierPoint(pulseT, p0, p1, p2);
        const pulseRadius = 5.5 + Math.sin(pulseT * Math.PI) * 2.5;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = colorDef.hex;
        ctx.shadowColor = colorDef.hex;
        ctx.shadowBlur = 8;
        ctx.fill();

        // White specular glint inside the bead
        ctx.beginPath();
        ctx.arc(pt.x - 1, pt.y - 1, pulseRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
      }

      // ==========================================
      // 3. SPOUT MENISCUS & DRIPPING NECK (From Bottle Lip)
      // ==========================================
      // Teardrop meniscus clinging to the spout lip
      const spoutBulgeRadius = 6.5 + Math.sin(phase * 2) * 1.5;
      ctx.beginPath();
      ctx.arc(x1, y1, spoutBulgeRadius, 0, Math.PI * 2);
      ctx.fillStyle = colorDef.hex;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x1 - 1, y1 - 1, spoutBulgeRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      // ==========================================
      // 4. SPILLAGE OVERFLOW DROPS & SPLATTERS
      // ==========================================
      // Spawn occasional stray overflow droplet from the spout
      if (Math.random() < 0.35) {
        particlesRef.current.push({
          x: x1 + (Math.random() - 0.5) * 4,
          y: y1 + 2,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1.5 + Math.random() * 2.5,
          radius: 2 + Math.random() * 2,
          alpha: 1.0,
          life: 1.0,
          maxLife: 1.0,
          type: 'spill',
        });
      }

      // Spawn energetic splash droplets at target bottle impact point
      if (Math.random() < 0.85) {
        for (let i = 0; i < 2; i++) {
          const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.6;
          const speed = 2.0 + Math.random() * 4.2;
          particlesRef.current.push({
            x: x2 + (Math.random() - 0.5) * 8,
            y: y2 + (Math.random() - 0.5) * 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1.8 + Math.random() * 2.6,
            alpha: 1.0,
            life: 1.0,
            maxLife: 1.0,
            type: 'splash',
          });
        }
      }

      // Spawn concentric surface ripples at target impact point
      if (Math.random() < 0.25) {
        ripplesRef.current.push({
          x: x2,
          y: y2,
          radius: 3,
          maxRadius: 18 + Math.random() * 8,
          alpha: 0.95,
          speed: 0.7 + Math.random() * 0.5,
        });
      }

      // Update and draw fluid particles (spill & splash)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.type === 'spill' ? 0.35 : 0.24; // gravity
        p.life -= p.type === 'spill' ? 0.035 : 0.045;
        p.alpha = Math.max(0, p.life);

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Draw particle body
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = colorDef.hex;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = colorDef.hex;
        ctx.shadowBlur = 4;
        ctx.fill();

        // Droplet specular glint
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
      }

      // Update and draw expanding concentric surface ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += r.speed;
        r.alpha = Math.max(0, 1 - (r.radius / r.maxRadius));

        if (r.radius >= r.maxRadius || r.alpha <= 0) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        // 3D perspective oval/ellipse for bottle mouth surface
        ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.36, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.85})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Subtle outer colored wave crest
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius + 1.5, (r.radius + 1.5) * 0.36, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `${colorDef.hex}${Math.floor(r.alpha * 180).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1.2;
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
  }, [active, fromPos, toPos, colorDef.hex]);

  // Window resize handler
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
      style={{
        // Filter provides smooth fluid cohesion & viscosity
        filter: 'url(#gooey) drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
      }}
    />
  );
};
