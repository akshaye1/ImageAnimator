
"use client";

import type React from "react";
import { useState, useRef, useCallback, useMemo } from "react";
import { ImageUpload } from "@/components/image-upload";
import { TornImage } from "@/components/torn-image";
import { Card, CardContent } from "@/components/ui/card";
import { Download, UploadCloud, Settings, RotateCw, Palette, Zap, Video, Image as ImageIcon, X, Loader2, MoveHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from 'file-saver';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress"; // Import Progress component

interface ImageDetails {
  url: string;
  width: number;
  height: number;
}

// Basic hex color validation (allows #rgb and #rrggbb)
const isValidHexColor = (color: string): boolean => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);


export default function CreatePage() {
  const [imageDetails, setImageDetails] = useState<ImageDetails | null>(null);
  const [tearAmount, setTearAmount] = useState<number>(25); // Default tear amount for border
  const [shadowDirection, setShadowDirection] = useState<number>(135); // Default bottom-right
  const [shadowIntensity, setShadowIntensity] = useState<number>(30);
  const [shadowColor, setShadowColor] = useState<string>("#000000");
  const [edgeThickness, setEdgeThickness] = useState<number>(5); // Default border edge thickness (0-100 scale)
  const [animationIntensity, setAnimationIntensity] = useState<number>(50); // Default animation intensity (0-100) - Now applies to the whole SVG
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingDuration = 5000; // 5 seconds

  const handleImageUpload = useCallback((imageDataUrl: string, width: number, height: number) => {
    setImageDetails({ url: imageDataUrl, width, height });
  }, []);

  const handleImageRemove = useCallback(() => {
    setImageDetails(null);
    setTearAmount(25);
    setShadowDirection(135);
    setShadowIntensity(30);
    setShadowColor("#000000");
    setEdgeThickness(5);
    setAnimationIntensity(50);
  }, []);

  const handlePngDownload = async () => {
    if (!imageDetails || !svgRef.current || !previewContainerRef.current) {
       toast({ title: "No Image", description: "Please upload an image first.", variant: "destructive" });
       return;
     }
     setIsDownloadingPng(true);
     setIsDownloadDialogOpen(false);
     toast({ title: "Preparing PNG Download", description: "Generating static image, please wait..." });

    const previewContainer = previewContainerRef.current;
    const svgElement = svgRef.current;
    const initialClasses = previewContainer.className;
    const initialInlineStyle = previewContainer.style.cssText;

    try {
      previewContainer.classList.remove('animate-paper-tremble');
      previewContainer.style.animationDuration = '';

      await new Promise(resolve => setTimeout(resolve, 100));

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();

      img.onload = () => {
          const canvas = document.createElement('canvas');
          const viewBox = svgElement.viewBox?.baseVal;
          if (!viewBox) {
            toast({ title: "Download Error", description: "Could not get SVG dimensions.", variant: "destructive" });
            URL.revokeObjectURL(svgUrl);
            previewContainer.className = initialClasses;
            previewContainer.style.cssText = initialInlineStyle;
            setIsDownloadingPng(false);
            return;
           }
          canvas.width = viewBox.width;
          canvas.height = viewBox.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast({ title: "Download Error", description: "Could not get canvas context.", variant: "destructive" });
            URL.revokeObjectURL(svgUrl);
            previewContainer.className = initialClasses;
            previewContainer.style.cssText = initialInlineStyle;
            setIsDownloadingPng(false);
            return;
          }

           ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              saveAs(blob, "torn-border-image.png"); // Updated filename
               toast({ title: "Download Started", description: "Your static PNG image is downloading." });
            } else {
               toast({ title: "Download Error", description: "Could not generate image blob.", variant: "destructive" });
            }
             URL.revokeObjectURL(svgUrl);
             previewContainer.className = initialClasses;
             previewContainer.style.cssText = initialInlineStyle;
             setIsDownloadingPng(false);
          }, 'image/png');
        };

      img.onerror = (error) => {
         console.error("Image load error from SVG:", error);
         toast({ title: "Download Error", description: "Could not load the generated SVG image.", variant: "destructive" });
         URL.revokeObjectURL(svgUrl);
          previewContainer.className = initialClasses;
          previewContainer.style.cssText = initialInlineStyle;
         setIsDownloadingPng(false);
      }

       img.src = svgUrl;

    } catch (error) {
      console.error("Download error:", error);
      toast({ title: "Download Failed", description: "An unexpected error occurred during SVG processing.", variant: "destructive" });
      previewContainer.className = initialClasses;
      previewContainer.style.cssText = initialInlineStyle;
      setIsDownloadingPng(false);
    }
  };

  const stopRecording = useCallback(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
      }
      if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
      }
  }, []);

  const handleVideoDownload = async () => {
    if (!imageDetails || !svgRef.current) {
      toast({ title: "No Image", description: "Please upload an image first.", variant: "destructive" });
      return;
    }
    if (!('MediaRecorder' in window) || !HTMLCanvasElement.prototype.captureStream) {
      toast({ title: "Unsupported Browser", description: "Video recording is not supported in your browser.", variant: "destructive" });
      return;
    }

    setIsRecordingVideo(true);
    setIsDownloadDialogOpen(false);
    setRecordingProgress(0);
    toast({ title: "Preparing Video...", description: "Initializing recorder, please wait..." });

    const svgElement = svgRef.current;
    const viewBox = svgElement.viewBox?.baseVal;
    if (!viewBox) {
      toast({ title: "Recording Error", description: "Could not get SVG dimensions for recording.", variant: "destructive" });
      setIsRecordingVideo(false);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = viewBox.width;
    canvas.height = viewBox.height;
    videoCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({ title: "Recording Error", description: "Could not get canvas context for recording.", variant: "destructive" });
      setIsRecordingVideo(false);
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
        URL.revokeObjectURL(svgUrl);

        const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4' :
                         MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm' :
                         MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm' :
                         'video/webm';
        const fileExtension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
        const videoFileName = `torn-border-animation.${fileExtension}`; // Updated filename

        if (mimeType === 'video/webm') {
          toast({ title: "Recording Notice", description: "MP4 not supported, falling back to WebM format.", variant: "default" });
        }

        const stream = canvas.captureStream(30); // Capture at 30 FPS
        try {
           // Increased bitrate for better quality
           const options = { mimeType, videoBitsPerSecond: 8000000 };
           mediaRecorderRef.current = new MediaRecorder(stream, options);
        } catch (e) {
          console.error("MediaRecorder Error:", e);
          toast({ title: "Recording Error", description: `Could not initialize MediaRecorder with ${mimeType}. Try a different browser or format.`, variant: "destructive" });
          setIsRecordingVideo(false);
          videoCanvasRef.current = null;
          return;
        }

        recordedChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = () => {
            console.log("MediaRecorder stopped. Chunks:", recordedChunksRef.current.length);
            if (recordedChunksRef.current.length === 0) {
               console.warn("No data recorded.");
               toast({ title: "Recording Issue", description: "No video data was captured. Please try again.", variant: "destructive" });
            } else {
                const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
                saveAs(videoBlob, videoFileName);
                toast({ title: "Video Download Ready", description: `Your animated ${fileExtension.toUpperCase()} video is downloading.` });
            }

            setIsRecordingVideo(false);
            setRecordingProgress(100);
            videoCanvasRef.current = null;
            mediaRecorderRef.current = null;
            recordingStartTimeRef.current = null;
            if (animationFrameIdRef.current) {
               cancelAnimationFrame(animationFrameIdRef.current);
               animationFrameIdRef.current = null;
           }
        };

        mediaRecorderRef.current.onerror = (event) => {
            console.error("MediaRecorder error:", event);
            toast({ title: "Recording Error", description: "An error occurred during video recording.", variant: "destructive" });

            setIsRecordingVideo(false);
            setRecordingProgress(0);
            videoCanvasRef.current = null;
             if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
              animationFrameIdRef.current = null;
            }
            mediaRecorderRef.current = null;
            recordingStartTimeRef.current = null;
        };

        mediaRecorderRef.current.start();
        toast({ title: "Recording Video...", description: `Capturing animation (${recordingDuration / 1000} seconds). Please wait.` }); // Updated message
        recordingStartTimeRef.current = performance.now();

        const drawFrame = (timestamp: number) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
                 console.log("Recorder not ready or stopped, stopping draw loop.");
                 if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
                 animationFrameIdRef.current = null;
                 if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    mediaRecorderRef.current.stop();
                 } else if (!mediaRecorderRef.current && isRecordingVideo) {
                     setIsRecordingVideo(false);
                     setRecordingProgress(100);
                 }
                 return;
            }

            if (!recordingStartTimeRef.current) {
                 recordingStartTimeRef.current = timestamp;
            }
            const elapsed = timestamp - recordingStartTimeRef.current;
            const progress = Math.min(100, Math.floor((elapsed / recordingDuration) * 100));
            setRecordingProgress(progress);


            if (elapsed >= recordingDuration) {
                 console.log("Recording duration reached, stopping recorder.");
                 stopRecording();
                 return;
            }

            if (!videoCanvasRef.current || !ctx) return;

            const previewContainer = previewContainerRef.current;
            let transform = 'none';
            if (previewContainer) {
                 const currentStyle = window.getComputedStyle(previewContainer);
                 transform = currentStyle.transform;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();

             try {
                  const matrix = new DOMMatrix(transform);
                  ctx.translate(canvas.width / 2, canvas.height / 2);
                  ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
                  ctx.translate(-canvas.width / 2, -canvas.height / 2);
             } catch(e) {
                  console.warn("Could not parse transform matrix, drawing without transform.", e);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
             }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            if (mediaRecorderRef.current?.state === "recording") {
                 animationFrameIdRef.current = requestAnimationFrame(drawFrame);
            } else {
                 console.log("Recorder stopped mid-frame, cancelling animation.");
                 if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
                 animationFrameIdRef.current = null;
                 if(isRecordingVideo) {
                    setRecordingProgress(100);
                    setIsRecordingVideo(false);
                 }
            }
        };

        animationFrameIdRef.current = requestAnimationFrame(drawFrame);

    }; // End of img.onload

    img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        toast({ title: "Recording Error", description: "Could not load the SVG image for recording.", variant: "destructive" });
        setIsRecordingVideo(false);
        setRecordingProgress(0);
    }
    img.src = svgUrl;

  };

  const handleDownloadClick = () => {
    if (!imageDetails) {
       toast({ title: "No Image", description: "Please upload an image first.", variant: "destructive" });
       return;
    }
     if (shadowColor && !isValidHexColor(shadowColor)) {
        toast({ title: "Invalid Color", description: "Please enter a valid shadow hex color (#rrggbb or #rgb).", variant: "destructive" });
        return;
      }

    if (animationIntensity > 0) {
      setIsDownloadDialogOpen(true);
    } else {
      handlePngDownload();
    }
  };

  const resetControls = () => {
    setTearAmount(25);
    setShadowDirection(135);
    setShadowIntensity(30);
    setShadowColor("#000000");
    setEdgeThickness(5);
    setAnimationIntensity(50);
    toast({ title: "Controls Reset", description: "All settings returned to default." });
  }

  const handleHexColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
     setShadowColor(newColor);
  }

  const animationDuration = useMemo(() => {
      if (animationIntensity <= 0) return '0s';
      const maxDuration = 3;
      const minDuration = 0.2;
      // Inverse relationship: higher intensity = lower duration (faster animation)
      const duration = maxDuration - ((animationIntensity / 100) * (maxDuration - minDuration));
      return `${duration.toFixed(2)}s`;
  }, [animationIntensity]);

  const isProcessing = isDownloadingPng || isRecordingVideo;

  return (
     <main className="container mx-auto flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12 bg-background overflow-x-hidden"> {/* Added overflow-x-hidden */}
      <header className="w-full max-w-5xl text-center mb-10">
         <h1 className="text-5xl font-extrabold tracking-tight text-foreground mb-3">
           Tear<span className="text-primary">Drop</span> Creator
        </h1>
        <p className="text-lg text-muted-foreground">
          Apply artistic torn paper borders and shadow effects to your images.
        </p>
      </header>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Upload & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card shadow-lg border-border">
             <CardContent className="p-6 space-y-6">
                 <h2 className="text-xl font-semibold text-card-foreground mb-4 border-b pb-2 flex items-center">
                   <UploadCloud className="mr-2 h-5 w-5 text-primary"/>
                   Upload Image
                 </h2>
                <ImageUpload
                   onImageUpload={handleImageUpload}
                   onImageRemove={handleImageRemove}
                   isDragging={isDragging}
                   setIsDragging={setIsDragging}
                />
             </CardContent>
          </Card>

          <Card className="bg-card shadow-lg border-border">
             <CardContent className="p-6 space-y-5">
                <h2 className="text-xl font-semibold text-card-foreground mb-4 border-b pb-2 flex items-center justify-between">
                  <div className="flex items-center">
                     <Settings className="mr-2 h-5 w-5 text-primary"/>
                     Adjust Effects
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetControls} className="text-xs text-muted-foreground hover:text-primary">
                      <RotateCw className="mr-1 h-3 w-3"/> Reset
                  </Button>
                </h2>

                {/* Tear Amount */}
                <div className="space-y-2">
                   <Label htmlFor="tearAmount" className="text-sm font-medium text-foreground">Tear Amount ({tearAmount})</Label>
                   <Slider
                    id="tearAmount"
                    min={0}
                    max={100}
                    step={1}
                    value={[tearAmount]}
                    onValueChange={(value) => setTearAmount(value[0])}
                    disabled={!imageDetails || isProcessing}
                    className="[&>span>span]:bg-primary [&>span]:bg-accent"
                   />
                </div>

                 {/* Edge Thickness */}
                 <div className="space-y-2">
                   <Label htmlFor="edgeThickness" className="text-sm font-medium text-foreground flex items-center">Border Thickness ({edgeThickness})
                   </Label>
                   <Slider
                    id="edgeThickness"
                    min={0} // Start from 0
                    max={100} // Scale from 0 to 100
                    step={1}
                    value={[edgeThickness]}
                    onValueChange={(value) => setEdgeThickness(value[0])}
                    disabled={!imageDetails || isProcessing}
                    className="[&>span>span]:bg-primary [&>span]:bg-accent"
                   />
                 </div>


               {/* Shadow Intensity */}
                 <div className="space-y-2">
                   <Label htmlFor="shadowIntensity" className="text-sm font-medium text-foreground">Shadow Intensity ({shadowIntensity})</Label>
                   <Slider
                    id="shadowIntensity"
                    min={0}
                    max={100}
                    step={1}
                    value={[shadowIntensity]}
                    onValueChange={(value) => setShadowIntensity(value[0])}
                    disabled={!imageDetails || isProcessing}
                    className="[&>span>span]:bg-primary [&>span]:bg-accent"
                   />
                 </div>

               {/* Shadow Direction */}
                 <div className="space-y-2">
                   <Label htmlFor="shadowDirection" className="text-sm font-medium text-foreground">Shadow Direction ({shadowDirection}°)</Label>
                   <Slider
                    id="shadowDirection"
                    min={0}
                    max={360}
                    step={1}
                    value={[shadowDirection]}
                    onValueChange={(value) => setShadowDirection(value[0])}
                    disabled={!imageDetails || isProcessing}
                     className="[&>span>span]:bg-primary [&>span]:bg-accent"
                   />
                 </div>

                 {/* Shadow Color */}
                <div className="space-y-2">
                    <Label htmlFor="shadowColorHex" className="text-sm font-medium text-foreground flex items-center">
                       <Palette className="mr-2 h-4 w-4 text-primary"/>Shadow Color
                    </Label>
                    <div className="flex items-center gap-2">
                         <Input
                            id="shadowColorPicker"
                            type="color"
                            value={isValidHexColor(shadowColor) ? shadowColor : '#000000'}
                            onChange={(e) => setShadowColor(e.target.value)}
                            disabled={!imageDetails || isProcessing}
                            className="h-10 w-12 p-1 cursor-pointer disabled:cursor-not-allowed rounded-md border-input bg-input"
                            aria-label="Choose shadow color"
                         />
                         <Input
                             id="shadowColorHex"
                             type="text"
                             value={shadowColor}
                             onChange={handleHexColorChange}
                             placeholder="#000000"
                             disabled={!imageDetails || isProcessing}
                             className={cn(
                                "flex-1 h-10",
                                shadowColor && !isValidHexColor(shadowColor) && "border-destructive focus-visible:ring-destructive"
                             )}
                             maxLength={7}
                         />
                    </div>
                     {shadowColor && !isValidHexColor(shadowColor) && (
                        <p className="text-xs text-destructive">Invalid hex color format (use #rrggbb or #rgb)</p>
                      )}
                </div>

                 {/* Animation Intensity */}
                 <div className="space-y-2">
                   <Label htmlFor="animationIntensity" className="text-sm font-medium text-foreground flex items-center">
                     <Zap className="mr-2 h-4 w-4 text-primary"/> Animation Speed ({animationIntensity})
                   </Label>
                   <Slider
                    id="animationIntensity"
                    min={0}
                    max={100}
                    step={1}
                    value={[animationIntensity]}
                    onValueChange={(value) => setAnimationIntensity(value[0])}
                    disabled={!imageDetails || isProcessing}
                    className="[&>span>span]:bg-primary [&>span]:bg-accent"
                   />
                   <p className="text-xs text-muted-foreground">Higher value means faster animation. 0 disables animation.</p>
                 </div>

             </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview and Download */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card shadow-xl border-border sticky top-8">
               <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-card-foreground mb-4 border-b pb-2">Preview</h2>
                  <div className="w-full min-h-[400px] flex justify-center items-center bg-secondary/50 rounded-lg p-4 border border-dashed border-border overflow-hidden">
                     {imageDetails ? (
                       <div
                         ref={previewContainerRef}
                         className={cn(
                           "max-w-full max-h-full flex justify-center items-center",
                            animationIntensity > 0 && "animate-paper-tremble"
                         )}
                         style={ animationIntensity > 0 ? { animationDuration: animationDuration } : { animation: 'none' } } // Only apply duration if intensity > 0
                        >
                           <TornImage
                             svgRef={svgRef}
                             imageUrl={imageDetails.url}
                             imageWidth={imageDetails.width}
                             imageHeight={imageDetails.height}
                             tearAmount={tearAmount}
                             shadowDirection={shadowDirection}
                             shadowIntensity={shadowIntensity}
                             shadowColor={shadowColor}
                             edgeThickness={edgeThickness} // Pass edge thickness
                             // Corrected key to use imageDetails.height
                             key={`${imageDetails.url}-${tearAmount}-${shadowDirection}-${shadowIntensity}-${shadowColor}-${edgeThickness}-${animationIntensity}-${imageDetails.width}-${imageDetails.height}`}
                           />
                       </div>
                     ) : (
                        <div className="text-center text-muted-foreground p-10">
                          <UploadCloud className="mx-auto mb-4 h-16 w-16 text-muted-foreground/70" strokeWidth={1} />
                          <p className="font-medium text-lg">Your masterpiece awaits!</p>
                          <p className="text-sm">Upload an image to add a torn border.</p>
                       </div>
                     )}
                  </div>
                  <Button
                     size="lg"
                     className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 text-base font-semibold py-3 shadow-md hover:shadow-lg text-white"
                     onClick={handleDownloadClick}
                     disabled={!imageDetails || isProcessing || !!(shadowColor && !isValidHexColor(shadowColor))}
                   >
                    {isDownloadingPng ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing PNG...</>
                    ) : isRecordingVideo ? (
                         <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Recording Video... ({recordingProgress}%) {/* Updated text */}
                        </>
                    ) : (
                       <><Download className="mr-2 h-5 w-5" /> Download</>
                    )}
                  </Button>
                  {isRecordingVideo && (
                     <Progress value={recordingProgress} className="w-full h-2 mt-2 [&>div]:bg-primary" />
                  )}
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                     {animationIntensity > 0
                        ? "Animated images can be exported as MP4/WebM video or static PNG."
                        : "Image will be downloaded as a PNG file."}
                  </p>
               </CardContent>
            </Card>
        </div>
      </div>

       {/* Download Options Dialog */}
        <Dialog open={isDownloadDialogOpen} onOpenChange={(open) => !isProcessing && setIsDownloadDialogOpen(open)}>
           <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-border">
             <DialogHeader>
               <DialogTitle className="text-lg font-semibold text-foreground">Choose Export Format</DialogTitle>
                 <DialogDescription className="text-sm text-muted-foreground">
                   Animation is enabled. Choose video (MP4/WebM) for motion or PNG for a static image.
                 </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               {/* Export as Video Button */}
               <Button
                  variant="outline"
                  className="w-full justify-start p-4 h-auto border-border hover:bg-accent hover:text-accent-foreground flex items-center space-x-3 overflow-hidden group"
                  onClick={handleVideoDownload}
                  disabled={isProcessing}
                >
                 <Video className="h-5 w-5 text-primary flex-shrink-0" />
                 <div className="text-left flex-grow min-w-0">
                   <p className="font-medium text-foreground truncate">Export as Video</p>
                   <p className="text-xs text-muted-foreground truncate">
                     Includes animation (5 sec). Format: MP4/WebM.
                   </p>
                 </div>
                 {isRecordingVideo && <Loader2 className="ml-auto h-4 w-4 animate-spin flex-shrink-0 text-primary group-hover:text-accent-foreground" />}
               </Button>

               {/* Export as PNG Button */}
               <Button
                  variant="outline"
                  className="w-full justify-start p-4 h-auto border-border hover:bg-accent hover:text-accent-foreground flex items-center space-x-3 overflow-hidden group"
                  onClick={handlePngDownload}
                  disabled={isProcessing}
                >
                 <ImageIcon className="h-5 w-5 text-primary flex-shrink-0" />
                 <div className="text-left flex-grow min-w-0">
                   <p className="font-medium text-foreground truncate">Export as transparent PNG</p>
                   <p className="text-xs text-muted-foreground truncate">A static image without animation.</p>
                 </div>
                  {isDownloadingPng && <Loader2 className="ml-auto h-4 w-4 animate-spin flex-shrink-0 text-primary group-hover:text-accent-foreground" />}
               </Button>
             </div>
               <DialogClose asChild>
                 <Button variant="ghost" className="mt-2 text-sm text-muted-foreground">Cancel</Button>
               </DialogClose>
           </DialogContent>
         </Dialog>

        <footer className="w-full max-w-5xl text-center mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
             TearDrop - Add unique torn borders to your images with ease.
          </p>
        </footer>
     </main>
  );
}
