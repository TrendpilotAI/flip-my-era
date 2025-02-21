
export const BackgroundImages = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dreamy purple cloud effect */}
      <div className="absolute -left-32 top-1/3 w-96 h-96 bg-gradient-to-r 
        from-[#D3E4FD] to-[#FFDEE2] opacity-20 rounded-full blur-3xl animate-float 
        [animation-delay:1s]" />

      {/* Multiple floating polaroid-style images */}
      <div className="absolute -right-20 top-32 w-48 h-56 bg-white p-2 shadow-xl 
        rotate-12 transform hover:rotate-6 transition-transform duration-500">
        <img
          src="photo-1506744038136-46273834b3fb"
          alt=""
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Your story ✨</span>
        </div>
      </div>

      <div className="absolute left-20 top-48 w-40 h-48 bg-white p-2 shadow-xl 
        -rotate-6 transform hover:rotate-0 transition-transform duration-500 animate-float 
        [animation-delay:2s]">
        <img
          src="photo-1582562124811-c09040d0a901"
          alt=""
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Cozy memories 🌟</span>
        </div>
      </div>

      {/* Gradient overlays */}
      <div className="absolute right-1/4 -top-20 w-64 h-64 rounded-full 
        bg-gradient-to-r from-[#FFE29F] to-[#FF719A] opacity-20 blur-xl animate-float" />

      <div className="absolute left-1/3 bottom-20 w-72 h-72 
        bg-gradient-to-br from-[#accbee] to-[#e7f0fd] opacity-30 rounded-full blur-2xl 
        animate-float [animation-delay:1.5s]" />

      {/* Starry night effect */}
      <div className="absolute right-20 bottom-1/4 w-80 h-80">
        <img
          src="photo-1470813740244-df37b8c1edcb"
          alt=""
          className="w-full h-full object-cover rounded-full opacity-20 rotate-45 
            transform scale-75 blur-sm animate-float [animation-delay:2s]"
        />
      </div>

      {/* Floating hearts and sparkles */}
      <div className="absolute left-1/4 bottom-20 w-32 h-32 bg-gradient-to-br 
        from-[#FFDEE2] to-[#E5DEFF] opacity-20 rounded-full blur-lg animate-float 
        [animation-delay:1.5s]" />

      <div className="absolute right-1/3 top-20 w-24 h-24 bg-gradient-to-r 
        from-[#FFD700] to-[#FFDEE2] opacity-10 rounded-full blur-md animate-float 
        [animation-delay:0.5s]" />

      {/* Mountain landscape */}
      <div className="absolute -left-10 top-20 w-64 h-40">
        <img
          src="photo-1501854140801-50d01698950b"
          alt=""
          className="w-full h-full object-cover rounded-2xl opacity-30 scale-90 blur-[2px] 
            animate-float [animation-delay:2.5s]"
        />
      </div>

      {/* Additional decorative elements */}
      <div className="absolute right-40 bottom-40 w-20 h-20 
        bg-gradient-to-r from-[#fdfcfb] to-[#e2d1c3] opacity-40 rounded-full blur-sm 
        animate-float [animation-delay:3s]" />
    </div>
  );
};
