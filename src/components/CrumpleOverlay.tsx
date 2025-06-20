// components/crumpleOverlay.tsx
import React, { useEffect, useRef, ReactNode, useState } from "react";
import { cn } from "../lib/utils";

interface CrumpleOverlayProps {
  imageSrc: string;
  alt: string;
  intensity?: number;
  animationIntensity?: number;
  textureOptions?: string[];
  className?: string;
  children?: ReactNode;
}

const CrumpleOverlay: React.FC<CrumpleOverlayProps> = ({
  imageSrc,
  alt,
  intensity = 0.5,
  animationIntensity = 0.5,
  textureOptions = ["/crumpled-craft-beige-paper.jpg"], // Corrected path for public directory
  className,
  children,
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const animationRef = useRef<number>();
  const selectedTexture = textureOptions[0];

  // Animation effect
  useEffect(() => {
    if (animationIntensity <= 0) return;
    const animate = () => {
      setAnimationPhase((prev) => (prev + 0.01) % (Math.PI * 2));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationIntensity]);

  // Calculate transform based on animation phase
  const transform =
    animationIntensity > 0
      ? `translate(${Math.sin(animationPhase) * animationIntensity * 2}px, ${
          Math.cos(animationPhase) * animationIntensity * 2
        }px) rotate(${Math.sin(animationPhase) * animationIntensity * 0.5}deg)`
      : "none";

  return (
    <div className={cn("relative w-full h-full", className)}>
      {children}
      {/* Overlay always above children */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${selectedTexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: "overlay",
          opacity: intensity,
          transform,
          transformOrigin: "center",
          zIndex: 10,
        }}
      />
    </div>
  );
};

export default CrumpleOverlay;
