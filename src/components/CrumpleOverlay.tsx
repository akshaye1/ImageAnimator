// components/crumpleOverlay.tsx
import React from 'react';

interface CrumpleOverlayProps {
  imageSrc: string;
  alt: string;
}

const CrumpleOverlay: React.FC<CrumpleOverlayProps> = ({ imageSrc, alt }) => {
  return (
    <div className="relative inline-block">
      <img src={imageSrc} alt={alt} className="w-full h-auto" />
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url(/crumpled-paper.png)' }}
      ></div>
    </div>
  );
};

export default CrumpleOverlay;
