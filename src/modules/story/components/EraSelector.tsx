import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllEras, type EraConfig, type EraType } from '../types/eras';
import generatedImages from '../data/generatedImages.json';
import { cn } from '@/core/lib/utils';

interface EraSelectorProps {
  onEraSelect: (era: EraType) => void;
  className?: string;
}

export const EraSelector: React.FC<EraSelectorProps> = ({ onEraSelect, className }) => {
  const [hoveredEra, setHoveredEra] = useState<EraType | null>(null);
  const eras = getAllEras();

  // Update imageUrls from generated images
  const erasWithImages = eras.map(era => ({
    ...era,
    imageUrl: generatedImages.eras[era.id] || era.imageUrl
  }));

  return (
    <div className={cn("relative mx-auto max-w-6xl px-4 py-12", className)}>
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#f4d7ff] via-[#edd6ff] to-[#f8e9ff] opacity-95" />
      <div className="absolute inset-4 -z-10 rounded-[48px] bg-[radial-gradient(circle_at_top,#ecb8ff_0%,transparent_75%)] opacity-80 blur-[28px]" />

      <div className="mb-14 text-center">
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent 
                     bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Choose Your Era
        </motion.h1>
        <motion.p
          className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Select the Taylor Swift era that resonates with your story's vibe
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[280px]"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {erasWithImages.map((era, index) => (
          <motion.div
            key={era.id}
            className="relative overflow-hidden rounded-[28px] cursor-pointer group shadow-lg"
            onClick={() => onEraSelect(era.id)}
            onMouseEnter={() => setHoveredEra(era.id)}
            onMouseLeave={() => setHoveredEra(null)}
            variants={{
              hidden: { y: 50, scale: 0.9, opacity: 0 },
              visible: {
                y: 0,
                scale: 1,
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                  delay: index * 0.08
                }
              }
            }}
            whileHover={{ scale: 1.03, zIndex: 10 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={era.imageUrl}
                alt={era.displayName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            {/* Gradient Overlay */}
            <div 
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-60 group-hover:opacity-40 transition-opacity duration-300",
                era.colorScheme.gradient
              )}
            />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
              
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0.9 }}
                animate={{ 
                  opacity: hoveredEra === era.id ? 1 : 0.9,
                  y: hoveredEra === era.id ? -4 : 0
                }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-white text-2xl font-semibold mb-2 drop-shadow-lg">
                  {era.displayName}
                </h3>
                <p className="text-white/90 text-sm leading-snug line-clamp-3 drop-shadow-md">
                  {era.description}
                </p>
              </motion.div>

              {/* Animated Border */}
              <motion.div
                className="absolute inset-0 rounded-[28px] border-2 border-white/0 group-hover:border-white/40 transition-colors duration-300"
                initial={false}
                animate={{
                  boxShadow: hoveredEra === era.id 
                    ? '0 0 20px rgba(255, 255, 255, 0.3)' 
                    : '0 0 0px rgba(255, 255, 255, 0)'
                }}
              />
            </div>

            {/* Sparkle Effect on Hover */}
            <AnimatePresence>
              {hoveredEra === era.id && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-1.5 w-1.5 rounded-full bg-white"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + (i % 3) * 20}%`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 0.5
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="text-center mt-8 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
              Tap a card to begin your storytelling journey
      </motion.p>
    </div>
  );
};
