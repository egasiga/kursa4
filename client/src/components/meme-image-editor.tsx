import { useState, useEffect, useRef } from 'react';
import { MemeTemplate } from '@shared/schema';
import { applyFiltersToImage, loadImage } from '@/lib/image-utils';

interface MemeImageEditorProps {
  template: MemeTemplate;
  textContent: any[];
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onTextRender: () => void;
  onUpdateTextPosition?: (index: number, offsetX: number, offsetY: number) => void;
}

export default function MemeImageEditor({
  template,
  textContent,
  filters,
  onCanvasReady,
  onTextRender,
  onUpdateTextPosition
}: MemeImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [draggingText, setDraggingText] = useState<{index: number, startX: number, startY: number} | null>(null);
  const [scale, setScale] = useState(1);

  // Отрисовка текста на изображении (отдельная функция)
  const renderImage = useRef<(img: HTMLImageElement) => void>((img) => {});
  
  // Настраиваем функцию отрисовки изображения
  useEffect(() => {
    // Инициализируем функцию отрисовки, которая будет использоваться при загрузке изображения
    renderImage.current = (img: HTMLImageElement) => {
      if (!canvasRef.current) return;
      
      // Определяем максимальные размеры для canvas (увеличиваем размер)
      const maxWidth = 800;
      const maxHeight = 800;
      
      // Вычисляем масштаб для изображения
      let newWidth = img.width;
      let newHeight = img.height;
      const imageRatio = img.width / img.height;
      
      if (img.width > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / imageRatio;
      }
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * imageRatio;
      }
      
      // Устанавливаем новые размеры canvas
      const calculatedWidth = Math.round(newWidth);
      const calculatedHeight = Math.round(newHeight);
      
      canvasRef.current.width = calculatedWidth;
      canvasRef.current.height = calculatedHeight;
      setCanvasSize({ width: calculatedWidth, height: calculatedHeight });
      
      // Вычисляем масштаб для дальнейшего использования
      setScale(calculatedWidth / img.width);
      
      console.log('Новые размеры canvas:', calculatedWidth, 'x', calculatedHeight);
      
      // Получаем контекст canvas и отрисовываем изображение
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Очищаем canvas
        ctx.clearRect(0, 0, calculatedWidth, calculatedHeight);
        
        // Отрисовываем изображение напрямую, без фильтров для начала
        ctx.drawImage(img, 0, 0, calculatedWidth, calculatedHeight);
        
        // Затем применяем фильтры если нужно
        if (filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100) {
          applyFiltersToImage(ctx, img, filters, calculatedWidth, calculatedHeight);
        }
        
        console.log('Изображение отрисовано на canvas');
        
        // Сначала уведомляем родительский компонент о готовности canvas
        onCanvasReady(canvasRef.current!);
        
        // Затем отрисовываем текст с небольшой задержкой
        setTimeout(() => {
          console.log("Вызываем onTextRender из MemeImageEditor");
          onTextRender();
        }, 200);
      }
    };
  }, [filters, onCanvasReady, onTextRender, textContent]);
  
  // Загрузка и отрисовка изображения
  useEffect(() => {
    if (!template || !template.imageUrl) {
      setLoading(false);
      return;
    }

    const loadTemplateImage = async () => {
      try {
        setLoading(true);
        console.log('Начало renderCanvas с URL:', template.imageUrl);
        
        // Создаем обычный Image объект
        const img = new Image();
        img.crossOrigin = "anonymous"; // Это нужно для внешних изображений
        
        img.onload = () => {
          console.log('Изображение загружено, размеры:', img.width, 'x', img.height);
          renderImage.current(img);
          setLoading(false);
        };
        
        img.onerror = (err) => {
          console.error('Ошибка при загрузке изображения:', err);
          setLoading(false);
        };
        
        // Начинаем загрузку изображения
        console.log('Загружаю изображение...');
        img.src = template.imageUrl;
        
      } catch (error) {
        console.error('Ошибка при загрузке изображения шаблона:', error);
        setLoading(false);
      }
    };

    loadTemplateImage();
  }, [template, template.imageUrl]);

  // Обработчики для перетаскивания текста
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !template.textAreas || !onUpdateTextPosition) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Проверяем, нажали ли мы на текстовую область
    const textAreas = template.textAreas as any[] || [];
    const clickedTextIndex = textAreas.findIndex((area, index) => {
      const areaX = area.x * scale;
      const areaY = area.y * scale;
      const areaWidth = area.width * scale;
      const areaHeight = area.height * scale;
      
      // Получаем смещение из textContent, если оно есть
      const textItem = textContent.find(t => t.areaIndex === index);
      const offsetX = textItem?.style?.offsetX || 0;
      const offsetY = textItem?.style?.offsetY || 0;
      
      const centerX = areaX + areaWidth / 2 + offsetX;
      const centerY = areaY + areaHeight / 2 + offsetY;
      
      // Проверяем, находится ли курсор в пределах текстовой области (с запасом)
      const hitAreaSize = Math.max(50, Math.min(areaWidth, areaHeight));
      return (
        Math.abs(x - centerX) < hitAreaSize / 2 &&
        Math.abs(y - centerY) < hitAreaSize / 2
      );
    });
    
    if (clickedTextIndex !== -1) {
      setDraggingText({
        index: clickedTextIndex,
        startX: x,
        startY: y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingText || !canvasRef.current || !onUpdateTextPosition) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Вычисляем смещение относительно начальной позиции
    const deltaX = x - draggingText.startX;
    const deltaY = y - draggingText.startY;
    
    // Получаем текущее смещение для текстовой области
    const textItem = textContent.find(t => t.areaIndex === draggingText.index);
    const currentOffsetX = textItem?.style?.offsetX || 0;
    const currentOffsetY = textItem?.style?.offsetY || 0;
    
    // Обновляем позицию текста
    onUpdateTextPosition(draggingText.index, currentOffsetX + deltaX, currentOffsetY + deltaY);
    
    // Обновляем начальную позицию для следующего движения
    setDraggingText({
      ...draggingText,
      startX: x,
      startY: y
    });
  };

  const handleMouseUp = () => {
    setDraggingText(null);
  };

  // Стили для canvas
  const canvasStyle = {
    cursor: draggingText ? 'grabbing' : 'default',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    maxWidth: '100%'
  };

  // Добавим запасной вариант, если canvas не отображает изображение
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {loading ? (
        <div className="relative w-full h-96 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
          <p className="text-gray-400">Загрузка изображения...</p>
        </div>
      ) : (
        <div className="relative">
          {/* Запасное изображение в случае проблем с canvas */}
          {!canvasSize.width && template.imageUrl && (
            <img 
              src={template.imageUrl} 
              alt={template.name || "Шаблон мема"} 
              className="w-full max-w-[800px] h-auto rounded-md border border-gray-200"
            />
          )}
          
          <canvas
            ref={canvasRef}
            style={canvasStyle}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={canvasSize.width ? 'block' : 'hidden'}
          />
        </div>
      )}

    </div>
  );
}