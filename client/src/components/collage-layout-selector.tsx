import { useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

// Layout grid configurations
const LAYOUTS = {
  grid2x2: {
    rows: 2,
    cols: 2,
    areas: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  grid3x3: {
    rows: 3,
    cols: 3,
    areas: Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) / 3,
      y: Math.floor(i / 3) / 3,
      width: 1/3,
      height: 1/3,
    })),
  },
  horizontal3: {
    rows: 1,
    cols: 3,
    areas: [
      { x: 0, y: 0, width: 1/3, height: 1 },
      { x: 1/3, y: 0, width: 1/3, height: 1 },
      { x: 2/3, y: 0, width: 1/3, height: 1 },
    ],
  },
  vertical3: {
    rows: 3,
    cols: 1,
    areas: [
      { x: 0, y: 0, width: 1, height: 1/3 },
      { x: 0, y: 1/3, width: 1, height: 1/3 },
      { x: 0, y: 2/3, width: 1, height: 1/3 },
    ],
  },
  leftFocus: {
    rows: 2,
    cols: 2,
    areas: [
      { x: 0, y: 0, width: 2/3, height: 1 },
      { x: 2/3, y: 0, width: 1/3, height: 0.5 },
      { x: 2/3, y: 0.5, width: 1/3, height: 0.5 },
    ],
  },
  rightFocus: {
    rows: 2,
    cols: 2,
    areas: [
      { x: 1/3, y: 0, width: 2/3, height: 1 },
      { x: 0, y: 0, width: 1/3, height: 0.5 },
      { x: 0, y: 0.5, width: 1/3, height: 0.5 },
    ],
  },
};

interface CollageLayoutSelectorProps {
  layout: { id: string; name: string; cells: number };
  sourceImages: string[];
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  textContent: any[];
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onTextRender: () => void;
  onRemoveImage: (index: number) => void;
}

// Используем memo для предотвращения ненужных перерисовок

function CollageLayoutSelector({
  layout,
  sourceImages,
  filters,
  textContent,
  onCanvasReady,
  onTextRender,
  onRemoveImage,
}: CollageLayoutSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const canvasWidth = 800;
  const canvasHeight = 800;

  useEffect(() => {
    console.log("CollageLayoutSelector перерисовка - обнаружено изменение зависимостей");
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Prepare to draw images
    const layoutConfig = LAYOUTS[layout.id as keyof typeof LAYOUTS];
    if (!layoutConfig) return;

    // Никаких проверок или изменений стилизованных изображений
    // То, что пришло в sourceImages - то и используем, НЕ ТРОГАЯ его
    // Это обеспечивает работу со стилизованными изображениями без возврата к оригиналу
    console.log("Отрисовка коллажа со следующими изображениями:", sourceImages);

    // Load images (СТРОГО используем то, что пришло в sourceImages)
    const loadImages = async () => {
      imagesRef.current = [];
      
      // Логируем каждое изображение перед созданием
      sourceImages.forEach((src, index) => {
        console.log(`Создание Image объекта для изображения ${index} с src:`, 
          src.length > 100 ? src.substring(0, 100) + '...' : src);
      });

      // Create array of promises to load all images
      const imagePromises = sourceImages.map((src, index) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            console.log(`Изображение ${index} успешно загружено`);
            imagesRef.current[index] = img;
            resolve(img);
          };
          img.onerror = () => {
            console.error("Error loading image:", src);
            reject(new Error(`Failed to load image ${index}`));
          };
          img.src = src;
        });
      });

      try {
        // Wait for all images to load
        await Promise.all(imagePromises);
        
        // Draw the collage with all loaded images
        drawCollage();
        
        // Notify parent that canvas is ready
        onCanvasReady(canvas);
      } catch (error) {
        console.error("Failed to load images for collage:", error);
      }
    };

    const drawCollage = () => {
      // Clear canvas
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each image in its area
      layoutConfig.areas.forEach((area, index) => {
        if (index < sourceImages.length && imagesRef.current[index]) {
          const img = imagesRef.current[index];
          
          // Calculate position and size
          const x = area.x * canvas.width;
          const y = area.y * canvas.height;
          const width = area.width * canvas.width;
          const height = area.height * canvas.height;
          
          // Draw with filters
          ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
          
          // Draw the image by maintaining aspect ratio
          const imgAspect = img.width / img.height;
          const areaAspect = width / height;
          
          let drawWidth, drawHeight, offsetX, offsetY;
          
          if (imgAspect > areaAspect) {
            // Image is wider than area (proportionally)
            drawHeight = height;
            drawWidth = height * imgAspect;
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
          } else {
            // Image is taller than area (proportionally)
            drawWidth = width;
            drawHeight = width / imgAspect;
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
          }
          
          ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
          
          // Reset filter
          ctx.filter = "none";
          
          // Draw border around each image
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
        } else {
          // Draw placeholder for empty cell
          const x = area.x * canvas.width;
          const y = area.y * canvas.height;
          const width = area.width * canvas.width;
          const height = area.height * canvas.height;
          
          ctx.fillStyle = "#e0e0e0";
          ctx.fillRect(x, y, width, height);
          
          ctx.fillStyle = "#b0b0b0";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "Add Image",
            x + width / 2,
            y + height / 2
          );
          
          // Draw border
          ctx.strokeStyle = "#d0d0d0";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
        }
      });

      // Render text content
      onTextRender();
    };

    // Start loading images
    if (sourceImages.length > 0) {
      loadImages();
    } else {
      // Just draw the empty layout
      const layoutConfig = LAYOUTS[layout.id as keyof typeof LAYOUTS];
      if (layoutConfig) {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        layoutConfig.areas.forEach((area) => {
          const x = area.x * canvas.width;
          const y = area.y * canvas.height;
          const width = area.width * canvas.width;
          const height = area.height * canvas.height;
          
          ctx.fillStyle = "#e0e0e0";
          ctx.fillRect(x, y, width, height);
          
          ctx.fillStyle = "#b0b0b0";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "Add Image",
            x + width / 2,
            y + height / 2
          );
          
          ctx.strokeStyle = "#d0d0d0";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
        });
      }
      
      // Notify parent that canvas is ready
      onCanvasReady(canvas);
    }
    
  }, [layout, sourceImages, filters, onCanvasReady, onTextRender]);

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[600px] object-contain shadow-md"
      />
      
      {sourceImages.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {sourceImages.map((src, index) => (
            <div key={index} className="relative group">
              <img
                src={src}
                alt={`Source ${index + 1}`}
                className="w-16 h-16 object-cover rounded-md border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="w-6 h-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveImage(index)}
              >
                <Trash className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Экспортируем с использованием memo для предотвращения ненужных перерисовок

export default memo(CollageLayoutSelector, (prevProps, nextProps) => {
  // Проверяем важные изменения, которые действительно требуют перерисовки
  // Возвращаем true, если компонент НЕ нужно перерисовывать
  
  // Проверка изменения layout
  if (prevProps.layout.id !== nextProps.layout.id) {
    console.log("Layout изменен - требуется перерисовка");
    return false;
  }
  
  // Проверка изменений в sourceImages (глубокая проверка)
  if (prevProps.sourceImages.length !== nextProps.sourceImages.length) {
    console.log("Количество изображений изменилось - требуется перерисовка");
    return false;
  }
  
  // Проверяем содержимое изображений
  const imagesChanged = prevProps.sourceImages.some((src, i) => 
    src !== nextProps.sourceImages[i]
  );
  
  if (imagesChanged) {
    console.log("Содержимое изображений изменилось - требуется перерисовка");
    return false;
  }
  
  // Проверка изменений в фильтрах
  if (
    prevProps.filters.brightness !== nextProps.filters.brightness ||
    prevProps.filters.contrast !== nextProps.filters.contrast ||
    prevProps.filters.saturation !== nextProps.filters.saturation
  ) {
    console.log("Фильтры изменены - требуется перерисовка");
    return false;
  }
  
  // Если текста стало больше или меньше - перерисовываем
  if (prevProps.textContent.length !== nextProps.textContent.length) {
    console.log("Количество текстовых элементов изменилось - требуется перерисовка");
    return false;
  }
  
  // Если до сюда дошли, значит существенных изменений не обнаружено
  console.log("Существенных изменений не обнаружено - пропускаем перерисовку");
  return true;
});
