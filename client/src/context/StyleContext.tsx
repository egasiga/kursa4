import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

/**
 * Интерфейс для контекста стилизации
 */
interface StyleContextType {
  stylizedImage: string | null;
  setStylizedImage: (image: string | null) => void;
  originalImage: string | null;
  setOriginalImage: (image: string | null) => void;
  persistImage: (stylized: string, original: string) => void;
  resetStylizedImage: () => void;
  isStylized: boolean;
}

// Создаем контекст с начальным состоянием
const StyleContext = createContext<StyleContextType>({
  stylizedImage: null,
  setStylizedImage: () => {},
  originalImage: null, 
  setOriginalImage: () => {},
  persistImage: () => {},
  resetStylizedImage: () => {},
  isStylized: false,
});

/**
 * Провайдер контекста стилизации
 */
export const StyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Состояние для хранения стилизованного изображения
  const [stylizedImage, setStylizedImage] = useState<string | null>(null);
  // Состояние для хранения оригинального изображения
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  // Флаг стилизации
  const [isStylized, setIsStylized] = useState<boolean>(false);

  // При монтировании компонента пытаемся восстановить состояние из localStorage
  useEffect(() => {
    try {
      const savedStylizedImage = localStorage.getItem('stylizedImage');
      const savedOriginalImage = localStorage.getItem('originalImage');
      const savedIsStylized = localStorage.getItem('isStylized');
      
      if (savedStylizedImage) setStylizedImage(savedStylizedImage);
      if (savedOriginalImage) setOriginalImage(savedOriginalImage);
      if (savedIsStylized) setIsStylized(savedIsStylized === 'true');
      
      console.log("StyleContext: Изображения восстановлены из localStorage", {
        hasStylized: !!savedStylizedImage,
        hasOriginal: !!savedOriginalImage,
        isStylized: savedIsStylized
      });
    } catch (error) {
      console.error("StyleContext: Ошибка восстановления данных из localStorage", error);
    }
  }, []);

  // Сохраняем стилизованное изображение в localStorage при изменении
  useEffect(() => {
    try {
      if (stylizedImage) {
        localStorage.setItem('stylizedImage', stylizedImage);
        console.log("StyleContext: Стилизованное изображение сохранено в localStorage");
      }
    } catch (error) {
      console.error("StyleContext: Ошибка сохранения стилизованного изображения", error);
    }
  }, [stylizedImage]);

  // Сохраняем оригинальное изображение в localStorage при изменении
  useEffect(() => {
    try {
      if (originalImage) {
        localStorage.setItem('originalImage', originalImage);
        console.log("StyleContext: Оригинальное изображение сохранено в localStorage");
      }
    } catch (error) {
      console.error("StyleContext: Ошибка сохранения оригинального изображения", error);
    }
  }, [originalImage]);

  // Сохраняем флаг стилизации в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem('isStylized', String(isStylized));
      console.log("StyleContext: Сохранен флаг стилизации:", isStylized);
    } catch (error) {
      console.error("StyleContext: Ошибка сохранения флага стилизации", error);
    }
  }, [isStylized]);

  /**
   * Сохраняет пару изображений (стилизованное + оригинальное)
   */
  const persistImage = (stylized: string, original: string) => {
    console.log("StyleContext: Сохранение пары изображений (стилизованное + оригинальное)");
    setStylizedImage(stylized);
    setOriginalImage(original);
    setIsStylized(true);
  };

  /**
   * Сбрасывает стилизацию и возвращает оригинальное изображение
   */
  const resetStylizedImage = () => {
    console.log("StyleContext: Сброс стилизации");
    setIsStylized(false);
  };

  // Значение контекста, которое будет доступно потребителям
  const contextValue: StyleContextType = {
    stylizedImage,
    setStylizedImage,
    originalImage,
    setOriginalImage,
    persistImage,
    resetStylizedImage,
    isStylized,
  };

  return (
    <StyleContext.Provider value={contextValue}>
      {children}
    </StyleContext.Provider>
  );
};

/**
 * Хук для использования контекста стилизации
 */
export const useStyleContext = () => {
  const context = useContext(StyleContext);
  
  if (!context) {
    throw new Error('useStyleContext must be used within a StyleProvider');
  }
  
  return context;
};