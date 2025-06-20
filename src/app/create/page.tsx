import React, { useState, useRef, useCallback, useMemo } from "react";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ImageUpload,
  Input,
  Label,
  Loader2,
  Palette,
  Progress,
  RotateCw,
  Settings,
  UploadCloud,
  Video,
  Zap,
} from "@/components/ui";
import TornImage from "@/components/TornImage";

// Basic hex color validation (allows #rgb and #rrggbb)
const isValidHexColor = (color: string): boolean =>
  /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);

interface ImageDetails {
  url: string;
  width: number;
  height: number;
}

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

  const handleImageUpload = useCallback(
    (imageDataUrl: string, width: number, height: number) => {
      setImageDetails({ url: imageDataUrl, width, height });
      console.log("Image Details:", { url: imageDataUrl, width, height });
    },
    []
  );

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
    if (!imageDetails || !imageDetails.url) {
      toast({
        title: "No Image",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }
    setIsDownloadingPng(true);
    setIsDownloadDialogOpen(false);
    toast({
      title: "Preparing PNG Download",
      description: "Generating torn border image, please wait...",
    });

    try {
      // Fetch the image blob from the data URL
      const response = await fetch(imageDetails.url);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, "image.png");
      formData.append("tearAmount", tearAmount.toString());
      formData.append("shadowDirection", shadowDirection.toString());
      formData.append("shadowIntensity", shadowIntensity.toString());
      formData.append("shadowColor", shadowColor);
      formData.append("edgeThickness", edgeThickness.toString());

      const backendRes = await fetch(
        "http://localhost:5000/images/torn_border",
        {
          method: "POST",
          body: formData,
        }
      );
      if (!backendRes.ok) {
        const errorText = await backendRes.text();
        toast({
          title: "Backend Error",
          description: errorText,
          variant: "destructive",
        });
        setIsDownloadingPng(false);
        return;
      }
      const resultBlob = await backendRes.blob();
      saveAs(resultBlob, "torn-border-image.png");
      toast({
        title: "Download Started",
        description: "Your torn border PNG image is downloading.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "An error occurred during backend processing.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

  const handleVideoDownload = async () => {
    if (!imageDetails || !svgRef.current) {
      toast({
        title: "No Image",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }
    if (
      !("MediaRecorder" in window) ||
      !HTMLCanvasElement.prototype.captureStream
    ) {
      toast({
        title: "Unsupported Browser",
        description: "Video recording is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    setIsRecordingVideo(true);
    setIsDownloadDialogOpen(false);
    setRecordingProgress(0);
    toast({
      title: "Preparing Video...",
      description: "Initializing recorder, please wait...",
    });

    const svgElement = svgRef.current;
    const viewBox = svgElement.viewBox?.baseVal;
    if (!viewBox) {
      toast({
        title: "Recording Error",
        description: "Could not get SVG dimensions for recording.",
        variant: "destructive",
      });
      setIsRecordingVideo(false);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = viewBox.width;
    canvas.height = viewBox.height;
    videoCanvasRef.current = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast({
        title: "Recording Error",
        description: "Could not get canvas context for recording.",
        variant: "destructive",
      });
      setIsRecordingVideo(false);
      return;
    }

    // Pre-render the SVG to an Image object to draw onto the canvas repeatedly
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(svgUrl); // Clean up object URL once image is loaded

      // Determine MIME type and file extension
      const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
        ? "video/mp4"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm"
        : "video/webm"; // Default fallback
      const fileExtension = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
      const videoFileName = `torn-border-animation.${fileExtension}`; // Updated filename

      if (mimeType === "video/webm") {
        toast({
          title: "Recording Notice",
          description: "MP4 not supported, falling back to WebM format.",
          variant: "default",
        });
      }

      const stream = canvas.captureStream(30); // Capture at 30 FPS
      try {
        // Increased bitrate for better quality
        const options = { mimeType, videoBitsPerSecond: 8000000 }; // 8 Mbps
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      } catch (e) {
        console.error("MediaRecorder Error:", e);
        toast({
          title: "Recording Error",
          description: `Could not initialize MediaRecorder with ${mimeType}. Try a different browser or format.`,
          variant: "destructive",
        });
        setIsRecordingVideo(false);
        videoCanvasRef.current = null; // Clean up canvas ref
        return;
      }

      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log(
          "MediaRecorder stopped. Chunks:",
          recordedChunksRef.current.length
        );
        if (recordedChunksRef.current.length === 0) {
          console.warn("No data recorded.");
          toast({
            title: "Recording Issue",
            description: "No video data was captured. Please try again.",
            variant: "destructive",
          });
        } else {
          const videoBlob = new Blob(recordedChunksRef.current, {
            type: mimeType,
          });
          saveAs(videoBlob, videoFileName);
          toast({
            title: "Video Download Ready",
            description: `Your animated ${fileExtension.toUpperCase()} video is downloading.`,
          });
        }

        // Cleanup after stopping
        setIsRecordingVideo(false);
        setRecordingProgress(100); // Indicate completion
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
        toast({
          title: "Recording Error",
          description: "An error occurred during video recording.",
          variant: "destructive",
        });

        // Cleanup on error
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
      toast({
        title: "Recording Video...",
        description: `Capturing animation (${
          recordingDuration / 1000
        } seconds). Please wait.`,
      }); // Updated message
      recordingStartTimeRef.current = performance.now();

      // Animation loop to draw frames onto the canvas
      const drawFrame = (timestamp: number) => {
        // Check if recording should continue
        if (
          !mediaRecorderRef.current ||
          mediaRecorderRef.current.state !== "recording"
        ) {
          console.log("Recorder not ready or stopped, stopping draw loop.");
          if (animationFrameIdRef.current)
            cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
          // Ensure recorder is stopped if it wasn't already (e.g., due to an error)
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
          ) {
            mediaRecorderRef.current.stop();
          } else if (!mediaRecorderRef.current && isRecordingVideo) {
            // If recorder is already null but state is still recording, clean up state
            setIsRecordingVideo(false);
            setRecordingProgress(100);
          }
          return;
        }

        if (!recordingStartTimeRef.current) {
          recordingStartTimeRef.current = timestamp;
        }
        const elapsed = timestamp - recordingStartTimeRef.current;
        const progress = Math.min(
          100,
          Math.floor((elapsed / recordingDuration) * 100)
        );
        setRecordingProgress(progress);

        // Stop recording if duration is reached
        if (elapsed >= recordingDuration) {
          console.log("Recording duration reached, stopping recorder.");
          stopRecording();
          return;
        }

        if (!videoCanvasRef.current || !ctx) return;

        // --- Get current transform from the preview container ---
        const previewContainer = previewContainerRef.current;
        let transform = "none";
        if (previewContainer) {
          const currentStyle = window.getComputedStyle(previewContainer);
          transform = currentStyle.transform;
          // console.log("Current Transform:", transform); // Debugging
        }

        // --- Draw the image onto the canvas with the current transform ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save(); // Save context state

        // Apply the captured transform to the canvas drawing
        try {
          // Split transform matrix values (assuming 'matrix(a, b, c, d, e, f)')
          const matrix = new DOMMatrix(transform);
          // Apply transform relative to the center of the canvas
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.transform(
            matrix.a,
            matrix.b,
            matrix.c,
            matrix.d,
            matrix.e,
            matrix.f
          );
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        } catch (e) {
          // Fallback if transform parsing fails
          console.warn(
            "Could not parse transform matrix, drawing without transform.",
            e
          );
          // Reset transform to identity if parsing failed
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the pre-rendered SVG image
        ctx.restore(); // Restore context state

        // Request next frame if still recording
        if (mediaRecorderRef.current?.state === "recording") {
          animationFrameIdRef.current = requestAnimationFrame(drawFrame);
        } else {
          console.log("Recorder stopped mid-frame, cancelling animation.");
          if (animationFrameIdRef.current)
            cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
          // Ensure state is cleaned up if recorder stopped unexpectedly
          if (isRecordingVideo) {
            setRecordingProgress(100);
            setIsRecordingVideo(false);
          }
        }
      };

      // Start the animation loop
      animationFrameIdRef.current = requestAnimationFrame(drawFrame);
    }; // End of img.onload

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl); // Clean up object URL on error
      toast({
        title: "Recording Error",
        description: "Could not load the SVG image for recording.",
        variant: "destructive",
      });
      setIsRecordingVideo(false);
      setRecordingProgress(0);
    };
    img.src = svgUrl; // Start loading the SVG as an image
  };

  const handleDownloadClick = () => {
    if (!imageDetails) {
      toast({
        title: "No Image",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }
    // Validate hex color before opening dialog or downloading
    if (shadowColor && !isValidHexColor(shadowColor)) {
      toast({
        title: "Invalid Color",
        description: "Please enter a valid shadow hex color (#rrggbb or #rgb).",
        variant: "destructive",
      });
      return;
    }

    if (animationIntensity > 0) {
      // If animation is active, show the dialog
      setIsDownloadDialogOpen(true);
    } else {
      // If no animation, directly download PNG
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
    toast({
      title: "Controls Reset",
      description: "All settings returned to default.",
    });
  };

  // Handle manual hex color input
  const handleHexColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    // Basic validation or formatting could be added here if needed
    setShadowColor(newColor);
    // // Check if valid only when focusing out or pressing enter?
    // if (!isValidHexColor(newColor) && newColor !== '') {
    //   // Optionally show inline error or just rely on the button disabling
    // }
  };

  // Calculate animation duration based on intensity
  const animationDuration = useMemo(() => {
    if (animationIntensity <= 0) return "0s"; // No animation if intensity is 0
    const maxDuration = 3; // Longest duration (slowest animation) at intensity 1
    const minDuration = 0.2; // Shortest duration (fastest animation) at intensity 100
    // Inverse relationship: higher intensity = lower duration
    const duration =
      maxDuration - (animationIntensity / 100) * (maxDuration - minDuration);
    return `${duration.toFixed(2)}s`;
  }, [animationIntensity]);

  const isProcessing = isDownloadingPng || isRecordingVideo;

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12 bg-background overflow-x-hidden">
      {" "}
      {/* Added overflow-x-hidden */}
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
                <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                Upload Image
              </h2>
              <ImageUpload
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                disabled={isProcessing} // Disable upload when processing
                crumpleIntensity={0} // Add the missing prop
              />
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg border-border">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-xl font-semibold text-card-foreground mb-4 border-b pb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Adjust Effects
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetControls}
                  disabled={isProcessing}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  <RotateCw className="mr-1 h-3 w-3" /> Reset
                </Button>
              </h2>

              {/* Tear Amount */}
              <div className="space-y-2">
                <Label
                  htmlFor="tearAmount"
                  className="text-sm font-medium text-foreground"
                >
                  Tear Amount ({tearAmount})
                </Label>
                <Slider
                  id="tearAmount"
                  min={0}
                  max={100}
                  step={1}
                  value={[tearAmount]}
                  onValueChange={(value) => setTearAmount(value[0])}
                  disabled={!imageDetails || isProcessing}
                  // Apply theme colors using CSS variables or Tailwind utility classes
                  className="[&>span>span]:bg-primary [&>span]:bg-accent [&>span]:rounded-full" // Use theme colors
                />
              </div>

              {/* Edge Thickness */}
              <div className="space-y-2">
                <Label
                  htmlFor="edgeThickness"
                  className="text-sm font-medium text-foreground flex items-center"
                >
                  Border Thickness ({edgeThickness})
                  {/* Optional: Add Icon for visual cue */}
                  {/* <MoveHorizontal className="ml-2 h-4 w-4 text-muted-foreground"/> */}
                </Label>
                <Slider
                  id="edgeThickness"
                  min={0} // Start from 0
                  max={100} // Scale from 0 to 100
                  step={1}
                  value={[edgeThickness]}
                  onValueChange={(value) => setEdgeThickness(value[0])}
                  disabled={!imageDetails || isProcessing}
                  className="[&>span>span]:bg-primary [&>span]:bg-accent [&>span]:rounded-full" // Use theme colors
                />
                {/* Optional: Add description */}
                {/* <p className="text-xs text-muted-foreground">Controls the width of the torn border. 0 means no border.</p> */}
              </div>

              {/* Shadow Intensity */}
              <div className="space-y-2">
                <Label
                  htmlFor="shadowIntensity"
                  className="text-sm font-medium text-foreground"
                >
                  Shadow Intensity ({shadowIntensity})
                </Label>
                <Slider
                  id="shadowIntensity"
                  min={0}
                  max={100}
                  step={1}
                  value={[shadowIntensity]}
                  onValueChange={(value) => setShadowIntensity(value[0])}
                  disabled={!imageDetails || isProcessing}
                  className="[&>span>span]:bg-primary [&>span]:bg-accent [&>span]:rounded-full" // Use theme colors
                />
              </div>

              {/* Shadow Direction */}
              <div className="space-y-2">
                <Label
                  htmlFor="shadowDirection"
                  className="text-sm font-medium text-foreground"
                >
                  Shadow Direction ({shadowDirection}°)
                </Label>
                <Slider
                  id="shadowDirection"
                  min={0}
                  max={360}
                  step={1}
                  value={[shadowDirection]}
                  onValueChange={(value) => setShadowDirection(value[0])}
                  disabled={!imageDetails || isProcessing}
                  // Use theme colors for the slider track and thumb
                  className="[&>span>span]:bg-primary [&>span]:bg-accent [&>span]:rounded-full"
                />
              </div>

              {/* Shadow Color */}
              <div className="space-y-2">
                <Label
                  htmlFor="shadowColorHex"
                  className="text-sm font-medium text-foreground flex items-center"
                >
                  <Palette className="mr-2 h-4 w-4 text-primary" />
                  Shadow Color
                </Label>
                <div className="flex items-center gap-2">
                  {/* Native Color Picker */}
                  <Input
                    id="shadowColorPicker"
                    type="color"
                    value={
                      isValidHexColor(shadowColor) ? shadowColor : "#000000"
                    } // Bind to state, fallback if invalid
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setShadowColor(e.target.value)
                    }
                    disabled={!imageDetails || isProcessing}
                    className="h-10 w-12 p-1 cursor-pointer disabled:cursor-not-allowed rounded-md border-input bg-input" // Basic styling
                    aria-label="Choose shadow color"
                  />
                  {/* Hex Input Field */}
                  <Input
                    id="shadowColorHex"
                    type="text"
                    value={shadowColor}
                    onChange={handleHexColorChange}
                    placeholder="#000000"
                    disabled={!imageDetails || isProcessing}
                    className={cn(
                      "flex-1 h-10", // Make it fill remaining space
                      // Add error styling if color is invalid and not empty
                      shadowColor &&
                        !isValidHexColor(shadowColor) &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                    maxLength={7} // Limit input length (#rrggbb)
                  />
                </div>
                {/* Optional: Display validation message */}
                {shadowColor && !isValidHexColor(shadowColor) && (
                  <p className="text-xs text-destructive">
                    Invalid hex color format (use #rrggbb or #rgb)
                  </p>
                )}
              </div>

              {/* Animation Intensity */}
              <div className="space-y-2">
                <Label
                  htmlFor="animationIntensity"
                  className="text-sm font-medium text-foreground flex items-center"
                >
                  <Zap className="mr-2 h-4 w-4 text-primary" /> Animation Speed
                  ({animationIntensity})
                </Label>
                <Slider
                  id="animationIntensity"
                  min={0} // Allow disabling animation
                  max={100}
                  step={1}
                  value={[animationIntensity]}
                  onValueChange={(value) => setAnimationIntensity(value[0])}
                  disabled={!imageDetails || isProcessing}
                  className="[&>span>span]:bg-primary [&>span]:bg-accent [&>span]:rounded-full" // Use theme colors
                />
                <p className="text-xs text-muted-foreground">
                  Higher value means faster animation. 0 disables animation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview and Download */}
        <div className="lg:col-span-2 space-y-6">
          {/* Make the card sticky within its column */}
          <Card className="bg-card shadow-xl border-border sticky top-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4 border-b pb-2">
                Preview
              </h2>
              <div className="w-full min-h-[400px] flex justify-center items-center bg-secondary/50 rounded-lg p-4 border border-dashed border-border overflow-hidden">
                {" "}
                {/* Added overflow-hidden */}
                {imageDetails ? (
                  <div
                    ref={previewContainerRef}
                    className={cn(
                      "max-w-full max-h-full flex justify-center items-center",
                      // Apply animation class only if intensity > 0
                      animationIntensity > 0 && "animate-paper-tremble"
                    )}
                    // Apply animation duration via inline style only if intensity > 0
                    style={
                      animationIntensity > 0
                        ? { animationDuration: animationDuration }
                        : { animation: "none" }
                    } // Only apply duration if intensity > 0
                  >
                    {/* TornImage Component */}
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
                      // Key needs to include relevant props that cause re-render of TornImage internals
                      key={`${imageDetails.url}-${tearAmount}-${shadowDirection}-${shadowIntensity}-${shadowColor}-${edgeThickness}-${animationIntensity}-${imageDetails.width}-${imageDetails.height}`}
                    />
                  </div>
                ) : (
                  // Placeholder when no image is uploaded
                  <div className="text-center text-muted-foreground p-10">
                    <UploadCloud
                      className="mx-auto mb-4 h-16 w-16 text-muted-foreground/70"
                      strokeWidth={1}
                    />
                    <p className="font-medium text-lg">
                      Your masterpiece awaits!
                    </p>
                    <p className="text-sm">
                      Upload an image to add a torn border.
                    </p>
                  </div>
                )}
              </div>
              {/* Download Button */}
              <Button
                size="lg"
                className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 text-base font-semibold py-3 shadow-md hover:shadow-lg text-white" // Enhanced styling
                onClick={handleDownloadClick}
                disabled={
                  !imageDetails ||
                  isProcessing ||
                  !!(shadowColor && !isValidHexColor(shadowColor))
                } // Disable if no image, processing, or invalid color
              >
                {isDownloadingPng ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing
                    PNG...
                  </>
                ) : isRecordingVideo ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Recording Video... ({recordingProgress}%){" "}
                    {/* Updated text */}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" /> Download
                  </>
                )}
              </Button>
              {/* Progress Bar for Video Recording */}
              {isRecordingVideo && (
                <Progress
                  value={recordingProgress}
                  className="w-full h-2 mt-2 [&>div]:bg-primary"
                /> // Use theme color
              )}
              {/* Help Text */}
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
      <Dialog
        open={isDownloadDialogOpen}
        onOpenChange={(open) => !isProcessing && setIsDownloadDialogOpen(open)}
      >
        {" "}
        {/* Prevent closing while processing */}
        <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-border">
          {" "}
          {/* Adjust width and apply theme */}
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Choose Export Format
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Animation is enabled. Choose video (MP4/WebM) for motion or PNG
              for a static image.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Export as Video Button */}
            <Button
              variant="outline"
              className="w-full justify-start p-4 h-auto border-border hover:bg-accent hover:text-accent-foreground flex items-center space-x-3 overflow-hidden group" // Improved styling
              onClick={handleVideoDownload}
              disabled={isProcessing} // Disable while processing
            >
              <Video className="h-5 w-5 text-primary flex-shrink-0" />{" "}
              {/* Icon */}
              <div className="text-left flex-grow min-w-0">
                {" "}
                {/* Allow text to shrink */}
                <p className="font-medium text-foreground truncate">
                  Export as Video
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Includes animation (5 sec). Format: MP4/WebM.
                </p>
              </div>
              {isRecordingVideo && (
                <Loader2 className="ml-auto h-4 w-4 animate-spin flex-shrink-0 text-primary group-hover:text-accent-foreground" />
              )}{" "}
              {/* Spinner */}
            </Button>

            {/* Export as PNG Button */}
            <Button
              variant="outline"
              className="w-full justify-start p-4 h-auto border-border hover:bg-accent hover:text-accent-foreground flex items-center space-x-3 overflow-hidden group" // Improved styling
              onClick={handlePngDownload}
              disabled={isProcessing} // Disable while processing
            >
              <ImageIcon className="h-5 w-5 text-primary flex-shrink-0" />{" "}
              {/* Icon */}
              <div className="text-left flex-grow min-w-0">
                {" "}
                {/* Allow text to shrink */}
                <p className="font-medium text-foreground truncate">
                  Export as transparent PNG
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  A static image without animation.
                </p>
              </div>
              {isDownloadingPng && (
                <Loader2 className="ml-auto h-4 w-4 animate-spin flex-shrink-0 text-primary group-hover:text-accent-foreground" />
              )}{" "}
              {/* Spinner */}
            </Button>
          </div>
          {/* Cancel Button */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="mt-2 text-sm text-muted-foreground"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
      {/* Footer */}
      <footer className="w-full max-w-5xl text-center mt-16 pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          TearDrop - Add unique torn borders to your images with ease.
        </p>
      </footer>
    </main>
  );
}
