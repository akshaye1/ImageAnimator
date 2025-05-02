"use client";

import type React from 'react';
import { useMemo } from 'react';

interface TornImageProps {
  svgRef: React.RefObject<SVGSVGElement>;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  tearAmount: number; // Controls the frequency/intensity of the tear
  shadowDirection: number; // Angle in degrees (0 = right, 90 = bottom, etc.)
  shadowIntensity: number; // Controls blur and spread (0-100)
  shadowColor: string; // Hex color string
  edgeThickness: number; // Controls the border width (0-100 scale)
}

// Basic hex color validation (allows #rgb and #rrggbb)
const isValidHexColor = (color: string): boolean => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);

// Define base border width ratio and maximum allowed ratio
const BASE_BORDER_WIDTH_RATIO = 0.01; // Start with a smaller base ratio
const MAX_BORDER_WIDTH_RATIO = 0.15; // Maximum border width relative to image size

// Helper function to convert hex color and opacity to rgba string
const hexToRgba = (hex: string, alpha: number): string => {
  let r = 0, g = 0, b = 0;
  const validHex = isValidHexColor(hex) ? hex : '#000000'; // Fallback to black if invalid

  if (validHex.length === 4) { // #RGB
    r = parseInt(validHex[1] + validHex[1], 16);
    g = parseInt(validHex[2] + validHex[2], 16);
    b = parseInt(validHex[3] + validHex[3], 16);
  } else if (validHex.length === 7) { // #RRGGBB
    r = parseInt(validHex.substring(1, 3), 16);
    g = parseInt(validHex.substring(3, 5), 16);
    b = parseInt(validHex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Make sure to export the component!
export function TornImage({
  svgRef,
  imageUrl,
  imageWidth,
  imageHeight,
  tearAmount,
  shadowDirection,
  shadowIntensity,
  shadowColor,
  edgeThickness,
}: TornImageProps) {
  const safeShadowColor = useMemo(() => {
    return isValidHexColor(shadowColor) ? shadowColor : '#000000';
  }, [shadowColor]);

  const filterIdBase = useMemo(() => `filter-${Math.random().toString(36).substring(7)}`, []);
  const combinedFilterId = `${filterIdBase}-tear-border-shadow`;

  // --- Border Width Calculation ---
  const borderWidthRatio = useMemo(() => {
    if (edgeThickness <= 0) return 0; // No border if thickness is 0 or less
    const normalizedThickness = Math.max(0, Math.min(100, edgeThickness)) / 100; // Normalize 0-1
    return BASE_BORDER_WIDTH_RATIO + normalizedThickness * (MAX_BORDER_WIDTH_RATIO - BASE_BORDER_WIDTH_RATIO);
  }, [edgeThickness]);

  const borderWidth = useMemo(() => {
    if (borderWidthRatio === 0) return 0;
    return Math.max(1, Math.round(Math.min(imageWidth, imageHeight) * borderWidthRatio));
  }, [imageWidth, imageHeight, borderWidthRatio]);

  // --- Tear Effect Calculation (applied to border) ---
  const safeTearAmount = Math.max(0, Math.min(100, tearAmount));
  const tearTurbulenceFrequency = Math.max(0.001, 0.005 + Math.pow(safeTearAmount / 100, 1.5) * 0.05);
  const tearNumOctaves = Math.max(1, Math.round(1 + (safeTearAmount / 100) * 4));
  const tearDisplacementScale = Math.max(0, 1 + (safeTearAmount / 100) * 70);
  const tearSeed = Math.floor((safeTearAmount * 123 + tearDisplacementScale * 456) % 1000);

  // --- Shadow Calculation (applied to border or directly to image if no border) ---
  const safeShadowIntensity = Math.max(0, Math.min(100, shadowIntensity));
  const angleRad = (shadowDirection * Math.PI) / 180;
  const baseOffset = 1 + (safeShadowIntensity / 100) * 15;
  const shadowOffsetX = Math.round(Math.cos(angleRad) * baseOffset);
  const shadowOffsetY = Math.round(Math.sin(angleRad) * baseOffset);
  const shadowBlur = 0.5 + (safeShadowIntensity / 100) * 15;
  const shadowOpacity = 0.1 + (safeShadowIntensity / 100) * 0.6;

  // --- Padding Calculation ---
  const padding = useMemo(() => {
    // If no border, padding only needs to account for shadow
    if (borderWidth === 0) {
      return Math.max(Math.abs(shadowOffsetX) + shadowBlur * 2, Math.abs(shadowOffsetY) + shadowBlur * 2, 10) + 5;
    }
    // If border exists, consider border, shadow, and tear displacement
    return Math.max(
      borderWidth * 1.5,
      Math.abs(shadowOffsetX) + shadowBlur * 2,
      Math.abs(shadowOffsetY) + shadowBlur * 2, // Add Y offset consideration
      tearDisplacementScale * 1.1,
      10 // Minimum padding
    ) + 5; // Safety margin
  }, [borderWidth, shadowOffsetX, shadowOffsetY, shadowBlur, tearDisplacementScale]); // Added shadowOffsetY dependency

  // Total dimensions including border (or just image if no border)
  const totalWidth = imageWidth + borderWidth * 2;
  const totalHeight = imageHeight + borderWidth * 2;

  // ViewBox dimensions including padding
  const viewBoxWidth = totalWidth + padding * 2;
  const viewBoxHeight = totalHeight + padding * 2;

  const svgDefs = useMemo(() => {
    // No need for complex SVG filters if edgeThickness is 0
    if (borderWidth === 0) return null;

    return (
      <defs>
        {/* Define clip path based on the image */}
        <clipPath id={`image-clip-${filterIdBase}`}>
          <image
            x={padding + borderWidth}
            y={padding + borderWidth}
            width={imageWidth}
            height={imageHeight}
            href={imageUrl}
          />
        </clipPath>

        <filter
          id={combinedFilterId}
          x={`-${(padding / viewBoxWidth) * 100}%`}
          y={`-${(padding / viewBoxHeight) * 100}%`}
          width={`${(viewBoxWidth) / totalWidth * 100}%`}
          height={`${(viewBoxHeight) / totalHeight * 100}%`}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          {/* === Extract Alpha Channel from Image === */}
          <feImage
            href={imageUrl}
            x={padding + borderWidth}
            y={padding + borderWidth}
            width={imageWidth}
            height={imageHeight}
            result="sourceImage"
          />
          
          {/* Extract alpha channel and dilate it to create border area */}
          <feComponentTransfer in="sourceImage" result="alphaChannel">
            <feFuncR type="linear" slope="0" intercept="0"/>
            <feFuncG type="linear" slope="0" intercept="0"/>
            <feFuncB type="linear" slope="0" intercept="0"/>
            <feFuncA type="linear" slope="1" intercept="0"/>
          </feComponentTransfer>
          
          {/* Dilate the alpha channel to create border area */}
          <feMorphology 
            in="alphaChannel" 
            operator="dilate" 
            radius={borderWidth} 
            result="dilatedAlpha"
          />

          {/* === Tear Effect Chain === */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${tearTurbulenceFrequency} ${tearTurbulenceFrequency * 0.5}`}
            numOctaves={tearNumOctaves}
            seed={tearSeed}
            result="tearTurbulenceMap"
          />
          
          {/* Apply displacement to the dilated alpha for torn effect */}
          <feDisplacementMap
            in="dilatedAlpha"
            in2="tearTurbulenceMap"
            scale={tearDisplacementScale}
            xChannelSelector="R"
            yChannelSelector="A"
            result="tornMask"
          />

          {/* === Create outer border only === */}
          {/* Subtract original alpha from torn dilated alpha to get just the border area */}
          <feComposite
            in="tornMask"
            in2="alphaChannel"
            operator="out"
            result="borderOnlyMask"
          />

          {/* === Shadow Generation === */}
          <feFlood floodColor={safeShadowColor} floodOpacity={shadowOpacity} result="shadowColorFlood"/>
          <feComposite in="shadowColorFlood" in2="borderOnlyMask" operator="in" result="coloredMask"/>
          <feOffset in="coloredMask" dx={shadowOffsetX} dy={shadowOffsetY} result="offsetColoredMask"/>
          <feGaussianBlur in="offsetColoredMask" stdDeviation={shadowBlur} result="shadowGraphicBlurred"/>

          {/* === Border Generation === */}
          <feFlood floodColor="#FFFFFF" result="whiteFlood"/>
          <feComposite in="whiteFlood" in2="borderOnlyMask" operator="in" result="whiteBorder"/>

          {/* === Final Composite (Shadow under border) === */}
          <feMerge>
            <feMergeNode in="shadowGraphicBlurred" />
            <feMergeNode in="whiteBorder" />
          </feMerge>
        </filter>
      </defs>
    );
  }, [
    borderWidth,
    combinedFilterId,
    filterIdBase,
    imageUrl,
    imageWidth,
    imageHeight,
    padding,
    totalWidth,
    totalHeight,
    viewBoxWidth,
    viewBoxHeight,
    shadowOffsetX,
    shadowOffsetY,
    shadowBlur,
    safeShadowColor,
    shadowOpacity,
    tearTurbulenceFrequency,
    tearNumOctaves,
    tearSeed,
    tearDisplacementScale,
  ]);

  // --- CSS Drop Shadow (for borderless case) ---
  const cssDropShadowStyle = useMemo(() => {
    if (borderWidth > 0 || safeShadowIntensity <= 0) return {}; // Only apply if border is 0 and shadow intensity > 0
    const shadowColorRgba = hexToRgba(safeShadowColor, shadowOpacity);
    return {
      filter: `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColorRgba})`,
      // Position the image within the SVG considering padding
      transform: `translate(${padding}px, ${padding}px)`,
    };
  }, [borderWidth, safeShadowIntensity, shadowOffsetX, shadowOffsetY, shadowBlur, safeShadowColor, shadowOpacity, padding]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      // Adjust viewBox to include padding around the total size (image + border, or just image if no border)
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      // Constrain SVG display size
      style={{
        maxWidth: `${viewBoxWidth}px`,
        maxHeight: `${viewBoxHeight}px`,
        overflow: 'visible'
      }}
    >
      {svgDefs}

      {/* Render based on whether border exists */}
      {borderWidth > 0 ? (
        <>
          {/* 1. Apply the filter to a rectangle that covers the image area */}
          <rect
            x={padding}
            y={padding}
            width={totalWidth}
            height={totalHeight}
            fill="white"
            filter={`url(#${combinedFilterId})`}
          />
          
          {/* 2. Draw the original image on top */}
          <image
            x={padding + borderWidth}
            y={padding + borderWidth}
            width={imageWidth}
            height={imageHeight}
            href={imageUrl}
            style={{ imageRendering: 'auto' }}
          />
        </>
      ) : (
        /* Render only the image with CSS drop-shadow if no border */
        <image
          width={imageWidth}
          height={imageHeight}
          href={imageUrl}
          style={{
            imageRendering: 'auto',
            ...cssDropShadowStyle,
          }}
        />
      )}
    </svg>
  );
}

// To ensure the module has a default export too (optional)
export default TornImage;