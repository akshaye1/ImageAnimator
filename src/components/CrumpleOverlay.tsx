import React from 'react';

interface CrumpleOverlayProps {
  intensity: number;
}

const CrumpleOverlay: React.FC<CrumpleOverlayProps> = ({ intensity }) => {
  const textureUrl = '/crumple-texture.jpg'; // Replace with the actual path to your texture image

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${textureUrl})`,
        backgroundSize: 'cover',
        opacity: intensity,
        mixBlendMode: 'overlay', // You can experiment with other blend modes
        pointerEvents: 'none', // Make sure it doesn't block clicks on the image
      }}
    />
  );
};

export default CrumpleOverlay;
