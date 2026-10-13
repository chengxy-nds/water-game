import React, { useEffect, useRef } from 'react';
import { getColor } from '../utils/colors';

interface Point {
  x: number;
  y: number;
}

interface CubicSegment {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

const cubicPoint = (segment: CubicSegment, t: number): Point => {
  const inverse = 1 - t;
  return {
    x: inverse ** 3 * segment.start.x + 3 * inverse ** 2 * t * segment.control1.x + 3 * inverse * t ** 2 * segment.control2.x + t ** 3 * segment.end.x,
    y: inverse ** 3 * segment.start.y + 3 * inverse ** 2 * t * segment.control1.y + 3 * inverse * t ** 2 * segment.control2.y + t ** 3 * segment.end.y,
  };
};

const cubicTangent = (segment: CubicSegment, t: number): Point => {
  const inverse = 1 - t;
  return {
    x: 3 * inverse ** 2 * (segment.control1.x - segment.start.x) + 6 * inverse * t * (segment.control2.x - segment.control1.x) + 3 * t ** 2 * (segment.end.x - segment.control2.x),
    y: 3 * inverse ** 2 * (segment.control1.y - segment.start.y) + 6 * inverse * t * (segment.control2.y - segment.control1.y) + 3 * t ** 2 * (segment.end.y - segment.control2.y),
  };
};

const createLiquidRibbon = (segments: CubicSegment[], phase: number) => {
  const samples: { point: Point; tangent: Point; progress: number }[] = [];
  const segmentSteps = 28;

  segments.forEach((segment, segmentIndex) => {
    for (let step = segmentIndex === 0 ? 0 : 1; step <= segmentSteps; step += 1) {
      const t = step / segmentSteps;
      samples.push({
        point: cubicPoint(segment, t),
        tangent: cubicTangent(segment, t),
        progress: (segmentIndex + t) / segments.length,
      });
    }
  });

  const leftEdge: Point[] = [];
  const rightEdge: Point[] = [];

  for (const sample of samples) {
    const tangentLength = Math.hypot(sample.tangent.x, sample.tangent.y) || 1;
    const normalX = -sample.tangent.y / tangentLength;
    const normalY = sample.tangent.x / tangentLength;
    const startTaper = Math.min(1, 0.42 + sample.progress * 5.8);
    const endTaper = Math.min(1, 0.7 + (1 - sample.progress) * 5.2);
    const width = (1.85 + Math.sin(sample.progress * Math.PI) * 0.42 + Math.sin(phase * 1.4 + sample.progress * 8) * 0.1) * startTaper * endTaper;
    leftEdge.push({ x: sample.point.x + normalX * width, y: sample.point.y + normalY * width });
    rightEdge.push({ x: sample.point.x - normalX * width, y: sample.point.y - normalY * width });
  }

  const path = new Path2D();
  if (leftEdge.length === 0) return path;
  path.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let index = 1; index < leftEdge.length; index += 1) path.lineTo(leftEdge[index].x, leftEdge[index].y);
  for (let index = rightEdge.length - 1; index >= 0; index -= 1) path.lineTo(rightEdge[index].x, rightEdge[index].y);
  path.closePath();
  return path;
};

export interface WaterStreamTargetPoints {
  from: { x: number; y: number };
  mouth?: { x: number; y: number };
  impact: { x: number; y: number };
  tiltAngle?: number;
  mouthRadiusX?: number;
  mouthRadiusY?: number;
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
    mouthRadiusX: number;
    mouthRadiusY: number;
  } | null>(null);

  const colorDef = getColor(colorId);

  useEffect(() => {
    if (streamPoints) {
      pointsRef.current = {
        from: streamPoints.from,
        mouth: streamPoints.mouth ?? streamPoints.impact,
        impact: streamPoints.impact,
        tiltAngle: streamPoints.tiltAngle ?? 0,
        mouthRadiusX: streamPoints.mouthRadiusX ?? 17,
        mouthRadiusY: streamPoints.mouthRadiusY ?? 4.5,
      };
    } else if (fromPos && toPos) {
      pointsRef.current = {
        from: fromPos,
        mouth: toPos,
        impact: toPos,
        tiltAngle: 0,
        mouthRadiusX: 17,
        mouthRadiusY: 4.5,
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

      // 实时优先从真实DOM物理锚点读取视口坐标，彻底解决微信端矩阵解析延迟与脱节Bug
      const spoutAnchor = document.getElementById('active-pour-spout-anchor');
      let x1 = pts.from.x;
      let y1 = pts.from.y;
      if (spoutAnchor) {
        const sRect = spoutAnchor.getBoundingClientRect();
        if (sRect.top !== 0 || sRect.left !== 0) {
          x1 = sRect.left + sRect.width / 2;
          y1 = sRect.top + sRect.height / 2;
        }
      }

      const xm = pts.mouth.x;
      const ym = pts.mouth.y;
      const xImp = pts.impact.x;
      const yImp = Math.max(ym, pts.impact.y);

      const dx = xm - x1;
      const dyAir = Math.max(2, ym - y1);
      const impactDepth = Math.max(2, yImp - ym);
      const launchAngle = (pts.tiltAngle * Math.PI) / 180;
      const sourceToMouthDistance = Math.hypot(dx, dyAir) || 1;
      const launchDistance = Math.min(24, Math.max(4, sourceToMouthDistance * 0.42));
      const launchDirection = streamPoints
        ? { x: Math.sin(launchAngle), y: -Math.cos(launchAngle) }
        : { x: dx / sourceToMouthDistance, y: dyAir / sourceToMouthDistance };
      const entranceControl = Math.min(8, dyAir * 0.28);
      const flowSegments: CubicSegment[] = [
        {
          start: { x: x1, y: y1 },
          control1: {
            x: x1 + launchDirection.x * launchDistance,
            y: y1 + launchDirection.y * launchDistance,
          },
          control2: { x: xm, y: ym - entranceControl },
          end: { x: xm, y: ym },
        },
        {
          start: { x: xm, y: ym },
          control1: { x: xm, y: ym + Math.min(10, impactDepth * 0.28) },
          control2: { x: xImp, y: yImp - Math.min(12, impactDepth * 0.25) },
          end: { x: xImp, y: yImp },
        },
      ];
      const streamPath = new Path2D();
      streamPath.moveTo(x1, y1);
      for (const segment of flowSegments) {
        streamPath.bezierCurveTo(
          segment.control1.x,
          segment.control1.y,
          segment.control2.x,
          segment.control2.y,
          segment.end.x,
          segment.end.y,
        );
      }
      const streamRibbon = createLiquidRibbon(flowSegments, phase);
      const mainHex = colorDef.hex;
      const topHex = colorDef.topHex || mainHex;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (streamPoints) {
        ctx.beginPath();
        ctx.ellipse(xm, ym, pts.mouthRadiusX, pts.mouthRadiusY, 0, Math.PI, Math.PI * 2);
        ctx.strokeStyle = 'rgba(116, 184, 255, 0.48)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      ctx.shadowColor = mainHex;
      ctx.shadowBlur = 2.4;
      const streamGradient = ctx.createLinearGradient(x1, y1, xImp, yImp);
      streamGradient.addColorStop(0, topHex);
      streamGradient.addColorStop(0.32, mainHex);
      streamGradient.addColorStop(0.82, mainHex);
      streamGradient.addColorStop(1, topHex);
      ctx.fillStyle = streamGradient;
      ctx.fill(streamRibbon);

      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
      ctx.globalAlpha = 0.72;
      ctx.stroke(streamPath);
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.ellipse(x1, y1, 3.4, 2.5, (pts.tiltAngle * Math.PI) / 180, 0, Math.PI * 2);
      ctx.fillStyle = topHex;
      ctx.fill();

      if (streamPoints) {
        ctx.beginPath();
        ctx.ellipse(xm, ym, pts.mouthRadiusX, pts.mouthRadiusY, 0, 0, Math.PI);
        ctx.strokeStyle = 'rgba(159, 213, 255, 0.82)';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(85, 174, 255, 0.5)';
        ctx.shadowBlur = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (showSplash && yImp >= ym) {
        const pulse = 1 + Math.sin(phase * 3.4) * 0.08;
        const moundW = 9.5 * pulse;
        const splashGradient = ctx.createLinearGradient(xImp, yImp - 9, xImp, yImp + 2);
        splashGradient.addColorStop(0, topHex);
        splashGradient.addColorStop(1, mainHex);
        ctx.beginPath();
        ctx.moveTo(xImp - moundW, yImp + 1.2);
        ctx.quadraticCurveTo(xImp - 6, yImp - 2, xImp - 3.6, yImp - 1.1);
        ctx.bezierCurveTo(xImp - 2.4, yImp - 8, xImp - 0.9, yImp - 8, xImp, yImp - 3.2);
        ctx.bezierCurveTo(xImp + 1.1, yImp - 8.2, xImp + 2.5, yImp - 7.6, xImp + 3.8, yImp - 1);
        ctx.quadraticCurveTo(xImp + 6.2, yImp - 2.4, xImp + moundW, yImp + 1.2);
        ctx.quadraticCurveTo(xImp, yImp + 3.4, xImp - moundW, yImp + 1.2);
        ctx.closePath();
        ctx.fillStyle = splashGradient;
        ctx.shadowColor = mainHex;
        ctx.shadowBlur = 2;
        ctx.fill();
        ctx.shadowBlur = 0;

        const ripplePhase = (phase * 0.055) % 1;
        ctx.beginPath();
        ctx.ellipse(xImp, yImp + 1, 4 + ripplePhase * 13, 1.2 + ripplePhase * 2.1, 0, 0, Math.PI * 2);
        ctx.strokeStyle = topHex;
        ctx.globalAlpha = 0.42 * (1 - ripplePhase);
        ctx.lineWidth = 1.15;
        ctx.stroke();
        ctx.globalAlpha = 1;

        for (let i = 0; i < 3; i += 1) {
          const dropCycle = (phase * 0.055 + i / 3) % 1;
          const dropHeight = Math.sin(dropCycle * Math.PI) * (i === 1 ? 12 : 9);
          const side = i - 1;
          const dxDrop = xImp + side * (6 + dropCycle * 7);
          const dyDrop = yImp - 3 - dropHeight;

          ctx.save();
          ctx.translate(dxDrop, dyDrop);
          ctx.rotate(side * 0.18);
          ctx.beginPath();
          ctx.ellipse(0, 0, i === 1 ? 1.8 : 1.45, i === 1 ? 3.1 : 2.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = topHex;
          ctx.globalAlpha = 0.72 + Math.sin(dropCycle * Math.PI) * 0.24;
          ctx.fill();
          ctx.restore();
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
