
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
}

export function ImageUpload({ onImageUpload, onImageRemove, isDragging, setIsDragging }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File | null) => {
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (e.g., PNG, JPG, WEBP).",
          variant: "destructive",
        });
        return;
      }

      // Optional: File size check
      // const maxSize = 5 * 1024 * 1024; // 5MB
      // if (file.size > maxSize) {
      //   toast({
      //     title: "File Too Large",
      //     description: "Please upload an image smaller than 5MB.",
      //     variant: "destructive",
      //   });
      //   return;
      // }


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
  }, [onImageUpload, toast]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] ?? null);
     // Reset input value to allow uploading the same file again
     if(event.target) event.target.value = '';
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageRemove();
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the actual drop zone, not child elements
    // A small timeout can help debounce rapid enter/leave events
    setTimeout(() => {
       // Check if the relatedTarget (where the mouse moved to) is outside the dropzone
       if (!e.currentTarget.contains(e.relatedTarget as Node)) {
         setIsDragging(false);
       }
     }, 50);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true); // Ensure dragging state stays true while over
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
       processFile(files[0]);
       e.dataTransfer.clearData(); // Necessary for some browsers
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
        />

       {/* Visible Drop Area Label */}
       <Label
         htmlFor="image-upload-input" // Links label click to the hidden input
         className={cn(
           "relative flex flex-col items-center justify-center w-full min-h-[150px] border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ease-in-out",
           isDragging
             ? "border-indigo-500 bg-indigo-50" // Highlight when dragging over
             : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50", // Default and hover state
           previewUrl && "border-solid border-indigo-300 bg-indigo-50/80 p-2" // Style when image is loaded
         )}
         onDragEnter={handleDragEnter}
         onDragLeave={handleDragLeave}
         onDragOver={handleDragOver}
         onDrop={handleDrop}
        // Removed onClick={handleClick} - htmlFor is sufficient
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
               <p className="text-xs font-medium text-gray-700 truncate max-w-[80%]">{fileName || 'Image Loaded'}</p>
               <p className="text-[10px] text-gray-500">Click or drop to replace</p>
               <Button
                 variant="ghost"
                 size="icon"
                 className="absolute top-1 right-1 h-6 w-6 text-gray-500 hover:text-red-600 hover:bg-red-100/50"
                 onClick={(e) => {
                   e.stopPropagation(); // Prevent label click when clicking remove button
                   e.preventDefault(); // Prevent default button behavior if any
                   handleRemoveImage();
                 }}
                 aria-label="Remove image"
               >
                 <X className="h-4 w-4" />
               </Button>
            </div>
         ) : (
             // Initial Upload State
            <div className="flex flex-col items-center justify-center py-6 text-center">
               <UploadCloud className={cn(
                   "w-10 h-10 mb-3",
                   isDragging ? "text-indigo-600 animate-bounce" : "text-gray-400"
               )} strokeWidth={1.5} />
               <p className={cn(
                   "mb-1 text-sm font-medium",
                   isDragging ? "text-indigo-700" : "text-gray-600"
               )}>
                 {isDragging ? "Drop it here!" : "Click to upload or drag & drop"}
               </p>
               <p className="text-xs text-gray-500">
                 PNG, JPG, WEBP (Max 5MB)
               </p>
            </div>
          )}
      </Label>
    </div>
  );
}
