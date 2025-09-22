import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Sparkle {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
}

export const SparkleEffect = () => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [floatingElements, setFloatingElements] = useState<Array<{id: string, x: number, y: number, size: number, color: string}>>([]);
  const counterRef = useRef(0);

  // Generate floating background elements
  useEffect(() => {
    const elements = [];
    for (let i = 0; i < 15; i++) {
      elements.push({
        id: `float-${i}`,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 6 + 2,
        color: ['#9333ea', '#ec4899', '#3b82f6', '#10b981'][Math.floor(Math.random() * 4)]
      });
    }
    setFloatingElements(elements);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only create sparkles 15% of the time and limit to max 8 sparkles
      if (Math.random() > 0.85 && sparkles.length < 8) {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        const newSparkle: Sparkle = {
          id: `${Date.now()}-${Math.random()}-${counterRef.current++}`,
          x: e.clientX + (Math.random() - 0.5) * 40, // Add some randomness to position
          y: e.clientY + (Math.random() - 0.5) * 40,
          size: Math.random() * 12 + 6,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)]
        };

        setSparkles(current => [...current, newSparkle]);

        // Remove sparkle after animation
        setTimeout(() => {
          setSparkles(current => current.filter(s => s.id !== newSparkle.id));
        }, 1500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sparkles.length]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Floating background elements */}
      {floatingElements.map(element => (
        <motion.div
          key={element.id}
          className="absolute rounded-full opacity-20"
          style={{
            left: element.x,
            top: element.y,
            width: element.size,
            height: element.size,
            backgroundColor: element.color,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Mouse-following sparkles */}
      {sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          className="absolute"
          style={{
            left: sparkle.x,
            top: sparkle.y,
          }}
          initial={{
            scale: 0,
            opacity: 0,
            rotate: sparkle.rotation
          }}
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 0.8, 0],
            rotate: sparkle.rotation + 180,
            y: [0, -30, -60]
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut"
          }}
        >
          <svg
            width={sparkle.size}
            height={sparkle.size}
            viewBox="0 0 160 160"
            className="drop-shadow-lg"
            style={{ filter: `drop-shadow(0 0 8px ${sparkle.color}40)` }}
          >
            <path
              d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
              fill={sparkle.color}
              opacity="0.8"
            />
          </svg>
        </motion.div>
      ))}

      {/* Ambient glow effect */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)"
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};
