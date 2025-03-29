import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

/**
 * Интерфейс для контекста стилизации - упрощенная версия с необратимой стилизацией
 */
interface StyleContextType {
  currentImage: string | null;
  setCurrentImage: (image: string | null) => void;
  applyStyle: (styledImage: string) => void; // Необратимо заменяет текущее изображение
  lastStyleUsed: string | null;
  setLastStyleUsed: (styleName: string | null) => void;
}

// Создаем контекст с начальным состоянием
const StyleContext = createContext<StyleContextType>({
  currentImage: null,
  setCurrentImage: () => {},
  applyStyle: () => {},
  lastStyleUsed: null,
  setLastStyleUsed: () => {},
});

/**
 * Провайдер контекста стилизации
 */
export const StyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Состояние для хранения текущего изображения (оно может быть уже стилизованным)
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  // Состояние для хранения информации о последнем примененном стиле
  const [lastStyleUsed, setLastStyleUsed] = useState<string | null>(null);

  // При монтировании компонента пытаемся восстановить состояние из localStorage
  useEffect(() => {
    try {
      const savedCurrentImage = localStorage.getItem('currentImage');
      const savedLastStyleUsed = localStorage.getItem('lastStyleUsed');
      
      if (savedCurrentImage) setCurrentImage(savedCurrentImage);
      if (savedLastStyleUsed) setLastStyleUsed(savedLastStyleUsed);
      
      console.log("StyleContext: Изображение восстановлено из localStorage", {
        hasCurrentImage: !!savedCurrentImage,
        lastStyleUsed: savedLastStyleUsed
      });
    } catch (error) {
      console.error("StyleContext: Ошибка восстановления данных из localStorage", error);
    }
  }, []);

  // Сохраняем текущее изображение в localStorage при изменении
  useEffect(() => {
    try {
      if (currentImage) {
        localStorage.setItem('currentImage', currentImage);
        console.log("StyleContext: Текущее изображение сохранено в localStorage");
      }
    } catch (error) {
      console.error("StyleContext: Ошибка сохранения текущего изображения", error);
    }
  }, [currentImage]);

  // Сохраняем информацию о последнем стиле в localStorage при изменении
  useEffect(() => {
    try {
      if (lastStyleUsed) {
        localStorage.setItem('lastStyleUsed', lastStyleUsed);
        console.log("StyleContext: Информация о последнем стиле сохранена:", lastStyleUsed);
      }
    } catch (error) {
      console.error("StyleContext: Ошибка сохранения информации о стиле", error);
    }
  }, [lastStyleUsed]);

  /**
   * Необратимо применяет стиль к изображению
   * @param styledImage стилизованное изображение в формате base64
   */
  const applyStyle = (styledImage: string) => {
    console.log("StyleContext: Необратимое применение стиля");
    // Заменяем текущее изображение стилизованным без сохранения оригинала
    setCurrentImage(styledImage);
  };

  // Значение контекста, которое будет доступно потребителям
  const contextValue: StyleContextType = {
    currentImage,
    setCurrentImage,
    applyStyle,
    lastStyleUsed,
    setLastStyleUsed,
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