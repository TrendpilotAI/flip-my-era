
export const BackgroundImages = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <img
        src="https://images.unsplash.com/photo-1518112166137-85f9979a43aa"
        alt=""
        className="absolute -right-20 -top-20 w-64 h-64 object-cover rounded-full opacity-20 rotate-12 transform scale-75 blur-sm"
      />
      <img
        src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205"
        alt=""
        className="absolute -left-32 top-1/3 w-96 h-96 object-cover rounded-full opacity-20 -rotate-12 transform scale-75 blur-sm"
      />
      <img
        src="https://images.unsplash.com/photo-1565945887714-d5139f4eb0ce"
        alt=""
        className="absolute -right-40 bottom-1/4 w-80 h-80 object-cover rounded-full opacity-20 rotate-45 transform scale-75 blur-sm"
      />
    </div>
  );
};
