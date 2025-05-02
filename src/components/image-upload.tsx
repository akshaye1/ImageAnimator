
"use client";

import type React from "react";
import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";
import NextImage from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageUpload: (imageDataUrl: string, width: number, height: number) => void;
  onImageRemove: () => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  disabled?: boolean; // Added disabled prop
}

export function ImageUpload({ onImageUpload, onImageRemove, isDragging, setIsDragging, disabled = false }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File | null) => {
    if (disabled) return; // Prevent processing if disabled
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (e.g., PNG, JPG, WEBP).",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;

        const img = document.createElement('img');
        img.onload = () => {
          setPreviewUrl(result);
          setFileName(file.name);
          onImageUpload(result, img.naturalWidth, img.naturalHeight);
        };
        img.onerror = () => {
          toast({
            title: "Error Reading Image",
            description: "Could not determine image dimensions.",
            variant: "destructive",
          });
        };
        img.src = result;
      };
      reader.onerror = () => {
        toast({
          title: "Error Reading File",
          description: "Could not read the selected file.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload, toast, disabled]); // Added disabled to dependency array


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    processFile(event.target.files?.[0] ?? null);
     // Reset input value to allow uploading the same file again
     if(event.target) event.target.value = '';
  };

  const handleRemoveImage = () => {
    if (disabled) return;
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageRemove();
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setTimeout(() => {
       if (!e.currentTarget.contains(e.relatedTarget as Node)) {
         setIsDragging(false);
       }
     }, 50);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
       processFile(files[0]);
       e.dataTransfer.clearData();
    }
  };

  const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    // Prevent opening file dialog if disabled or if clicking the remove button
    if (disabled || (e.target as HTMLElement).closest('button[aria-label="Remove image"]')) {
      e.preventDefault();
    }
  };


  return (
    <div className="w-full space-y-4">
      {/* Hidden Actual Input */}
       <Input
        ref={fileInputRef}
        id="image-upload-input"
        type="file"
        accept="image/png, image/jpeg, image/webp" // Accept common image types
        className="sr-only" // Visually hide the input
        onChange={handleFileChange}
        disabled={disabled} // Disable input
        />

       {/* Visible Drop Area Label */}
       <Label
         htmlFor="image-upload-input" // Links label click to the hidden input
         className={cn(
           "relative flex flex-col items-center justify-center w-full min-h-[150px] border-2 border-dashed rounded-xl transition-colors duration-300 ease-in-out",
           disabled
             ? "bg-muted/50 cursor-not-allowed border-muted" // Disabled state style
             : isDragging
               ? "border-primary bg-primary/10 cursor-copy" // Highlight when dragging over
               : "border-border bg-card hover:border-primary/50 hover:bg-accent cursor-pointer", // Default and hover state
           previewUrl && !disabled && "border-solid border-primary/50 bg-accent/50 p-2" // Style when image is loaded
         )}
         onDragEnter={handleDragEnter}
         onDragLeave={handleDragLeave}
         onDragOver={handleDragOver}
         onDrop={handleDrop}
         onClick={handleLabelClick} // Added click handler
        >
         {previewUrl ? (
            // Image Preview State
            <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
               <NextImage
                 src={previewUrl}
                 alt="Uploaded preview"
                 width={100} // Smaller preview size
                 height={100}
                 className="max-h-24 w-auto object-contain rounded-md mb-2"
               />
               <p className={cn("text-xs font-medium text-foreground truncate max-w-[80%]", disabled && "text-muted-foreground")}>{fileName || 'Image Loaded'}</p>
               <p className={cn("text-[10px] text-muted-foreground", disabled ? "hidden" : "")}>Click or drop to replace</p>
               <Button
                 variant="ghost"
                 size="icon"
                 className={cn(
                     "absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                     disabled && "hidden" // Hide remove button when disabled
                 )}
                 onClick={(e) => {
                   e.stopPropagation(); // Prevent label click when clicking remove button
                   e.preventDefault(); // Prevent default button behavior if any
                   handleRemoveImage();
                 }}
                 aria-label="Remove image"
                 disabled={disabled} // Disable button
               >
                 <X className="h-4 w-4" />
               </Button>
            </div>
         ) : (
             // Initial Upload State
            <div className="flex flex-col items-center justify-center py-6 text-center">
               <UploadCloud className={cn(
                   "w-10 h-10 mb-3",
                   disabled ? "text-muted-foreground/50" : isDragging ? "text-primary animate-bounce" : "text-muted-foreground"
               )} strokeWidth={1.5} />
               <p className={cn(
                   "mb-1 text-sm font-medium",
                    disabled ? "text-muted-foreground/70" : isDragging ? "text-primary" : "text-foreground"
               )}>
                 {disabled ? "Processing..." : isDragging ? "Drop it here!" : "Click to upload or drag & drop"}
               </p>
               <p className={cn("text-xs text-muted-foreground", disabled && "hidden")}>
                 PNG, JPG, WEBP supported
               </p>
            </div>
          )}
      </Label>
    </div>
  );
}
