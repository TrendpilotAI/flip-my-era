import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { ChevronLeft, ChevronRight, Quote, Sparkles, BookOpen, Heart } from 'lucide-react';

interface CarouselItem {
  id: number;
  type: 'story' | 'image' | 'quote';
  title?: string;
  content: string;
  author?: string;
  source?: string;
  imageUrl?: string;
  icon?: React.ReactNode;
  color: string;
}

const carouselItems: CarouselItem[] = [
  {
    id: 1,
    type: 'story',
    title: 'The Road Not Taken',
    content: "In an alternate timeline, Sarah chose to study abroad in Paris instead of staying close to home. Now she's a renowned pastry chef, running a charming café in Montmartre, where every morning she serves croissants to locals who've become her second family...",
    color: 'from-purple-500 to-pink-500',
    icon: <BookOpen className="h-6 w-6" />
  },
  {
    id: 2,
    type: 'quote',
    content: "Every choice we make creates a new universe. The question isn't what could have been, but what could still be.",
    author: "Dr. Elena Rodriguez",
    source: "Quantum Narratives Institute",
    color: 'from-blue-500 to-cyan-500',
    icon: <Quote className="h-6 w-6" />
  },
  {
    id: 3,
    type: 'image',
    title: 'Alternate Reality',
    content: "A bustling cyberpunk cityscape where neon lights reflect in rain puddles, showing a world where technology evolved differently...",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&crop=center",
    color: 'from-green-500 to-emerald-500',
    icon: <Sparkles className="h-6 w-6" />
  },
  {
    id: 4,
    type: 'story',
    title: 'The Artist\'s Path',
    content: "When Maria decided to pursue her passion for painting instead of following her family's medical tradition, she discovered a world of creativity she never knew existed. Her art now hangs in galleries worldwide...",
    color: 'from-orange-500 to-red-500',
    icon: <Heart className="h-6 w-6" />
  },
  {
    id: 5,
    type: 'quote',
    content: "The most beautiful stories are the ones that could have been, and the ones that still can be.",
    author: "Marcus Chen",
    source: "Temporal Storytelling Collective",
    color: 'from-indigo-500 to-purple-500',
    icon: <Quote className="h-6 w-6" />
  },
  {
    id: 6,
    type: 'image',
    title: 'Parallel Worlds',
    content: "A serene countryside scene with a Victorian mansion, where steam-powered technology coexists with nature in perfect harmony...",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center",
    color: 'from-teal-500 to-blue-500',
    icon: <Sparkles className="h-6 w-6" />
  }
];

const AboutCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, currentIndex]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const currentItem = carouselItems[currentIndex];

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Carousel */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        <div className="relative h-96 md:h-[500px]">
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentItem.color} opacity-90`} />
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-center p-8">
            <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl max-w-2xl w-full">
              <CardContent className="p-8 text-center">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${currentItem.color} text-white shadow-lg`}>
                    {currentItem.icon}
                  </div>
                </div>

                {/* Title */}
                {currentItem.title && (
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {currentItem.title}
                  </h3>
                )}

                {/* Content */}
                <div className="mb-6">
                  {currentItem.type === 'image' && currentItem.imageUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={currentItem.imageUrl} 
                        alt={currentItem.title || 'Alternate timeline'}
                        className="w-full h-48 object-cover rounded-lg shadow-lg mx-auto"
                      />
                      <p className="text-gray-700 italic text-lg">
                        {currentItem.content}
                      </p>
                    </div>
                  ) : (
                    <blockquote className="text-lg text-gray-700 leading-relaxed">
                      "{currentItem.content}"
                    </blockquote>
                  )}
                </div>

                {/* Author/Source */}
                {currentItem.author && (
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold">{currentItem.author}</p>
                    {currentItem.source && (
                      <p className="text-gray-500">{currentItem.source}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Buttons */}
        <Button
          onClick={prevSlide}
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <Button
          onClick={nextSlide}
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
        <div 
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300"
          style={{ 
            width: `${((currentIndex + 1) / carouselItems.length) * 100}%` 
          }}
        />
      </div>

      {/* Slide Counter */}
      <div className="text-center mt-2 text-sm text-gray-600">
        {currentIndex + 1} of {carouselItems.length}
      </div>
    </div>
  );
};

export default AboutCarousel; 