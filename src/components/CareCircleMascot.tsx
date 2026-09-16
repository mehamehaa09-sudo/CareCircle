import React from 'react';
import poppyMascot from '../assets/poppy-mascot.png';

interface CareCircleMascotProps {
  size?: 'sm' | 'md' | 'lg';
  speaking?: boolean;
  className?: string;
}

const sizeStyles = { sm: 'w-9 h-9', md: 'w-14 h-14', lg: 'w-36 h-36' };

export const CareCircleMascot: React.FC<CareCircleMascotProps> = ({
  size = 'md',
  speaking = false,
  className = '',
}) => {
  return (
    <div
      aria-label="CareCircle assistant mascot"
      role="img"
      className={`relative shrink-0 ${sizeStyles[size]} ${speaking ? 'animate-pulse-subtle' : ''} ${className}`}
    >
      <img src={poppyMascot} alt="Poppy, the CareCircle care companion" className="w-full h-full object-contain drop-shadow-lg" />
    </div>
  );
};
