import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface MemeTemplateProps {
  template: {
    id: string;
    name: string;
    imageUrl: string;
  };
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  textContent: Array<{
    id: string;
    text: string;
    style: {
      fontFamily: string;
      fontSize: number;
      color: string;
      strokeColor: string;
      strokeWidth: number;
      align: string;
    };
    position: {
      x: number;
      y: number;
    };
  }>;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onTextRender: () => void;
  onTextPositionUpdate?: (id: string, x: number, y: number) => void;
}

export default function MemeTemplateSelector({
  template,
  filters,
  textContent,
  onCanvasReady,
  onTextRender,
  onTextPositionUpdate,
}: MemeTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const canvasWidth = 800;
  const canvasHeight = 800;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load image
    const loadImage = async () => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageRef.current = img;
          resolve(img);
        };
        img.onerror = () => {
          console.error("Error loading template image:", template.imageUrl);
          reject(new Error(`Failed to load template image`));
        };
        img.src = template.imageUrl;
      });
    };

    const drawMeme = (img: HTMLImageElement) => {
      // Clear canvas
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply filters
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
      
      // Calculate size while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > canvasAspect) {
        // Image is wider than canvas (proportionally)
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      } else {
        // Image is taller than canvas (proportionally)
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      }
      
      // Draw the image
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      // Reset filter for text
      ctx.filter = "none";
      
      // Render text
      onTextRender();
      
      // Notify parent that canvas is ready
      onCanvasReady(canvas);
    };

    const renderMeme = async () => {
      try {
        // If we already have the image loaded, use it
        if (imageRef.current) {
          drawMeme(imageRef.current);
        } else {
          // Otherwise load the image first
          const img = await loadImage();
          drawMeme(img);
        }
      } catch (error) {
        console.error("Failed to render meme:", error);
        // Draw a placeholder for the error state
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#b0b0b0";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Error loading template image",
          canvas.width / 2,
          canvas.height / 2
        );
        
        // Still notify parent about canvas
        onCanvasReady(canvas);
      }
    };

    renderMeme();
  }, [template, filters, onCanvasReady, onTextRender]);

  // Handle mouse interactions for text dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onTextPositionUpdate) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Проверяем, попали ли мы на какой-либо текстовый элемент
    const clickedTextElement = textContent.find((item) => {
      const textWidth = item.text.length * (item.style.fontSize / 1.5);
      const textHeight = item.style.fontSize * 1.2;
      
      return (
        Math.abs(x - item.position.x) < textWidth / 2 &&
        Math.abs(y - item.position.y) < textHeight / 2
      );
    });
    
    if (clickedTextElement) {
      // Устанавливаем флаг перетаскивания
      const textId = clickedTextElement.id;
      
      // Слушаем события перемещения мыши и отпускания
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const canvasRect = canvas.getBoundingClientRect();
        const newX = moveEvent.clientX - canvasRect.left;
        const newY = moveEvent.clientY - canvasRect.top;
        
        onTextPositionUpdate(textId, newX, newY);
      };
      
      const handleMouseUp = () => {
        // Удаляем обработчики событий
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      
      // Добавляем обработчики событий
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[600px] object-contain shadow-md"
        onMouseDown={handleMouseDown}
        style={{ cursor: "default" }}
      />
    </div>
  );
}