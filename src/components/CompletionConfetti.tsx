import React, { useEffect, useRef } from 'react';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspect: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  tiltAngle: number;
  tiltSpeed: number;
  shape: 'rect' | 'ribbon' | 'circle';
  alpha: number;
}

interface CompletionConfettiProps {
  /** Triggered whenever active flips false -> true or burstKey increments while active */
  active: boolean;
  /** Incrementing counter to force an additional burst */
  burstKey?: number;
  /** 'viewport' bursts over modals/full screen; 'contained' stays inside parent container */
  variant?: 'viewport' | 'contained';
  className?: string;
}

const CONFETTI_COLORS = [
  '#10b981', // Emerald
  '#34d399', // Light emerald
  '#f59e0b', // Amber gold
  '#fbbf24', // Warm gold
  '#0ea5e9', // Azure sky
  '#6366f1', // Indigo
  '#84cc16', // Lime crest
];

export const CompletionConfetti: React.FC<CompletionConfettiProps> = ({
  active,
  burstKey = 0,
  variant = 'viewport',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevActiveRef = useRef<boolean>(false);
  const prevBurstKeyRef = useRef<number>(burstKey);

  useEffect(() => {
    const activatedNow = !prevActiveRef.current && active;
    const retriggered = active && burstKey !== prevBurstKeyRef.current;

    prevActiveRef.current = active;
    prevBurstKeyRef.current = burstKey;

    if (!activatedNow && !retriggered) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;

    const width =
      variant === 'viewport'
        ? window.innerWidth
        : Math.max(240, parent?.clientWidth || window.innerWidth);
    const height =
      variant === 'viewport'
        ? window.innerHeight
        : Math.max(120, parent?.clientHeight || 220);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particleCount = variant === 'viewport' ? 84 : 46;
    const origins =
      variant === 'viewport'
        ? [
            { x: width * 0.38, y: height * 0.28 },
            { x: width * 0.62, y: height * 0.28 },
          ]
        : [{ x: width * 0.5, y: height * 0.45 }];

    const shapes: ConfettiParticle['shape'][] = ['rect', 'ribbon', 'circle'];

    const particles: ConfettiParticle[] = Array.from(
      { length: particleCount },
      (_, idx) => {
        const origin = origins[idx % origins.length];
        const angleSpread =
          variant === 'viewport'
            ? -Math.PI / 2 + (Math.random() - 0.5) * 1.9
            : -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const speed =
          variant === 'viewport'
            ? 4.5 + Math.random() * 8.5
            : 2.6 + Math.random() * 5.2;

        return {
          x: origin.x + (Math.random() - 0.5) * 28,
          y: origin.y + (Math.random() - 0.5) * 16,
          vx: Math.cos(angleSpread) * speed,
          vy: Math.sin(angleSpread) * speed - (variant === 'viewport' ? 2.2 : 1.2),
          size: 5 + Math.random() * 5.5,
          aspect: 0.45 + Math.random() * 0.55,
          color: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.16,
          tiltAngle: Math.random() * Math.PI * 2,
          tiltSpeed: 0.08 + Math.random() * 0.12,
          shape: shapes[idx % shapes.length],
          alpha: 1,
        };
      }
    );

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startTime = performance.now();
    const maxDurationMs = 2800;

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      const fadeStart = maxDurationMs * 0.65;

      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vy += 0.24; // gravity
        p.vx *= 0.985; // air drag
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.tiltAngle += p.tiltSpeed;

        if (elapsed > fadeStart) {
          const fadeFraction = (elapsed - fadeStart) / (maxDurationMs - fadeStart);
          p.alpha = Math.max(0, 1 - fadeFraction);
        }

        if (p.alpha <= 0.02 || p.y > height + 40) {
          continue;
        }
        aliveCount++;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(1, Math.max(0.25, Math.abs(Math.cos(p.tiltAngle))));
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'ribbon') {
          ctx.fillRect(-p.size * 0.85, -p.size * 0.22, p.size * 1.7, p.size * 0.44);
        } else {
          ctx.fillRect(
            -p.size * 0.5,
            -p.size * p.aspect * 0.5,
            p.size,
            p.size * p.aspect
          );
        }
        ctx.restore();
      }

      if (elapsed < maxDurationMs && aliveCount > 0) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, width, height);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      ctx.clearRect(0, 0, width, height);
    };
  }, [active, burstKey, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={
        variant === 'viewport'
          ? `fixed inset-0 pointer-events-none z-[90] ${className}`
          : `absolute inset-0 pointer-events-none z-20 ${className}`
      }
    />
  );
};
