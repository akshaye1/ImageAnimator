// components/crumpleOverlay.tsx
import React, { useState } from "react";

interface CrumpleOverlayProps {
  imageSrc: string;
  alt: string;
  intensity?: number; // Optional prop to control opacity
  textureOptions?: string[]; // Optional prop for multiple texture variations
}

const CrumpleOverlay: React.FC<CrumpleOverlayProps> = ({
  imageSrc,
  alt,
  intensity = 0.5, // Default intensity
  textureOptions = ["studio-master\crumpled-craft-beige-paper.jpg"], // Default texture
}) => {
  const [selectedTexture, setSelectedTexture] = useState(textureOptions[0]);
  const [isEffectEnabled, setIsEffectEnabled] = useState(true);

  return (
    <div className="relative inline-block">
      <img src={imageSrc} alt={alt} className="w-full h-auto" />
      {isEffectEnabled && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${selectedTexture})`,
            mixBlendMode: "overlay", // Blending technique
            opacity: intensity, // Control intensity
          }}
        ></div>
      )}
      {/* Customization Controls */}
      <div className="mt-2 flex gap-2">
        <label>
          Intensity:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={intensity}
            onChange={(e) => setSelectedTexture(e.target.value)}
          />
        </label>
        <label>
          Texture:
          <select
            value={selectedTexture}
            onChange={(e) => setSelectedTexture(e.target.value)}
          >
            {textureOptions.map((texture, index) => (
              <option key={index} value={texture}>
                Texture {index + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={isEffectEnabled}
            onChange={(e) => setIsEffectEnabled(e.target.checked)}
          />
          Enable Effect
        </label>
      </div>
    </div>
  );
};

export default CrumpleOverlay;
