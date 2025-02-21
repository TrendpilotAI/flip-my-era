
export const PageHeader = () => {
  return (
    <div className="text-center space-y-4 animate-fadeIn">
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight 
        bg-clip-text text-transparent relative
        bg-gradient-to-r from-[#D946EF] via-[#8B5CF6] to-[#F97316]
        hover:from-[#F97316] hover:via-[#8B5CF6] hover:to-[#D946EF]
        transition-all duration-500 ease-in-out
        drop-shadow-[0_0_25px_rgba(217,70,239,0.2)]
        animate-shimmer">
        FlipMyEra
      </h1>
      <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
        <span className="inline-block transform hover:scale-105 transition-transform duration-200">
          ✨ Travel back to a more hopeful timeline ✨
        </span>
        <br />
        <span className="text-sm mt-2 block text-[#7E69AB] italic font-handwriting text-lg">
          Discover your parallel universe story, beautifully illustrated and bound into your own keepsake memory book
        </span>
      </p>
      <div className="flex justify-center gap-2 mt-4">
        <span className="px-3 py-1 rounded-full bg-[#E5DEFF]/50 text-[#7E69AB] text-sm hover:bg-[#E5DEFF]/70 transition-colors">
          ✨ AI-Powered
        </span>
        <span className="px-3 py-1 rounded-full bg-[#FFDEE2]/50 text-[#7E69AB] text-sm hover:bg-[#FFDEE2]/70 transition-colors">
          🌟 Unique Stories
        </span>
        <span className="px-3 py-1 rounded-full bg-[#D3E4FD]/50 text-[#7E69AB] text-sm hover:bg-[#D3E4FD]/70 transition-colors">
          📖 Memory Books
        </span>
      </div>
    </div>
  );
};
