import { useState } from 'react';
import { motion } from 'framer-motion';
import { type EraType, ERA_CONFIG } from '@/modules/story/types/eras';
import eraImages from '@/modules/story/data/eraImages.json';
import { Check } from 'lucide-react';

interface TemplatePickerProps {
  selectedEra: EraType | null;
  onSelect: (era: EraType) => void;
}

export function TemplatePicker({ selectedEra, onSelect }: TemplatePickerProps) {
  const eras = Object.values(ERA_CONFIG);

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-900 via-pink-800 to-blue-900 bg-clip-text text-transparent dark:from-purple-100 dark:via-pink-200 dark:to-blue-100">
        Choose Your Era ✨
      </h2>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
        Each era creates a unique story style, tone, and illustration aesthetic
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {eras.map((era, i) => {
          const img = eraImages[era.id as keyof typeof eraImages];
          const selected = selectedEra === era.id;

          return (
            <motion.button
              key={era.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(era.id)}
              className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                selected
                  ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700 shadow-lg shadow-purple-200 dark:shadow-purple-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
              }`}
            >
              {/* Image */}
              <div className="aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-800 dark:to-gray-700 relative overflow-hidden">
                {img ? (
                  <img
                    src={img}
                    alt={era.displayName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${era.colorScheme.gradient} flex items-center justify-center`}>
                    <span className="text-5xl">🎵</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                {/* Description on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-1 group-hover:translate-y-0">
                  <p className="text-xs leading-tight">{era.description}</p>
                </div>

                {/* Selected checkmark */}
                {selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <div className={`p-2.5 text-center transition-colors ${
                selected
                  ? 'bg-purple-50 dark:bg-purple-900/30'
                  : 'bg-white dark:bg-gray-800'
              }`}>
                <p className={`font-semibold text-sm ${
                  selected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {era.displayName}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
