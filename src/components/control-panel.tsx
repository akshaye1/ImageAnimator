
"use client";

import type React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ControlPanelProps {
  tearAmount: number;
  onTearAmountChange: (value: number) => void;
  shadowDirection: number;
  onShadowDirectionChange: (value: number) => void;
  shadowIntensity: number;
  onShadowIntensityChange: (value: number) => void;
  shadowColor: string;
  onShadowColorChange: (value: string) => void;
  disabled?: boolean; // Add disabled prop
}

export function ControlPanel({
  tearAmount,
  onTearAmountChange,
  shadowDirection,
  onShadowDirectionChange,
  shadowIntensity,
  onShadowIntensityChange,
  shadowColor,
  onShadowColorChange,
  disabled = false, // Default to false
}: ControlPanelProps) {
  return (
    <Card className={`w-full max-w-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <CardHeader>
        <CardTitle className="text-lg">Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Torn Edge Control */}
        <div className="space-y-3">
          <Label htmlFor="tear-amount" className="flex justify-between items-center">
            <span>Tear Amount</span>
            <span className="text-sm text-muted-foreground">{tearAmount}</span>
          </Label>
          <Slider
            id="tear-amount"
            min={0}
            max={100}
            step={1}
            value={[tearAmount]}
            onValueChange={(value) => onTearAmountChange(value[0])}
            aria-label="Tear Amount"
            disabled={disabled}
          />
        </div>

        <Separator />

        {/* Shadow Controls */}
        <div className="space-y-3">
           <Label htmlFor="shadow-direction" className="flex justify-between items-center">
             <span>Shadow Direction</span>
            <span className="text-sm text-muted-foreground">{shadowDirection}°</span>
           </Label>
           <Slider
            id="shadow-direction"
            min={0}
            max={360}
            step={1}
            value={[shadowDirection]}
            onValueChange={(value) => onShadowDirectionChange(value[0])}
            aria-label="Shadow Direction"
            disabled={disabled}
          />
        </div>

         <div className="space-y-3">
           <Label htmlFor="shadow-intensity" className="flex justify-between items-center">
             <span>Shadow Intensity</span>
            <span className="text-sm text-muted-foreground">{shadowIntensity}</span>
           </Label>
           <Slider
            id="shadow-intensity"
            min={0}
            max={100}
            step={1}
            value={[shadowIntensity]}
            onValueChange={(value) => onShadowIntensityChange(value[0])}
            aria-label="Shadow Intensity"
            disabled={disabled}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="shadow-color" className="flex items-center space-x-2">
             <span>Shadow Color</span>
           </Label>
           <div className="flex items-center space-x-2">
             <Input
                id="shadow-color-picker" // Unique ID for color picker
                type="color"
                value={shadowColor}
                onChange={(e) => onShadowColorChange(e.target.value)}
                className="h-8 w-12 p-1 cursor-pointer"
                aria-label="Shadow Color Picker"
                disabled={disabled}
              />
               <Input
                id="shadow-color-input" // Unique ID for text input
                type="text"
                value={shadowColor}
                onChange={(e) => onShadowColorChange(e.target.value)}
                className="h-8 flex-1 text-sm"
                aria-label="Shadow Color Hex Input"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" // Basic hex pattern validation
                disabled={disabled}
              />
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
