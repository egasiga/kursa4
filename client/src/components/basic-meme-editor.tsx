import { useState, useEffect, useRef } from 'react';
import { MemeTemplate } from '@shared/schema';

interface BasicMemeEditorProps {
  template: MemeTemplate;
  textContent: any[];
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export default function BasicMemeEditor({
  template,
  textContent,
  filters,
  onCanvasReady
}: BasicMemeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);

  // Отрисовка на canvas
  useEffect(() => {
    if (!canvasRef.current || !template.imageUrl) return;
    
    const renderCanvas = async () => {
      try {
        setLoading(true);
        
        // Создаем canvas контекст
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Загружаем изображение
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
          // Устанавливаем размеры canvas
          const maxWidth = 800;
          const maxHeight = 800;
          
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
          
          const calculatedWidth = Math.round(newWidth);
          const calculatedHeight = Math.round(newHeight);
          
          // Устанавливаем размеры canvas
          canvas.width = calculatedWidth;
          canvas.height = calculatedHeight;
          setCanvasSize({ width: calculatedWidth, height: calculatedHeight });
          
          // Масштаб для текста
          const scale = calculatedWidth / img.width;
          
          // Очищаем canvas
          ctx.clearRect(0, 0, calculatedWidth, calculatedHeight);
          
          // Рисуем изображение
          ctx.drawImage(img, 0, 0, calculatedWidth, calculatedHeight);
          
          // Применяем фильтры
          if (filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100) {
            // Яркость
            if (filters.brightness !== 100) {
              ctx.filter = `brightness(${filters.brightness / 100})`;
              ctx.drawImage(img, 0, 0, calculatedWidth, calculatedHeight);
              ctx.filter = 'none';
            }
            
            // Контраст
            if (filters.contrast !== 100) {
              ctx.filter = `contrast(${filters.contrast / 100})`;
              ctx.drawImage(img, 0, 0, calculatedWidth, calculatedHeight);
              ctx.filter = 'none';
            }
            
            // Насыщенность
            if (filters.saturation !== 100) {
              ctx.filter = `saturate(${filters.saturation / 100})`;
              ctx.drawImage(img, 0, 0, calculatedWidth, calculatedHeight);
              ctx.filter = 'none';
            }
          }
          
          // Рисуем текст
          textContent.forEach(item => {
            const textAreas = template.textAreas as any[] || [];
            const textArea = textAreas[item.areaIndex];
            if (!textArea) return;
            
            // Настройка шрифта
            const fontSize = Math.max(24, item.style.fontSize * scale);
            ctx.font = `bold ${fontSize}px ${item.style.fontFamily || 'Arial'}`;
            ctx.textAlign = item.style.align as CanvasTextAlign || 'center';
            
            // Позиция текста
            const originalWidth = 1200; // Стандартная ширина шаблонов
            const isImgflipTemplate = template.imageUrl.includes('imgflip.com');
            
            const scaledX = isImgflipTemplate ? 
              calculatedWidth * (textArea.x / originalWidth) : 
              textArea.x * scale;
              
            const scaledWidth = isImgflipTemplate ? 
              calculatedWidth * (textArea.width / originalWidth) : 
              textArea.width * scale;
              
            const scaledY = isImgflipTemplate ? 
              calculatedWidth * (textArea.y / originalWidth) : 
              textArea.y * scale;
              
            const scaledHeight = isImgflipTemplate ? 
              calculatedWidth * (textArea.height / originalWidth) : 
              textArea.height * scale;
            
            // Вычисляем центр текстовой области
            const xPos = scaledX + scaledWidth / 2 + (item.style.offsetX || 0) * scale;
            const yPos = scaledY + scaledHeight / 2 + (item.style.offsetY || 0) * scale;
            
            // Настраиваем обводку
            ctx.lineWidth = Math.max(3, item.style.strokeWidth * scale);
            ctx.strokeStyle = item.style.strokeColor || '#000000';
            
            // Разбиваем текст на строки если нужно
            const lines = wrapText(ctx, item.text, scaledWidth * 0.9);
            
            // Рисуем каждую строку текста
            const lineHeight = fontSize * 1.2;
            let offsetY = 0;
            
            lines.forEach((line, i) => {
              // Вертикальное смещение для многострочного текста
              const lineY = yPos + offsetY - (lines.length - 1) * lineHeight / 2;
              
              // Рисуем обводку
              ctx.strokeText(line, xPos, lineY);
              
              // Рисуем сам текст поверх обводки
              ctx.fillStyle = item.style.color || '#FFFFFF';
              ctx.fillText(line, xPos, lineY);
              
              offsetY += lineHeight;
            });
          });
          
          // Завершаем рендеринг
          setLoading(false);
          
          // Уведомляем родительский компонент о готовности canvas
          onCanvasReady(canvas);
        };
        
        img.onerror = (err) => {
          console.error('Ошибка при загрузке изображения:', err);
          setLoading(false);
        };
        
        // Начинаем загрузку изображения
        img.src = template.imageUrl;
        
      } catch (error) {
        console.error('Ошибка при отрисовке мема:', error);
        setLoading(false);
      }
    };
    
    renderCanvas();
  }, [template, template.imageUrl, textContent, filters, onCanvasReady]);
  
  // Вспомогательная функция для разбивки текста на строки
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    if (!text || !text.trim()) return [];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Если текст короткий или из одного слова
    if (words.length === 1 || ctx.measureText(text).width <= maxWidth) {
      return [text];
    }
    
    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Стили для canvas
  const canvasStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    maxWidth: '100%'
  };
  
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
            className={canvasSize.width ? 'block' : 'hidden'}
          />
        </div>
      )}
    </div>
  );
}