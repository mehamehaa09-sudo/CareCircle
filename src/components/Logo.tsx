import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = false }) => {
  const sizeClasses = {
    sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4', text: 'text-base', sub: 'text-[10px]' },
    md: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5', text: 'text-lg', sub: 'text-xs' },
    lg: { box: 'w-13 h-13 rounded-2xl', icon: 'w-7 h-7', text: 'text-2xl', sub: 'text-sm' },
    xl: { box: 'w-16 h-16 rounded-3xl', icon: 'w-8 h-8', text: 'text-3xl', sub: 'text-base' },
  }[size];

  return (
    <div className="flex items-center space-x-3">
      {/* Custom CareCircle Brandmark in Butter Yellow */}
      <div
        className={`${sizeClasses.box} bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex items-center justify-center text-amber-950 shadow-md shadow-amber-400/30 ring-2 ring-yellow-200 relative overflow-hidden flex-shrink-0`}
      >
        {/* Subtle decorative concentric circle glow */}
        <div className="absolute inset-0 border border-white/40 rounded-full scale-75 opacity-70"></div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses.icon} text-amber-950 stroke-current`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer caring embrace circle with open warmth */}
          <path d="M12 2a10 10 0 1 0 10 10" strokeDasharray="3 3" />
          <circle cx="12" cy="12" r="9" className="stroke-amber-900" />
          {/* Care heart + Rx pill inside */}
          <path
            d="M12 7.5v5M9.5 10h5"
            stroke="currentColor"
            strokeWidth="2.4"
            className="text-amber-950"
          />
          <path
            d="M8.5 15.5c1 1.5 3.5 2 3.5 2s2.5-.5 3.5-2"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-900"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5">
          <span className={`font-bold ${sizeClasses.text} tracking-tight text-amber-950`}>
            Care<span className="text-amber-600">Circle</span>
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
        </div>
        {showSubtitle && (
          <span className={`${sizeClasses.sub} text-amber-800/80 font-medium`}>
            Connected Senior & Caregiver Health
          </span>
        )}
      </div>
    </div>
  );
};
