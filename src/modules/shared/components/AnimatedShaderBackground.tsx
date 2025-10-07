import React, { useEffect, useRef } from 'react';
import { cn } from '@/core/lib/utils';

interface AnimatedShaderBackgroundProps {
  className?: string;
}

export const AnimatedShaderBackground: React.FC<AnimatedShaderBackgroundProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createGradient = (ctx: CanvasRenderingContext2D, time: number) => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Animated color stops inspired by Taylor Swift eras
      const hue1 = (time * 0.5) % 360;
      const hue2 = (time * 0.5 + 120) % 360;
      const hue3 = (time * 0.5 + 240) % 360;
      
      gradient.addColorStop(0, `hsla(${280 + Math.sin(time * 0.001) * 20}, 70%, 60%, 0.3)`); // Purple
      gradient.addColorStop(0.5, `hsla(${330 + Math.sin(time * 0.001 + 1) * 20}, 70%, 65%, 0.3)`); // Pink
      gradient.addColorStop(1, `hsla(${210 + Math.sin(time * 0.001 + 2) * 20}, 70%, 55%, 0.3)`); // Blue
      
      return gradient;
    };

    const animate = () => {
      if (!canvas || !ctx) return;
      
      time += 1;
      
      // Clear canvas with slight fade effect
      ctx.fillStyle = 'rgba(250, 250, 255, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create animated gradient mesh
      for (let i = 0; i < 3; i++) {
        ctx.save();
        
        // Create flowing shapes
        ctx.beginPath();
        const waveHeight = 200;
        const waveCount = 4;
        
        for (let x = 0; x <= canvas.width; x += 10) {
          const y = canvas.height / 2 + 
            Math.sin((x / canvas.width) * Math.PI * waveCount + time * 0.003 + i * 2) * waveHeight +
            Math.sin(time * 0.002 + i) * 50;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        
        // Apply gradient
        const gradient = createGradient(ctx, time + i * 100);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.1;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 30;
        ctx.shadowColor = `hsla(${280 + i * 50}, 70%, 60%, 0.3)`;
        ctx.fill();
        
        ctx.restore();
      }
      
      // Add floating particles
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time * 0.001 + i * 0.5) + 1) * canvas.width / 2;
        const y = ((time * 0.5 + i * 20) % canvas.height);
        const size = Math.sin(time * 0.005 + i) * 2 + 3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${280 + i * 5}, 70%, 70%, ${0.3 + Math.sin(time * 0.01 + i) * 0.2})`;
        ctx.fill();
      }
      
      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={cn(
          "fixed inset-0 w-full h-full pointer-events-none",
          className
        )}
        style={{ 
          zIndex: 0,
          opacity: 0.4,
        }}
      />
      {/* Overlay gradient for better text readability */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.1) 100%)',
          zIndex: 1
        }}
      />
    </>
  );
};
