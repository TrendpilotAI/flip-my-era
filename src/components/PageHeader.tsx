
export const PageHeader = () => {
  return (
    <div className="text-center space-y-4 animate-fadeIn">
      <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent 
        bg-gradient-to-r from-[#9b87f5] to-[#D946EF] drop-shadow-lg">
        FlipMyEra
      </h1>
      <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
        <span className="inline-block transform hover:scale-105 transition-transform duration-200">
          ✨ Travel back to a more hopeful timeline ✨
        </span>
        <br />
        <span className="text-sm mt-2 block text-[#7E69AB] italic">
          Discover your parallel universe story, beautifully illustrated and bound into your own keepsake memory book
        </span>
      </p>
      <div className="flex justify-center gap-2 mt-4">
        <span className="px-3 py-1 rounded-full bg-[#E5DEFF]/50 text-[#7E69AB] text-sm">
          ✨ AI-Powered
        </span>
        <span className="px-3 py-1 rounded-full bg-[#FFDEE2]/50 text-[#7E69AB] text-sm">
          🌟 Unique Stories
        </span>
        <span className="px-3 py-1 rounded-full bg-[#D3E4FD]/50 text-[#7E69AB] text-sm">
          📖 Memory Books
        </span>
      </div>
    </div>
  );
};
