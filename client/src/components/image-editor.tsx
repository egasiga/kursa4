import { useEffect, useRef } from "react";
import { MemeTemplate } from "@shared/schema";

interface ImageEditorProps {
  template: MemeTemplate;
  textContent: { areaIndex: number; text: string; style: any }[];
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onTextRender: () => void;
}

export default function ImageEditor({
  template,
  textContent,
  filters,
  onCanvasReady,
  onTextRender,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize the canvas and load the template image
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load the template image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image with applied filters
      drawImageWithFilters(ctx, img, filters);

      // Store the image for later reuse
      imageRef.current = img;

      // Render text content
      onTextRender();

      // Notify parent that canvas is ready
      onCanvasReady(canvas);
    };
    img.onerror = () => {
      console.error("Error loading template image:", template.imageUrl);
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff0000";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Error loading image", canvas.width / 2, canvas.height / 2);
    };
    img.src = template.imageUrl;
  }, [template.imageUrl]);

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw the image with current filters
    drawImageWithFilters(ctx, imageRef.current, filters);

    // Render text content
    onTextRender();
  }, [filters, textContent, onTextRender]);

  // Helper function to draw image with filters
  const drawImageWithFilters = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    filters: { brightness: number; contrast: number; saturation: number }
  ) => {
    // Reset any transformations
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Apply filters using CSS filter
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
    
    // Draw the image
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Reset filter for subsequent operations
    ctx.filter = "none";
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[500px] object-contain shadow-md"
      />
    </div>
  );
}
