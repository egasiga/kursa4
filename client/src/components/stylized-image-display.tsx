import { useState, useEffect, useRef } from "react";
import { useStyleContext } from "@/context/StyleContext";

// Компонент для отображения стилизованного изображения
interface StylizedImageDisplayProps {
  onImageReady?: (canvas: HTMLCanvasElement) => void;
  sourceImages: string[];
}

export function StylizedImageDisplay({ onImageReady, sourceImages }: StylizedImageDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentImage, lastStyleUsed } = useStyleContext();
  const [displayImage, setDisplayImage] = useState<string | null>(null);

  // При монтировании и при изменении изображений
  useEffect(() => {
    console.log("StylizedImageDisplay useEffect: Обновление отображения", {
      hasCurrentImage: !!currentImage,
      lastStyleUsed,
      sourceImagesLength: sourceImages.length
    });

    // Определяем, какое изображение показывать: приоритет тому, что в контексте
    if (currentImage) {
      console.log("StylizedImageDisplay: Отображение изображения из контекста");
      setDisplayImage(currentImage);
    } else if (sourceImages.length > 0) {
      console.log("StylizedImageDisplay: Отображение первого исходного изображения");
      setDisplayImage(sourceImages[0]);
    } else {
      console.log("StylizedImageDisplay: Нет изображений для отображения");
      setDisplayImage(null);
    }
  }, [currentImage, lastStyleUsed, sourceImages]);

  // Рисуем изображение на канвасе
  useEffect(() => {
    if (!canvasRef.current || !displayImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Отрисовка изображения на канвасе
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Установка размеров канваса под размер изображения
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Очистка канваса
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Отрисовка изображения
      ctx.drawImage(img, 0, 0);
      
      // Оповещаем родителя, что канвас готов
      if (onImageReady) {
        onImageReady(canvas);
      }
      
      console.log("StylizedImageDisplay: Изображение успешно отрисовано на канвасе");
    };
    
    img.onerror = (error) => {
      console.error("StylizedImageDisplay: Ошибка загрузки изображения", error);
    };
    
    console.log("StylizedImageDisplay: Загрузка изображения на канвас");
    img.src = displayImage;
  }, [displayImage, onImageReady]);

  return (
    <div className="flex flex-col items-center">
      <canvas 
        ref={canvasRef}
        className="max-w-full max-h-[600px] object-contain"
      />
      {lastStyleUsed && (
        <div className="mt-2 text-sm text-center text-green-600">
          <span>✓ Изображение стилизовано в стиле {lastStyleUsed}</span>
        </div>
      )}
    </div>
  );
}