
export const BackgroundImages = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background Gradients */}
      <div className="absolute -left-32 top-1/3 w-96 h-96 bg-gradient-to-r 
        from-[#D3E4FD] to-[#FFDEE2] opacity-20 rounded-full blur-3xl animate-float 
        [animation-delay:1s]" />
      
      {/* Beach and Fireworks Polaroids - Top Section */}
      <div className="absolute left-10 top-24 w-40 h-48 bg-white p-2 shadow-xl 
        -rotate-6 transform hover:rotate-0 transition-transform duration-500">
        <img
          src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21"
          alt="Beach waves"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Summer vibes 🌊</span>
        </div>
      </div>

      <div className="absolute right-48 top-32 w-44 h-52 bg-white p-2 shadow-xl 
        rotate-3 transform hover:rotate-0 transition-transform duration-500">
        <img
          src="https://images.unsplash.com/photo-1535916707207-35f97e715e1c"
          alt="Sparklers"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Magic nights ✨</span>
        </div>
      </div>

      {/* Band Stickers - Left Side */}
      <div className="absolute left-48 top-96 w-48 h-16 transform rotate-[-8deg]
        bg-gradient-to-r from-[#8E9196] to-[#F1F0FB] rounded-md 
        flex items-center justify-center border-2 border-[#8E9196]">
        <span className="font-bold text-xl text-gray-800 tracking-wider 
          bg-clip-text text-transparent bg-gradient-to-r from-[#FF719A] to-[#FFA99F]">
          CRANBERRIES
        </span>
      </div>

      <div className="absolute left-20 bottom-48 w-44 h-14 transform rotate-[12deg]
        bg-gradient-to-r from-[#8E9196] to-[#F1F0FB] rounded-md 
        flex items-center justify-center border-2 border-[#8E9196]">
        <span className="font-bold text-lg text-gray-800 tracking-wider
          bg-clip-text text-transparent bg-gradient-to-r from-[#FFE29F] to-[#FF719A]">
          TALKING HEADS
        </span>
      </div>

      <div className="absolute left-64 top-20 w-40 h-16 transform rotate-[-5deg]
        bg-gradient-to-r from-[#8E9196] to-[#F1F0FB] rounded-md 
        flex items-center justify-center border-2 border-[#8E9196]">
        <span className="font-bold text-xl text-gray-800 tracking-wider
          bg-clip-text text-transparent bg-gradient-to-r from-[#FEC6A1] to-[#E5DEFF]">
          DAVID BOWIE
        </span>
      </div>

      {/* Decorative Elements - Right Side */}
      <div className="absolute right-24 bottom-48 w-24 h-24 transform rotate-[15deg]">
        <div className="w-full h-full bg-[#FEF7CD] rounded-full opacity-50 
          flex items-center justify-center font-handwriting text-2xl animate-float">
          🌈
        </div>
      </div>

      <div className="absolute right-40 top-20 w-32 h-16 transform rotate-[-15deg]">
        <div className="w-full h-full bg-gradient-to-r from-[#FEC6A1] via-[#FFDEE2] to-[#E5DEFF] 
          rounded-full opacity-60 animate-float [animation-delay:2s]" />
      </div>

      {/* Nature and Memories Polaroids - Bottom Section */}
      <div className="absolute right-32 bottom-32 w-44 h-52 bg-white p-2 shadow-xl 
        rotate-6 transform hover:rotate-0 transition-transform duration-500 animate-float 
        [animation-delay:1.2s]">
        <img
          src="https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07"
          alt="Starry night"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Starlit dreams ⭐</span>
        </div>
      </div>

      <div className="absolute left-40 bottom-32 w-44 h-52 bg-white p-2 shadow-xl 
        -rotate-12 transform hover:rotate-0 transition-transform duration-500">
        <img
          src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1"
          alt="Autumn leaves"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Sweet autumn 🍁</span>
        </div>
      </div>

      {/* Additional Decorative Elements */}
      <div className="absolute left-80 bottom-40 w-28 h-28 transform rotate-[-8deg]">
        <div className="w-full h-full bg-[#F2FCE2] rounded-full opacity-40 
          flex items-center justify-center font-handwriting text-3xl">
          🎸
        </div>
      </div>

      <div className="absolute right-16 top-96 w-20 h-20 transform rotate-45">
        <div className="w-full h-full bg-[#FEF7CD] rounded-star opacity-60 
          flex items-center justify-center text-2xl animate-float [animation-delay:2.5s]">
          ⭐
        </div>
      </div>

      {/* Background Gradients */}
      <div className="absolute right-1/4 -top-20 w-64 h-64 rounded-full 
        bg-gradient-to-r from-[#FFE29F] to-[#FF719A] opacity-20 blur-xl animate-float" />

      <div className="absolute left-1/3 bottom-20 w-72 h-72 
        bg-gradient-to-br from-[#accbee] to-[#e7f0fd] opacity-30 rounded-full blur-2xl 
        animate-float [animation-delay:1.5s]" />
    </div>
  );
};
