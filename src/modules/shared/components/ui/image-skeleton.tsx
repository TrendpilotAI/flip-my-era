import { cn } from '@/core/lib/utils';

interface ImageSkeletonProps {
  aspectRatio?: 'square' | 'video' | 'portrait';
  useTaylorSwiftThemes?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const ImageSkeleton = ({ 
  aspectRatio = 'video', 
  useTaylorSwiftThemes = false,
  showLabel = false,
  className 
}: ImageSkeletonProps) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video', 
    portrait: 'aspect-[3/4]'
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border-2 border-dashed transition-all duration-300",
      aspectRatioClasses[aspectRatio],
      useTaylorSwiftThemes 
        ? "bg-purple-50 border-purple-200" 
        : "bg-gray-100 border-gray-300",
      className
    )}>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r animate-shimmer",
        useTaylorSwiftThemes
          ? "from-purple-100 via-purple-200 to-purple-100"
          : "from-gray-200 via-gray-300 to-gray-200"
      )} 
      style={{
        backgroundSize: '200% 100%',
      }}
      />
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-sm font-medium",
            useTaylorSwiftThemes ? "text-purple-600" : "text-gray-600"
          )}>
            Loading illustration...
          </span>
        </div>
      )}
    </div>
  );
};