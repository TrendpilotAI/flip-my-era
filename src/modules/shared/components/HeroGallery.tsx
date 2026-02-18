import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/core/lib/utils";
import { Button } from "@/modules/shared/components/ui/button";
import { ArrowDown } from "lucide-react";

export const HeroGallery = ({
  animationDelay = 0.5,
  onGetStarted
}: {
  animationDelay?: number;
  onGetStarted?: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);

    const animationTimer = setTimeout(
      () => {
        setIsLoaded(true);
      },
      (animationDelay + 0.4) * 1000
    );

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(animationTimer);
    };
  }, [animationDelay]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const photoVariants = {
    hidden: () => ({
      x: 0,
      y: 80,
      opacity: 0,
      scale: 0.9,
    }),
    visible: (custom: HeroCardPosition) => ({
      x: custom.offsetX,
      y: custom.offsetY,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 14,
        mass: 1,
        delay: custom.order * 0.12,
      },
    }),
  };

  // Load generated images from JSON
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load hero gallery images from the local generated images
    import('@/modules/story/data/generatedImagesLocal.json')
      .then(data => {
        const heroImages: Record<string, string> = {};
        if (data.heroGallery && Array.isArray(data.heroGallery)) {
          type HeroDataItem = { id: string; bestImage: { url: string } };
          (data.heroGallery as HeroDataItem[]).forEach((item) => {
            // Fix the path: remove /public prefix since public files are served from root
            const correctedPath = item.bestImage.url.replace('/public', '');
            heroImages[item.id] = correctedPath;
          });
        }
        setGeneratedImages(heroImages);
      })
      .catch(err => {
        console.log('Hero gallery images not yet generated, using placeholders');
      });
  }, []);

  interface HeroCardPosition {
    offsetX: number;
    offsetY: number;
    order: number;
    rotateY: number;
    rotateZ: number;
    scale?: number;
    zIndex: number;
    width: number;
    height: number;
    imageKey: string;
    alt: string;
  }

  const heroCards: HeroCardPosition[] = [
    {
      imageKey: 'hero-7',
      alt: 'Midnights Era',
      offsetX: -520,
      offsetY: 46,
      rotateY: 24,
      rotateZ: -9,
      scale: 0.94,
      order: 0,
      zIndex: 40,
      width: 240,
      height: 340,
    },
    {
      imageKey: 'hero-6',
      alt: 'Lover Era',
      offsetX: -360,
      offsetY: 28,
      rotateY: 18,
      rotateZ: -7,
      scale: 0.96,
      order: 1,
      zIndex: 50,
      width: 248,
      height: 340,
    },
    {
      imageKey: 'hero-5',
      alt: 'Reputation Era',
      offsetX: -210,
      offsetY: 12,
      rotateY: 12,
      rotateZ: -5,
      scale: 0.98,
      order: 2,
      zIndex: 60,
      width: 255,
      height: 345,
    },
    {
      imageKey: 'hero-1',
      alt: 'Showgirl Era',
      offsetX: 0,
      offsetY: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1.08,
      order: 3,
      zIndex: 120,
      width: 280,
      height: 360,
    },
    {
      imageKey: 'hero-2',
      alt: 'Folklore Era',
      offsetX: 210,
      offsetY: 12,
      rotateY: -12,
      rotateZ: 5,
      scale: 0.98,
      order: 4,
      zIndex: 60,
      width: 255,
      height: 345,
    },
    {
      imageKey: 'hero-3',
      alt: '1989 Era',
      offsetX: 360,
      offsetY: 30,
      rotateY: -18,
      rotateZ: 7,
      scale: 0.96,
      order: 5,
      zIndex: 50,
      width: 248,
      height: 340,
    },
    {
      imageKey: 'hero-4',
      alt: 'Red Era',
      offsetX: 520,
      offsetY: 48,
      rotateY: -24,
      rotateZ: 9,
      scale: 0.94,
      order: 6,
      zIndex: 40,
      width: 240,
      height: 340,
    },
  ];

  return (
    <div className="relative mt-32">
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#fde2ff] via-[#f3e8ff] to-[#ede9fe] opacity-90" />
      <div className="absolute inset-[8%] -z-10 rounded-[56px] bg-[radial-gradient(circle_at_top,#f6d3ff_0%,transparent_65%)] opacity-70 blur-[40px]" />
      <div className="absolute inset-0 max-md:hidden top-[180px] -z-10 h-[340px] w-full bg-transparent bg-[linear-gradient(to_right,rgba(147,51,234,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(236,72,153,0.2)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-70 [mask-image:radial-gradient(ellipse_90%_60%_at_50%_-10%,#000_60%,transparent_110%)]" />

      <p className="lg:text-md my-2 text-center text-xs font-light uppercase tracking-widest text-purple-600 dark:text-purple-400">
        A Journey Through Taylor Swift's Eras
      </p>
      
      <h1 className="z-20 mx-auto max-w-4xl justify-center bg-gradient-to-r from-purple-900 via-pink-800 to-blue-900 bg-clip-text py-3 text-center text-4xl text-transparent dark:bg-gradient-to-r dark:from-purple-100 dark:via-pink-200 dark:to-blue-100 md:text-7xl font-bold">
        Flip My <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text"> Era</span>
      </h1>
      
      <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-lg max-w-2xl mx-auto px-4">
        Upload your photo. Pick your era. Get a beautifully illustrated personalized storybook in under 60 seconds.
      </p>

      <div className="relative mb-10 h-[460px] w-full items-center justify-center lg:flex">
        <motion.div
          className="relative mx-auto flex w-full max-w-7xl justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="relative flex w-full justify-center"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <div className="relative h-[380px] w-[900px]">
              {[...heroCards].map((card) => (
                <motion.div
                  key={card.imageKey}
                  className="absolute left-1/2 top-12 -translate-x-1/2"
                  style={{
                    zIndex: card.zIndex,
                    width: card.width,
                    height: card.height,
                  }}
                  variants={photoVariants}
                  custom={card}
                >
                  <Photo
                    width={card.width}
                    height={card.height}
                    src={generatedImages[card.imageKey] || placeholders[card.imageKey]}
                    alt={card.alt}
                    rotateY={card.rotateY}
                    rotateZ={card.rotateZ}
                    scale={card.scale}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="flex flex-col items-center justify-center gap-4">
        <Button
          size="lg"
          onClick={onGetStarted}
          className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:from-purple-700 hover:to-pink-600 px-10 py-7 text-lg font-bold shadow-2xl hover:shadow-purple-500/25 transition-all"
        >
          Create Your Story Free
          <ArrowDown className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ✨ No credit card required • 10 free credits to start
        </p>
      </div>
    </div>
  );
};

const placeholders: Record<string, string> = {
  'hero-1': "https://placehold.co/320x400/FF6B35/white?text=Showgirl",
  'hero-2': "https://placehold.co/320x400/8B7355/white?text=Folklore",
  'hero-3': "https://placehold.co/320x400/87CEEB/white?text=1989",
  'hero-4': "https://placehold.co/320x400/8B0000/white?text=Red",
  'hero-5': "https://placehold.co/320x400/000000/white?text=Reputation",
  'hero-6': "https://placehold.co/320x400/FFB6C1/white?text=Lover",
  'hero-7': "https://placehold.co/320x400/191970/white?text=Midnights",
};

const Photo = ({
  src,
  alt,
  width,
  height,
  rotateY,
  rotateZ,
  scale = 1,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  rotateY: number;
  rotateZ: number;
  scale?: number;
}) => {
  return (
    <motion.div
      style={{
        width,
        height,
        transformStyle: "preserve-3d",
      }}
      className="relative mx-auto shrink-0"
      initial={{ rotateY, rotateZ, scale }}
      animate={{ rotateY, rotateZ, scale }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      whileHover={{
        rotateY: rotateY * 0.4,
        rotateZ: rotateZ * 0.4,
        scale: scale + 0.08,
        zIndex: 200,
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[32px] shadow-xl ring-1 ring-white/30 transition-shadow duration-300">
        <img
          className="h-full w-full object-cover"
          src={src}
          alt={alt}
          draggable={false}
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/20" />
      </div>
    </motion.div>
  );
};
