
export const BackgroundImages = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dreamy purple cloud effect */}
      <div className="absolute -left-32 top-1/3 w-96 h-96 bg-gradient-to-r 
        from-[#D3E4FD] to-[#FFDEE2] opacity-20 rounded-full blur-3xl animate-float 
        [animation-delay:1s]" />

      {/* Original Polaroids */}
      <div className="absolute -right-20 top-32 w-48 h-56 bg-white p-2 shadow-xl 
        rotate-12 transform hover:rotate-6 transition-transform duration-500">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
          alt=""
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Your story ✨</span>
        </div>
      </div>

      {/* Rainbow Sticker */}
      <div className="absolute right-40 top-20 w-32 h-16 transform rotate-[-15deg]">
        <div className="w-full h-full bg-gradient-to-r from-[#FEC6A1] via-[#FFDEE2] to-[#E5DEFF] 
          rounded-full opacity-60 animate-float [animation-delay:2s]" />
      </div>

      {/* Unicorn Sticker */}
      <div className="absolute left-20 top-40 w-24 h-24 transform rotate-12">
        <div className="w-full h-full bg-[#FFDEE2] rounded-full opacity-40 
          flex items-center justify-center font-handwriting text-2xl">
          🦄
        </div>
      </div>

      {/* Metallica Sticker */}
      <div className="absolute right-60 bottom-32 w-40 h-16 transform rotate-[-5deg]
        bg-gradient-to-r from-[#8E9196] to-[#F1F0FB] rounded-md 
        flex items-center justify-center border-2 border-[#8E9196]">
        <span className="font-bold text-xl text-gray-800 tracking-wider">METALLICA</span>
      </div>

      {/* Anthrax Sticker */}
      <div className="absolute left-48 top-24 w-36 h-14 transform rotate-[8deg]
        bg-gradient-to-r from-[#8E9196] to-[#F1F0FB] rounded-md 
        flex items-center justify-center border-2 border-[#8E9196]">
        <span className="font-bold text-lg text-gray-800 tracking-wider">ANTHRAX</span>
      </div>

      {/* Dolphin Sticker */}
      <div className="absolute left-32 bottom-48 w-28 h-28 transform rotate-[-12deg]">
        <div className="w-full h-full bg-[#D3E4FD] rounded-full opacity-50 
          flex items-center justify-center font-handwriting text-3xl animate-float">
          🐬
        </div>
      </div>

      {/* Additional Polaroids */}
      <div className="absolute right-32 top-48 w-44 h-52 bg-white p-2 shadow-xl 
        rotate-3 transform hover:rotate-0 transition-transform duration-500 animate-float 
        [animation-delay:1.2s]">
        <img
          src="https://images.unsplash.com/photo-1582562124811-c09040d0a901"
          alt=""
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Feline friend 🐱</span>
        </div>
      </div>

      {/* More Decorative Stickers */}
      <div className="absolute right-16 bottom-40 w-20 h-20 transform rotate-45">
        <div className="w-full h-full bg-[#FEF7CD] rounded-star opacity-60 
          flex items-center justify-center text-2xl animate-float [animation-delay:2.5s]">
          ⭐
        </div>
      </div>

      <div className="absolute left-10 top-24 w-40 h-48 bg-white p-2 shadow-xl 
        -rotate-6 transform hover:rotate-0 transition-transform duration-500">
        <img
          src="https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07"
          alt=""
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Magical nights ⭐</span>
        </div>
      </div>

      <div className="absolute left-40 bottom-32 w-44 h-52 bg-white p-2 shadow-xl 
        rotate-6 transform hover:rotate-0 transition-transform duration-500 animate-float 
        [animation-delay:2.5s]">
        <img
          src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1"
          alt=""
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Sweet autumn 🍁</span>
        </div>
      </div>

      {/* Additional Nostalgic Elements */}
      <div className="absolute right-48 bottom-48 w-44 h-52 bg-white p-2 shadow-xl 
        -rotate-12 transform hover:rotate-0 transition-transform duration-500 animate-float 
        [animation-delay:1.8s]">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
          alt=""
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Festival vibes 🎪</span>
        </div>
      </div>

      <div className="absolute left-64 top-20 w-40 h-48 bg-white p-2 shadow-xl 
        rotate-9 transform hover:rotate-0 transition-transform duration-500 animate-float 
        [animation-delay:3.2s]">
        <img
          src="https://images.unsplash.com/photo-1564758866811-4780aa0a1f49"
          alt=""
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Midnight memories 🌙</span>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute right-0 bottom-0 w-64 h-64 opacity-20 animate-float [animation-delay:2.5s]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#F97316] to-[#D946EF] rounded-full blur-2xl opacity-30"></div>
        <img
          src="https://images.unsplash.com/photo-1500673922987-e212871fec22"
          alt=""
          className="w-full h-full object-cover rounded-2xl transform rotate-12"
        />
      </div>

      {/* Additional Gradients and Effects */}
      <div className="absolute left-0 bottom-1/4 w-full h-32">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D946EF] via-[#FFDEE2] to-[#E5DEFF] opacity-10 blur-3xl"></div>
      </div>

      <div className="absolute right-1/4 top-20 w-32 h-32 bg-gradient-to-br 
        from-[#FFDEE2] to-[#E5DEFF] opacity-30 rounded-full blur-lg animate-float 
        [animation-delay:3s]" />

      <div className="absolute right-1/4 -top-20 w-64 h-64 rounded-full 
        bg-gradient-to-r from-[#FFE29F] to-[#FF719A] opacity-20 blur-xl animate-float" />

      <div className="absolute left-1/3 bottom-20 w-72 h-72 
        bg-gradient-to-br from-[#accbee] to-[#e7f0fd] opacity-30 rounded-full blur-2xl 
        animate-float [animation-delay:1.5s]" />

      {/* More Stickers and Effects */}
      <div className="absolute right-24 top-96 w-24 h-24 transform rotate-[15deg]">
        <div className="w-full h-full bg-[#FEF7CD] rounded-full opacity-50 
          flex items-center justify-center font-handwriting text-2xl animate-float">
          🌈
        </div>
      </div>

      <div className="absolute left-80 bottom-40 w-28 h-28 transform rotate-[-8deg]">
        <div className="w-full h-full bg-[#F2FCE2] rounded-full opacity-40 
          flex items-center justify-center font-handwriting text-3xl">
          🎸
        </div>
      </div>
    </div>
  );
};
