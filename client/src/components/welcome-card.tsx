import React from "react";

const WelcomeCard: React.FC<{ onClose?: () => void; onTour?: () => void }> = ({
  onClose,
  onTour,
}) => (
  <div className="relative w-full bg-[#8B4DFF] rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-center justify-between text-white overflow-hidden">
    {/* Main content */}
    <div className="flex-1 text-center md:text-left mb-4 md:mb-0 md:pr-6">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">
        Welcome to Harmony.ai
      </h1>
      <p className="text-sm md:text-base leading-relaxed opacity-90 max-w-xl">
        Connect with professionals, showcase your digital CV, and discover opportunities tailored to your skills.
      </p>
    </div>
    
    {/* Button section */}
    <div className="flex-shrink-0">
      <button
        className="bg-white text-[#8B4DFF] font-semibold px-5 md:px-6 py-2 md:py-3 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 text-sm md:text-base"
        onClick={onTour}
      >
        Take a Tour
      </button>
    </div>
    
    {/* Close button */}
    {onClose && (
      <button
        className="absolute top-3 right-3 text-white hover:text-gray-200 text-lg md:text-xl font-bold transition-colors duration-200"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
    )}
    
    {/* Subtle circular background decorations */}
    <div className="absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 bg-white/10 rounded-full pointer-events-none" style={{ transform: "translate(25%, -25%)" }} />
    <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full pointer-events-none" style={{ transform: "translate(-25%, 25%)" }} />
  </div>
);

export default WelcomeCard; 