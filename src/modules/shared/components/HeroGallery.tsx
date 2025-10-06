import { useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
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
    hidden: { opacity: 1 },
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
      y: 0,
      rotate: 0,
      scale: 1,
    }),
    visible: (custom: { x: any; y: any; order: number }) => ({
      x: custom.x,
      y: custom.y,
      rotate: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 12,
        mass: 1,
        delay: custom.order * 0.15,
      },
    }),
  };

  // Load generated images from JSON
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load hero gallery images
    fetch('/src/modules/story/data/generatedImages.json')
      .then(res => res.json())
      .then(data => {
        setGeneratedImages(data.heroGallery || {});
      })
      .catch(err => {
        console.log('Hero gallery images not yet generated, using placeholders');
      });
  }, []);

  // Photos with all 7 ERA theme images (from generated images or placeholders)
  const photos = [
    {
      id: 1,
      order: 0,
      x: "-420px",
      y: "15px",
      zIndex: 70,
      direction: "left" as const,
      src: generatedImages['hero-1'] || "https://placehold.co/220x220/FF6B35/white?text=Showgirl",
      alt: "Showgirl Era"
    },
    {
      id: 2,
      order: 1,
      x: "-280px",
      y: "32px",
      zIndex: 60,
      direction: "left" as const,
      src: generatedImages['hero-2'] || "https://placehold.co/220x220/8B7355/white?text=Folklore",
      alt: "Folklore Era"
    },
    {
      id: 3,
      order: 2,
      x: "-140px",
      y: "8px",
      zIndex: 50,
      direction: "left" as const,
      src: generatedImages['hero-3'] || "https://placehold.co/220x220/87CEEB/white?text=1989",
      alt: "1989 Era"
    },
    {
      id: 4,
      order: 3,
      x: "0px",
      y: "22px",
      zIndex: 40,
      direction: "right" as const,
      src: generatedImages['hero-4'] || "https://placehold.co/220x220/8B0000/white?text=Red",
      alt: "Red Era"
    },
    {
      id: 5,
      order: 4,
      x: "140px",
      y: "12px",
      zIndex: 30,
      direction: "right" as const,
      src: generatedImages['hero-5'] || "https://placehold.co/220x220/000000/white?text=Reputation",
      alt: "Reputation Era"
    },
    {
      id: 6,
      order: 5,
      x: "280px",
      y: "28px",
      zIndex: 20,
      direction: "right" as const,
      src: generatedImages['hero-6'] || "https://placehold.co/220x220/FFB6C1/white?text=Lover",
      alt: "Lover Era"
    },
    {
      id: 7,
      order: 6,
      x: "420px",
      y: "18px",
      zIndex: 10,
      direction: "left" as const,
      src: generatedImages['hero-7'] || "https://placehold.co/220x220/191970/white?text=Midnights",
      alt: "Midnights Era"
    },
  ];

  return (
    <div className="mt-40 relative">
      <div className="absolute inset-0 max-md:hidden top-[200px] -z-10 h-[300px] w-full bg-transparent bg-[linear-gradient(to_right,#9333ea_1px,transparent_1px),linear-gradient(to_bottom,#9333ea_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      
      <p className="lg:text-md my-2 text-center text-xs font-light uppercase tracking-widest text-purple-600 dark:text-purple-400">
        A Journey Through Taylor Swift's Eras
      </p>
      
      <h3 className="z-20 mx-auto max-w-4xl justify-center bg-gradient-to-r from-purple-900 via-pink-800 to-blue-900 bg-clip-text py-3 text-center text-4xl text-transparent dark:bg-gradient-to-r dark:from-purple-100 dark:via-pink-200 dark:to-blue-100 md:text-7xl font-bold">
        Flip My <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text"> Era</span>
      </h3>
      
      <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
        Transform your story idea into a beautifully crafted narrative inspired by Taylor Swift's iconic storytelling eras
      </p>

      <div className="relative mb-8 h-[350px] w-full items-center justify-center lg:flex">
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
            <div className="relative h-[220px] w-[220px]">
              {[...photos].reverse().map((photo) => (
                <motion.div
                  key={photo.id}
                  className="absolute left-0 top-0"
                  style={{ zIndex: photo.zIndex }}
                  variants={photoVariants}
                  custom={{
                    x: photo.x,
                    y: photo.y,
                    order: photo.order,
                  }}
                >
                  <Photo
                    width={220}
                    height={220}
                    src={photo.src}
                    alt={photo.alt}
                    direction={photo.direction}
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
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 px-8 py-6 text-lg shadow-lg"
        >
          Choose Your Era
          <ArrowDown className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Start your storytelling journey
        </p>
      </div>
    </div>
  );
};

function getRandomNumberInRange(min: number, max: number): number {
  if (min >= max) {
    throw new Error("Min value should be less than max value");
  }
  return Math.random() * (max - min) + min;
}

type Direction = "left" | "right";

const Photo = ({
  src,
  alt,
  className,
  direction,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  direction?: Direction;
  width: number;
  height: number;
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const x = useMotionValue(200);
  const y = useMotionValue(200);

  useEffect(() => {
    const randomRotation =
      getRandomNumberInRange(1, 4) * (direction === "left" ? -1 : 1);
    setRotation(randomRotation);
  }, [direction]);

  function handleMouse(event: {
    currentTarget: { getBoundingClientRect: () => any };
    clientX: number;
    clientY: number;
  }) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  const resetMouse = () => {
    x.set(200);
    y.set(200);
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      whileTap={{ scale: 1.2, zIndex: 9999 }}
      whileHover={{
        scale: 1.1,
        rotateZ: 2 * (direction === "left" ? -1 : 1),
        zIndex: 9999,
      }}
      whileDrag={{
        scale: 1.1,
        zIndex: 9999,
      }}
      initial={{ rotate: 0 }}
      animate={{ rotate: rotation }}
      style={{
        width,
        height,
        perspective: 400,
        transform: `rotate(0deg) rotateX(0deg) rotateY(0deg)`,
        zIndex: 1,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "none",
      }}
      className={cn(
        className,
        "relative mx-auto shrink-0 cursor-grab active:cursor-grabbing"
      )}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      draggable={false}
      tabIndex={0}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <img
          className="rounded-3xl object-cover w-full h-full"
          src={src}
          alt={alt}
          draggable={false}
          loading="lazy"
        />
      </div>
    </motion.div>
  );
};
