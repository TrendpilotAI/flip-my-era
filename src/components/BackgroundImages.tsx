
export const BackgroundImages = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Purple sparkly aesthetic */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient 
        from-[#E5DEFF] to-[#FFDEE2] opacity-30 blur-xl animate-float" />
      
      {/* Polaroid-style images */}
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

      {/* Dreamy cloud effect */}
      <div className="absolute -left-32 top-1/3 w-96 h-96 bg-gradient-to-r 
        from-[#D3E4FD] to-[#FFDEE2] opacity-20 rounded-full blur-3xl animate-float 
        [animation-delay:1s]" />

      {/* Star motif */}
      <div className="absolute right-20 bottom-1/4 w-80 h-80">
        <img
          src="https://images.unsplash.com/photo-1470813740244-df37b8c1edcb"
          alt=""
          className="w-full h-full object-cover rounded-full opacity-20 rotate-45 
            transform scale-75 blur-sm animate-float [animation-delay:2s]"
        />
      </div>

      {/* Floating hearts */}
      <div className="absolute left-1/4 bottom-20 w-32 h-32 bg-gradient-to-br 
        from-[#FFDEE2] to-[#E5DEFF] opacity-20 rounded-full blur-lg animate-float 
        [animation-delay:1.5s]" />

      {/* Additional decorative elements */}
      <div className="absolute right-1/3 top-20 w-24 h-24 bg-gradient-to-r 
        from-[#FFD700] to-[#FFDEE2] opacity-10 rounded-full blur-md animate-float 
        [animation-delay:0.5s]" />
    </div>
  );
};
