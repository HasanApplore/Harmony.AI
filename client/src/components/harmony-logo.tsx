import React from 'react';

interface HarmonyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function HarmonyLogo({ size = 'md', showText = false, className = '' }: HarmonyLogoProps) {
  const sizeClasses = {
    sm: 'h-16 w-48',
    md: 'h-24 w-72',
    lg: 'h-32 w-96',
    xl: 'h-40 w-120'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image */}
      <img 
        src="/Harmony Logo Final.png" 
        alt="Harmony.ai Logo"
        className={`${sizeClasses[size]} object-contain drop-shadow-sm`}
        style={{ maxWidth: 'none', maxHeight: 'none', imageRendering: 'crisp-edges' }}
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement('div');
            fallback.className = `${sizeClasses[size]} bg-purple-600 rounded-lg flex items-center justify-center`;
            fallback.innerHTML = `
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-3/4 h-3/4">
                <g fill="white">
                  <path d="M20 8C18.5 8 17.5 9 17.5 10.5C17.5 12 18.5 13 20 13C21.5 13 22.5 12 22.5 10.5C22.5 9 21.5 8 20 8Z"/>
                  <path d="M26.5 20C26.5 18.5 27.5 17.5 29 17.5C30.5 17.5 31.5 18.5 31.5 20C31.5 21.5 30.5 22.5 29 22.5C27.5 22.5 26.5 21.5 26.5 20Z"/>
                  <path d="M20 27C18.5 27 17.5 28 17.5 29.5C17.5 31 18.5 32 20 32C21.5 32 22.5 31 22.5 29.5C22.5 28 21.5 27 20 27Z"/>
                  <path d="M8.5 20C8.5 18.5 9.5 17.5 11 17.5C12.5 17.5 13.5 18.5 13.5 20C13.5 21.5 12.5 22.5 11 22.5C9.5 22.5 8.5 21.5 8.5 20Z"/>
                  <circle cx="20" cy="20" r="2" fill="white"/>
                </g>
              </svg>
            `;
            parent.appendChild(fallback);
          }
        }}
      />
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-bold text-purple-600 ml-2 ${textSizes[size]}`}>
          Harmony<span className="text-purple-400">.ai</span>
        </span>
      )}
    </div>
  );
} 