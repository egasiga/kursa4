import { useEffect, useRef, useState } from "react";
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
  onUpdateTextPosition?: (areaIndex: number, offsetX: number, offsetY: number) => void;
}

export default function ImageEditor({
  template,
  textContent,
  filters,
  onCanvasReady,
  onTextRender,
  onUpdateTextPosition
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [textBoundingBoxes, setTextBoundingBoxes] = useState<{
    areaIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  }[]>([]);
  const dragStartPositionRef = useRef<{ x: number; y: number, offsetX: number, offsetY: number } | null>(null);

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

      // Calculate text bounding boxes
      calculateTextBoundingBoxes();
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

    // Recalculate text bounding boxes
    calculateTextBoundingBoxes();
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

  // Calculate text bounding boxes for drag & drop
  const calculateTextBoundingBoxes = () => {
    if (!canvasRef.current || !template.textAreas) return;
    
    const boxes = textContent.map((item) => {
      const textArea = template.textAreas[item.areaIndex];
      if (!textArea) return null;
      
      // Примерно оцениваем размер текста (можно уточнить потом)
      const fontSize = item.style.fontSize || 24;
      const textWidth = item.text.length * fontSize * 0.6;
      const textHeight = fontSize * 1.2;
      
      // Вычисляем позицию текста с учетом смещения
      const offsetX = item.style.offsetX || 0;
      const offsetY = item.style.offsetY || 0;
      const centerX = textArea.x + textArea.width / 2 + offsetX;
      const centerY = textArea.y + textArea.height / 2 + offsetY;
      
      // Определяем границы для перетаскивания
      return {
        areaIndex: item.areaIndex,
        x: centerX - textWidth / 2,
        y: centerY - textHeight / 2,
        width: textWidth,
        height: textHeight,
        offsetX,
        offsetY
      };
    }).filter(Boolean) as {
      areaIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
      offsetX: number;
      offsetY: number;
    }[];
    
    setTextBoundingBoxes(boxes);
  };

  // Handle mouse down on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onUpdateTextPosition) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if click is inside any text area
    for (const box of textBoundingBoxes) {
      if (
        x >= box.x && 
        x <= box.x + box.width && 
        y >= box.y && 
        y <= box.y + box.height
      ) {
        // Start dragging
        setIsDragging(box.areaIndex);
        dragStartPositionRef.current = { 
          x, 
          y, 
          offsetX: box.offsetX, 
          offsetY: box.offsetY 
        };
        break;
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isDragging === null || !dragStartPositionRef.current || !onUpdateTextPosition) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Calculate offset from starting position
    const deltaX = x - dragStartPositionRef.current.x;
    const deltaY = y - dragStartPositionRef.current.y;
    
    // Update text position
    const newOffsetX = dragStartPositionRef.current.offsetX + deltaX;
    const newOffsetY = dragStartPositionRef.current.offsetY + deltaY;
    
    // Notify parent component
    onUpdateTextPosition(isDragging, newOffsetX, newOffsetY);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(null);
    dragStartPositionRef.current = null;
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsDragging(null);
    dragStartPositionRef.current = null;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-[500px] object-contain shadow-md ${isDragging !== null ? 'cursor-move' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {/* Опциональный элемент подсказки при наведении на текст */}
      <div className="text-xs text-center text-gray-500 mt-2">
        {onUpdateTextPosition && "Нажмите и перетащите текст для его перемещения"}
      </div>
    </div>
  );
}
