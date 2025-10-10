import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { ImageSkeleton } from '@/modules/shared/components/ui/image-skeleton';
import { StreamingProgress } from '@/modules/ebook/components/StreamingProgress';
import { AnimatedShaderBackground } from '@/modules/shared/components/AnimatedShaderBackground';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/modules/shared/components/ui/dialog';
import { useStreamingGeneration } from '@/modules/story/hooks/useStreamingGeneration';
import { useStoryWizard } from '../contexts/StoryWizardContext';
import { generateTaylorSwiftIllustration } from '@/modules/story/services/ai';
import { TaylorSwiftTheme } from '@/modules/story/utils/storyPrompts';

interface ChapterView {
  index: number;
  title: string;
  content: string;
  imageUrl?: string;
  isImageLoading: boolean;
  imageError?: string;
}

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  scale: number;
}

const eraToTheme = (era?: string | null): TaylorSwiftTheme => {
  switch (era) {
    case 'lover':
      return 'first-love';
    case 'reputation':
      return 'heartbreak';
    case 'red':
      return 'heartbreak';
    case 'midnights':
      return 'friendship';
    case 'folklore-evermore':
      return 'coming-of-age';
    case 'showgirl':
      return 'first-love';
    default:
      return 'coming-of-age';
  }
};

const formatToLabel: Record<string, string> = {
  preview: 'Story Preview',
  'short-story': 'Short Story',
  novella: 'Novella'
};

const buildOriginalStoryText = (args: {
  logline?: string;
  chapters?: Array<{ number: number; title: string; summary: string; wordCountTarget: number }>;
  threeActs?: {
    act1: { setup: string; incitingIncident: string; firstPlotPoint: string };
    act2: { risingAction: string; midpoint: string; darkNightOfTheSoul: string };
    act3: { climax: string; resolution: string; closingImage: string };
  };
  themes?: string[];
}) => {
  const segments: string[] = [];
  if (args.logline) {
    segments.push(`Logline: ${args.logline}`);
  }
  if (args.themes?.length) {
    segments.push(`Themes: ${args.themes.join(', ')}`);
  }
  if (args.threeActs) {
    segments.push(
      [
        'Three-Act Structure:',
        `Act 1 - Setup: ${args.threeActs.act1.setup}`,
        `Inciting Incident: ${args.threeActs.act1.incitingIncident}`,
        `First Plot Point: ${args.threeActs.act1.firstPlotPoint}`,
        `Act 2 - Rising Action: ${args.threeActs.act2.risingAction}`,
        `Midpoint: ${args.threeActs.act2.midpoint}`,
        `Dark Night of the Soul: ${args.threeActs.act2.darkNightOfTheSoul}`,
        `Act 3 - Climax: ${args.threeActs.act3.climax}`,
        `Resolution: ${args.threeActs.act3.resolution}`,
        `Closing Image: ${args.threeActs.act3.closingImage}`
      ].join('\n')
    );
  }
  if (args.chapters?.length) {
    const chapterSummaries = args.chapters
      .map(
        (chapter) =>
          `Chapter ${chapter.number}: ${chapter.title} (Target ~${chapter.wordCountTarget} words)\nSummary: ${chapter.summary}`
      )
      .join('\n\n');
    segments.push(`Chapter Outline:\n${chapterSummaries}`);
  }

  return segments.join('\n\n');
};

const buildStoryMarkdown = (chapters: ChapterView[], title: string) => {
  const body = chapters
    .map((chapter, index) => `## Chapter ${index + 1}: ${chapter.title}\n\n${chapter.content}`)
    .join('\n\n');
  return `# ${title}\n\n${body}`;
};

export const StoryAutoGeneration = () => {
  const {
    state: {
      storyline,
      selectedFormat,
      selectedEra,
      characterName,
      location,
      gender,
      latestGeneratedStory,
      latestGeneratedChapters
    },
    goToStep,
    setLatestGeneratedStory
  } = useStoryWizard();

  const streaming = useStreamingGeneration();

  const [chapters, setChapters] = useState<ChapterView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const chapterIndices = useRef<Set<number>>(new Set());
  const hasStarted = useRef(false);
  const confettiIdRef = useRef(0);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [showStoryModal, setShowStoryModal] = useState(false);

  const totalChapters = storyline?.chapters.length || (selectedFormat === 'preview' ? 1 : selectedFormat === 'novella' ? 8 : 5);
  const selectedTheme = eraToTheme(selectedEra);

  const originalStory = useMemo(
    () =>
      buildOriginalStoryText({
        logline: storyline?.logline,
        chapters: storyline?.chapters,
        threeActs: storyline?.threeActStructure,
        themes: storyline?.themes
      }),
    [storyline]
  );

  const storyTitle = useMemo(() => {
    if (storyline?.logline) {
      return storyline.logline.length > 80 ? `${storyline.logline.slice(0, 77)}...` : storyline.logline;
    }
    if (storyline?.chapters?.[0]?.title) {
      return storyline.chapters[0].title;
    }
    return 'Your Alternate Timeline Story';
  }, [storyline]);

  const launchConfetti = useCallback(() => {
    const pieces = Array.from({ length: 22 }, () => {
      confettiIdRef.current += 1;
      return {
        id: confettiIdRef.current,
        left: Math.random() * 100,
        color: Math.random() > 0.5 ? '#f97316' : '#facc15',
        delay: Math.random() * 0.2,
        duration: 2.2 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 60,
        rotate: 180 + Math.random() * 360,
        scale: 0.6 + Math.random() * 0.8
      } satisfies ConfettiPiece;
    });

    setConfettiPieces((prev) => [...prev, ...pieces]);

    pieces.forEach((piece) => {
      window.setTimeout(() => {
        setConfettiPieces((prev) => prev.filter((p) => p.id !== piece.id));
      }, (piece.duration + piece.delay) * 1000);
    });
  }, []);

  const handleChapterComplete = useCallback(
    async (chapter: { title: string; content: string; id?: string }) => {
      const chapterNumber = chapter.id ? Number(chapter.id.replace('chapter-', '')) || chapters.length + 1 : chapters.length + 1;
      const chapterIndex = chapterNumber - 1;

      if (!chapterIndices.current.has(chapterIndex)) {
        chapterIndices.current.add(chapterIndex);
        setChapters((prev) => [
          ...prev,
          {
            index: chapterIndex,
            title: chapter.title || `Chapter ${chapterNumber}`,
            content: chapter.content,
            isImageLoading: true
          }
        ]);

        launchConfetti();

        try {
          const imageUrl = await generateTaylorSwiftIllustration({
            chapterTitle: chapter.title || `Chapter ${chapterNumber}`,
            chapterContent: chapter.content,
            theme: selectedTheme,
            useEnhancedPrompts: true
          });

          setChapters((prev) =>
            prev.map((item) =>
              item.index === chapterIndex
                ? {
                    ...item,
                    imageUrl,
                    isImageLoading: false,
                    imageError: undefined
                  }
                : item
            )
          );
        } catch (imageError) {
          console.error('Image generation failed:', imageError);
          setChapters((prev) =>
            prev.map((item) =>
              item.index === chapterIndex
                ? {
                    ...item,
                    isImageLoading: false,
                    imageError: imageError instanceof Error ? imageError.message : 'Failed to generate illustration.'
                  }
                : item
            )
          );
        }
      } else {
        setChapters((prev) =>
          prev.map((item) =>
            item.index === chapterIndex
              ? {
                  ...item,
                  title: chapter.title || item.title,
                  content: chapter.content
                }
              : item
          )
        );
      }
    },
    [chapters.length, launchConfetti, selectedTheme]
  );

  const handleComplete = useCallback(
    (generatedChapters: Array<{ title: string; content: string }>) => {
      if (!generatedChapters.length) return;

      const mergedChapters = generatedChapters.map((chapter, idx) => ({
        index: idx,
        title: chapter.title,
        content: chapter.content,
        isImageLoading: chapters.find((c) => c.index === idx)?.isImageLoading ?? true,
        imageUrl: chapters.find((c) => c.index === idx)?.imageUrl,
        imageError: chapters.find((c) => c.index === idx)?.imageError
      }));

      setChapters(mergedChapters);

      const markdown = buildStoryMarkdown(
        mergedChapters,
        storyline?.logline || storyline?.chapters?.[0]?.title || 'Your Alternate Timeline Story'
      );

      setLatestGeneratedStory(markdown, storyline?.chapters || null);
    },
    [chapters, setLatestGeneratedStory, storyline]
  );

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  useEffect(() => {
    if (!storyline || !selectedFormat) {
      goToStep('story-details');
      return;
    }

    if (!hasStarted.current) {
      hasStarted.current = true;
      streaming
        .startGeneration({
          originalStory,
          useTaylorSwiftThemes: true,
          selectedTheme,
          selectedFormat,
          numChapters: totalChapters,
          storyline,
          onChapterComplete: handleChapterComplete,
          onComplete: handleComplete,
          onError: handleError
        })
        .catch((startError) => {
          console.error('Streaming generation failed to start:', startError);
          setError(startError instanceof Error ? startError.message : 'Failed to start generation');
        });
    }
  }, [
    storyline,
    selectedFormat,
    originalStory,
    selectedTheme,
    totalChapters,
    streaming,
    handleChapterComplete,
    handleComplete,
    handleError,
    goToStep
  ]);

  useEffect(() => () => streaming.resetGeneration(), [streaming]);

  const latestChapter = streaming.chapters[streaming.chapters.length - 1];

  return (
    <div className="relative py-12 px-4 sm:px-6 lg:px-8">
      <AnimatedShaderBackground className="pointer-events-none opacity-60" />

      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => goToStep('format-selection')}
          className="flex items-center gap-2 w-fit text-gray-600 hover:text-purple-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to format selection
        </Button>

        <motion.div
          className="relative glass-card border border-white/30 shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-purple-50/30 to-pink-50/30 dark:from-gray-900/60 dark:via-purple-950/40 dark:to-gray-900/40" />
          <div className="absolute inset-0 pointer-events-none">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                className="chapter-confetti-piece"
                style={{
                  left: `${piece.left}%`,
                  animationDuration: `${piece.duration}s`,
                  animationDelay: `${piece.delay}s`,
                  background: piece.color,
                  transform: `scale(${piece.scale})`,
                  '--confetti-drift': `${piece.drift}px`,
                  '--confetti-rotate': `${piece.rotate}deg`
                } as React.CSSProperties & Record<string, string>}
              />
            ))}
          </div>

          <div className="relative p-8 space-y-10">
            <header className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-600">
                  {formatToLabel[selectedFormat || 'short-story']} • {totalChapters} chapter{totalChapters === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-5">
                <div className="relative mx-auto h-32 w-32 rounded-full border border-white/40 bg-white/40 shadow-inner">
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/70 via-pink-500/60 to-orange-400/60 blur-xl" />
                  <div className="absolute inset-3 rounded-full border border-white/40 bg-white/70 backdrop-blur" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg">
                      <Sparkles className="h-7 w-7 animate-pulse" />
                      <div className="absolute inset-1 rounded-full border border-white/40" />
                    </div>
                  </div>
                  <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-white/40" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400">
                  Streaming your alternate timeline…
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Sit tight while we craft your story, chapter by chapter, complete with bespoke illustrations inspired by the {selectedEra || 'Taylor Swift'} era.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
                {characterName && <Badge variant="outline">Lead: {characterName}</Badge>}
                {location && <Badge variant="outline">Setting: {location}</Badge>}
                {gender && <Badge variant="outline">Perspective: {gender}</Badge>}
                <Badge variant="secondary">Theme: {selectedTheme.replace('-', ' ')}</Badge>
              </div>
            </header>

            <StreamingProgress
              currentChapter={streaming.currentChapter || (chapters.length ? chapters.length : 0)}
              totalChapters={streaming.totalChapters || totalChapters}
              progress={streaming.progress}
              message={streaming.message}
              chapterTitle={latestChapter?.title}
              estimatedTimeRemaining={streaming.estimatedTimeRemaining}
              isComplete={streaming.isComplete}
              useTaylorSwiftThemes
            />

            {error && (
              <Card className="border-red-200 bg-red-50/80">
                <CardHeader>
                  <CardTitle className="text-red-600 text-lg">Generation encountered an issue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => streaming.resetGeneration()}>
                      Retry
                    </Button>
                    <Button variant="ghost" onClick={() => goToStep('storyline-preview')}>
                      Adjust story details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-8">
              {chapters.length === 0 && !streaming.isComplete && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  <p className="text-sm">Summoning your first chapter…</p>
                </div>
              )}

              <div className="space-y-6">
                {chapters
                  .sort((a, b) => a.index - b.index)
                  .map((chapter) => (
                    <motion.div
                      key={chapter.index}
                      className="relative bg-white/70 dark:bg-gray-900/60 border border-white/40 rounded-3xl overflow-hidden shadow-xl backdrop-blur-md"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: chapter.index * 0.1 }}
                    >
                      <div className="grid md:grid-cols-[2fr,1fr] gap-0">
                        <div className="p-8 space-y-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-white/70 backdrop-blur">
                              Chapter {chapter.index + 1}
                            </Badge>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                              {chapter.title}
                            </h2>
                          </div>
                          <div className="space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed">
                            {chapter.content.split('\n\n').map((paragraph, idx) => (
                              <p key={idx}>{paragraph}</p>
                            ))}
                          </div>
                        </div>

                        <div className="relative min-h-[260px] md:min-h-full border-t md:border-t-0 md:border-l border-white/40">
                          {chapter.imageUrl ? (
                            <img
                              src={chapter.imageUrl}
                              alt={`Illustration for ${chapter.title}`}
                              className="w-full h-full object-cover"
                            />
                          ) : chapter.isImageLoading ? (
                            <div className="flex h-full items-center justify-center p-6">
                              <ImageSkeleton
                                aspectRatio="video"
                                useTaylorSwiftThemes
                                showLabel
                                className="w-full"
                              />
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center p-6 text-sm text-gray-400">
                              {chapter.imageError || 'Illustration unavailable'}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {streaming.isComplete && !error && (
              <motion.div
                className="flex flex-col items-center gap-4 border border-purple-200/60 bg-gradient-to-r from-white/80 via-purple-50/70 to-pink-50/70 p-8 rounded-3xl shadow-inner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                  <h3 className="text-2xl font-semibold text-gray-800">Story generation complete!</h3>
                  <Sparkles className="h-6 w-6 text-pink-500" />
                </div>
                <p className="text-gray-600 text-center max-w-xl">
                  Your illustrated chapters are ready. Download or share the story, or jump back to tweak any details.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button variant="outline" onClick={() => goToStep('storyline-preview')}>
                    Refine storyline
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg hover:shadow-xl"
                    onClick={() => setShowStoryModal(true)}
                  >
                    View Final Story
                  </Button>
                  <Button variant="ghost" onClick={() => goToStep('era-selection')}>
                    Start a new story
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <Dialog open={showStoryModal} onOpenChange={setShowStoryModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Your Generated Story</DialogTitle>
            <DialogDescription>Review the final chapters before sharing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {chapters.map((chapter) => (
              <Card key={chapter.index} className="bg-white/90 border border-purple-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Chapter {chapter.index + 1}: {chapter.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {chapter.content}
                  </p>
                  {chapter.imageUrl && (
                    <img
                      src={chapter.imageUrl}
                      alt={chapter.title}
                      className="w-full rounded-lg border border-purple-100"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowStoryModal(false)}>
              Close
            </Button>
            <Button onClick={() => goToStep('storyline-preview')}>
              Continue to Storyline Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryAutoGeneration;

