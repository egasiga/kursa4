import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { placeholderStyles } from '@/lib/placeholder-styles';
import { AiStyle } from './ai-style-selector';

// Пропсы для редактора изображений
interface ImageEditorProps {
  onStyleSelect: (style: AiStyle) => void;
  selectedStyle?: AiStyle;
  onApplyStyle: () => void;
  onRevertStyle: () => void;
  isApplied: boolean;
  isLoading: boolean;
}

export default function ImageStyleEditor({
  onStyleSelect,
  selectedStyle,
  onApplyStyle,
  onRevertStyle,
  isApplied,
  isLoading
}: ImageEditorProps) {
  const [styles, setStyles] = useState<AiStyle[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка стилей при монтировании компонента
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        setLoading(true);
        // Сначала попробуем загрузить из API
        const response = await apiRequest("GET", '/api/styles');
        const data = await response.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
          setStyles(data as AiStyle[]);
        } else {
          // Иначе используем заглушки
          setStyles(placeholderStyles);
        }
      } catch (error) {
        console.error('Ошибка при загрузке стилей:', error);
        // Если API недоступно, используем заглушки
        setStyles(placeholderStyles);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, []);

  // Определяем, активна ли кнопка применения стиля
  const isApplyDisabled = !selectedStyle || isLoading;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Художественные стили</h3>
            {isApplied && <Badge variant="outline">Стиль применен</Badge>}
          </div>
          
          <p className="text-sm text-gray-600">Выберите художественный стиль для вашего изображения</p>

          {isApplied ? (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={onRevertStyle} 
                className="flex-1"
                disabled={isLoading}
              >
                Вернуть оригинал
              </Button>
            </div>
          ) : (
            <Button 
              onClick={onApplyStyle} 
              className="w-full" 
              disabled={isApplyDisabled}
            >
              {isLoading ? 'Применение стиля...' : 'Применить выбранный стиль'}
            </Button>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {loading ? (
              // Скелетоны для загрузки
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-24 w-full rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                </div>
              ))
            ) : (
              // Карточки стилей
              styles.map((style) => (
                <div
                  key={style.id}
                  className={`cursor-pointer border rounded-md p-2 transition-all ${
                    selectedStyle?.id === style.id ? 'ring-2 ring-primary' : 'hover:border-gray-400'
                  }`}
                  onClick={() => onStyleSelect(style)}
                >
                  <div
                    className="h-24 bg-cover bg-center rounded-md mb-1"
                    style={{ backgroundImage: `url(${style.imageUrl})` }}
                  />
                  <p className="text-xs text-center truncate">{style.name}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}