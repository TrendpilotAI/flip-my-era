export const BackgroundImages = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background Gradients */}
      <div className="absolute -left-32 top-1/3 w-96 h-96 bg-gradient-to-r 
        from-[#D3E4FD] to-[#FFDEE2] opacity-20 rounded-full blur-3xl animate-float" />
      
      {/* Polaroid Base Styles */}
      <style>
        {`
          .polaroid::before {
            content: '';
            position: absolute;
            width: 12px;
            height: 12px;
            background: #D32F2F;
            border-radius: 50%;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 1;
          }
        `}
      </style>
      
      {/* First Row Polaroids - Moved below interface block */}
      <div className="absolute left-10 top-[400px] w-40 h-48 bg-white p-2 shadow-xl 
        -rotate-6 transform hover:rotate-0 transition-transform duration-500 polaroid">
        <img
          src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21"
          alt="Beach waves"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Summer waves 🌊</span>
        </div>
      </div>

      <div className="absolute left-64 top-[380px] w-44 h-52 bg-white p-2 shadow-xl 
        rotate-3 transform hover:rotate-0 transition-transform duration-500 polaroid">
        <img
          src="https://images.unsplash.com/photo-1515238152791-8216bfdf89a7"
          alt="Girls night out"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Magic nights ✨</span>
        </div>
      </div>

      <div className="absolute right-48 top-[450px] w-44 h-52 bg-white p-2 shadow-xl 
        -rotate-3 transform hover:rotate-0 transition-transform duration-500 polaroid">
        <img
          src="https://images.unsplash.com/photo-1514912885225-5c9ec8507d68"
          alt="Concert lights"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Music vibes 🎵</span>
        </div>
      </div>

      <div className="absolute right-20 top-[380px] w-40 h-48 bg-white p-2 shadow-xl 
        rotate-[-5deg] transform hover:rotate-0 transition-transform duration-500 polaroid">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
          alt="Serene lake"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Lake dreams 🌲</span>
        </div>
      </div>

      <div className="absolute left-[400px] top-[420px] w-44 h-52 bg-white p-2 shadow-xl 
        rotate-[8deg] transform hover:rotate-0 transition-transform duration-500 polaroid">
        <img
          src="https://images.unsplash.com/photo-1517022812141-23620dba5c23"
          alt="Fluffy sheep"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Daydreaming 🌸</span>
        </div>
      </div>

      <div className="absolute right-[300px] top-[360px] w-40 h-48 bg-white p-2 shadow-xl 
        -rotate-[12deg] transform hover:rotate-0 transition-transform duration-500 polaroid">
        <img
          src="https://images.unsplash.com/photo-1582562124811-c09040d0a901"
          alt="Cozy cat"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Lazy days 😺</span>
        </div>
      </div>

      {/* Bottom Row Polaroids */}
      <div className="absolute right-32 bottom-32 w-44 h-52 bg-white p-2 shadow-xl 
        rotate-6 transform hover:rotate-0 transition-transform duration-500 polaroid">
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
        -rotate-12 transform hover:rotate-0 transition-transform duration-500 polaroid">
        <img
          src="https://images.unsplash.com/photo-1498936178812-4b2e558d2937"
          alt="Flying bees"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Nature's dance 🐝</span>
        </div>
      </div>

      <div className="absolute right-96 bottom-48 w-40 h-48 bg-white p-2 shadow-xl 
        rotate-[-8deg] transform hover:rotate-0 transition-transform duration-500 polaroid">
        <img
          src="https://images.unsplash.com/photo-1533230387233-b3a92f523721"
          alt="Festival crowd"
          className="w-full h-[85%] object-cover"
        />
        <div className="h-[15%] flex items-center justify-center">
          <span className="font-handwriting text-sm text-gray-600">Festival fun 🎪</span>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute right-24 bottom-48 w-24 h-24 transform rotate-[15deg]">
        <div className="w-full h-full bg-[#FEF7CD] rounded-full opacity-50 
          flex items-center justify-center font-handwriting text-2xl animate-float">
          🌈
        </div>
      </div>

      <div className="absolute right-16 top-96 w-20 h-20 transform rotate-45">
        <div className="w-full h-full bg-[#FEF7CD] rounded-star opacity-60 
          flex items-center justify-center text-2xl animate-float">
          ⭐
        </div>
      </div>

      {/* Background Gradients */}
      <div className="absolute right-1/4 -top-20 w-64 h-64 rounded-full 
        bg-gradient-to-r from-[#FFE29F] to-[#FF719A] opacity-20 blur-xl animate-float" />

      <div className="absolute left-1/3 bottom-20 w-72 h-72 
        bg-gradient-to-br from-[#accbee] to-[#e7f0fd] opacity-30 rounded-full blur-2xl 
        animate-float" />
    </div>
  );
};
