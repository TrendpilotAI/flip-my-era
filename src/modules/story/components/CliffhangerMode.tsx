import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Chapter {
  title: string;
  content: string;
}

interface CliffhangerModeProps {
  chapters: Chapter[];
  isPremium: boolean;
  onUnlock: () => void;
}

const FREE_CHAPTER_COUNT = 2;

// ─── Component ───────────────────────────────────────────────────────────────

export const CliffhangerMode: React.FC<CliffhangerModeProps> = ({
  chapters,
  isPremium,
  onUnlock,
}) => {
  const [activeChapter, setActiveChapter] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lockedCount = isPremium ? 0 : Math.max(0, chapters.length - FREE_CHAPTER_COUNT);
  const isLocked = (index: number) => !isPremium && index >= FREE_CHAPTER_COUNT;

  const scrollToChapter = (index: number) => {
    if (isLocked(index)) return;
    setActiveChapter(index);
    chapterRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Track active chapter on scroll
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-chapter-index'));
            if (!isNaN(idx)) setActiveChapter(idx);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    chapterRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [chapters.length, isPremium]);

  const getFirstParagraph = (content: string) => {
    const paragraphs = content.split('\n').filter((p) => p.trim());
    return paragraphs[0] || content.slice(0, 200);
  };

  return (
    <div className="flex gap-4 max-w-4xl mx-auto w-full">
      {/* Chapter navigation sidebar */}
      <div className="hidden md:flex flex-col gap-1 w-48 shrink-0 sticky top-4 self-start">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Chapters
        </p>
        {chapters.map((chapter, i) => (
          <button
            key={i}
            onClick={() => scrollToChapter(i)}
            className={cn(
              'text-left text-sm px-3 py-2 rounded-lg transition-colors truncate',
              activeChapter === i
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-accent text-muted-foreground',
              isLocked(i) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLocked(i) ? '🔒 ' : ''}
            {i + 1}. {chapter.title}
          </button>
        ))}

        {lockedCount > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              {lockedCount} more chapter{lockedCount > 1 ? 's' : ''} locked
            </p>
          </div>
        )}
      </div>

      {/* Chapter content */}
      <div ref={contentRef} className="flex-1 space-y-8 min-w-0">
        {chapters.map((chapter, i) => (
          <div
            key={i}
            ref={(el) => { chapterRefs.current[i] = el; }}
            data-chapter-index={i}
          >
            {!isLocked(i) ? (
              /* Unlocked chapter */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        Chapter {i + 1}
                      </Badge>
                      <h3 className="text-lg font-bold">{chapter.title}</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {chapter.content.split('\n').map((paragraph, pi) =>
                        paragraph.trim() ? (
                          <p key={pi} className="mb-3 leading-relaxed text-foreground/90">
                            {paragraph}
                          </p>
                        ) : null
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* Locked chapter - show first paragraph blurred */
              i === FREE_CHAPTER_COUNT ? (
                <div className="relative">
                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="text-xs opacity-50">
                          Chapter {i + 1}
                        </Badge>
                        <h3 className="text-lg font-bold opacity-50">{chapter.title}</h3>
                      </div>
                      {/* Blurred preview */}
                      <div className="relative">
                        <p className="text-foreground/90 leading-relaxed blur-[6px] select-none">
                          {getFirstParagraph(chapter.content)}
                        </p>
                        {/* Gradient fade overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lock overlay */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
                      <CardContent className="p-6 text-center space-y-4">
                        <div className="text-4xl">🔒</div>
                        <h4 className="text-lg font-bold">
                          Unlock the rest of this story
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {lockedCount} more chapter{lockedCount > 1 ? 's' : ''}, including the dramatic finale
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button onClick={onUnlock} size="lg" className="gap-2">
                            ✨ Upgrade to Speak Now
                          </Button>
                          <Button
                            onClick={onUnlock}
                            variant="outline"
                            size="lg"
                            className="gap-2"
                          >
                            🎫 Use 2 credits to unlock
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              ) : null /* Don't render anything for chapters beyond the first locked one */
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CliffhangerMode;
