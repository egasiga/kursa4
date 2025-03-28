/**
 * Модуль для обработки изображений с использованием библиотеки Sharp
 * 
 * Этот модуль предоставляет простые функции для применения художественных фильтров
 * к изображениям, используя только библиотеку Sharp, которая уже установлена в проекте.
 * Не требует внешних API или дополнительных зависимостей.
 */

import sharp from 'sharp';
import { AiStyle } from '@shared/schema';

/**
 * Применяет стилизацию к изображению с помощью Sharp
 * @param imageBase64 Исходное изображение в формате base64 (с префиксом data:image)
 * @param styleParams Параметры стиля
 * @returns Стилизованное изображение в формате base64
 */
export async function applyImageStyles(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log(`Применение стиля: ${styleParams.aiModel}`);
    
    // Убираем префикс data:image/... из строки base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Получаем тип MIME из базового изображения
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    // Создаем буфер из данных base64
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Создаем объект sharp для работы с изображением
    let sharpImage = sharp(imageBuffer);
    
    // Получаем метаданные изображения
    const metadata = await sharpImage.metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    if (!width || !height) {
      throw new Error("Не удалось получить размеры изображения");
    }
    
    // Получаем имя стиля и интенсивность
    const styleName = styleParams.aiModel || "Нейронное искусство";
    const intensity = styleParams.styleIntensity !== undefined ? styleParams.styleIntensity : 1.0;
    
    // Применяем соответствующий стиль
    sharpImage = await applyStyle(sharpImage, styleName, intensity, width, height);
    
    // Получаем обработанное изображение в формате base64
    const processedImageBuffer = await sharpImage.toBuffer();
    const processedImageBase64 = processedImageBuffer.toString('base64');
    
    // Формируем правильный MIME-префикс
    return `data:${mime};base64,${processedImageBase64}`;
  } catch (error) {
    console.error('Ошибка при применении стиля:', error);
    // В случае ошибки возвращаем исходное изображение
    return imageBase64;
  }
}

/**
 * Применяет выбранный стиль к изображению
 */
async function applyStyle(image: sharp.Sharp, styleName: string, 
                         intensity: number, width: number, height: number): Promise<sharp.Sharp> {
  // Нормализуем интенсивность между 0 и 2
  const normalizedIntensity = Math.max(0, Math.min(2, intensity));
  
  switch (styleName) {
    case "Масляная живопись":
    case "Oil Painting":
      return applyOilPaintingEffect(image, normalizedIntensity);
      
    case "Акварель":
    case "Watercolor":
      return applyWatercolorEffect(image, normalizedIntensity);
      
    case "Набросок карандашом":
    case "Pencil Sketch":
      return applyPencilSketchEffect(image, normalizedIntensity);
      
    case "Тушь":
    case "Ink Drawing":
      return applyInkEffect(image, normalizedIntensity);
      
    case "Контурный рисунок":
    case "Line Drawing":
      return applyLineDrawingEffect(image, normalizedIntensity);
      
    case "Пиксель-арт":
    case "Pixel Art":
      return applyPixelArtEffect(image, normalizedIntensity, width, height);
      
    case "Аниме":
    case "Anime":
      return applyAnimeEffect(image, normalizedIntensity);
      
    case "Комикс":
    case "Comic":
      return applyComicEffect(image, normalizedIntensity);
      
    case "Неон":
    case "Neon":
      return applyNeonEffect(image, normalizedIntensity);
      
    case "Винтаж":
    case "Vintage":
      return applyVintageEffect(image, normalizedIntensity);
      
    case "Карикатура":
    case "Caricature":
      return applyCaricatureEffect(image, normalizedIntensity);
      
    case "Нейронное искусство":
    case "Neural Art":
      return applyNeuralArtEffect(image, normalizedIntensity);
      
    default:
      // По умолчанию немного увеличиваем яркость и контраст
      return image.modulate({ brightness: 1.1 }).linear(1.1, 0);
  }
}

/**
 * Применяет эффект масляной живописи
 */
function applyOilPaintingEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    // Повышаем насыщенность
    .modulate({ saturation: 1.0 + (0.4 * intensity), brightness: 1.1 })
    // Применяем медианный фильтр для эффекта мазков
    .median(Math.max(3, Math.round(7 * intensity)))
    // Добавляем контраст
    .linear(1.2, -10)
    // Добавляем текстуру
    .convolve({
      width: 3,
      height: 3,
      kernel: [
        -0.15, -0.15, -0.15,
        -0.15,  2.4,  -0.15,
        -0.15, -0.15, -0.15
      ],
      scale: 1.0
    })
    // Повышаем резкость
    .sharpen(Math.min(5, Math.round(7 * intensity)));
}

/**
 * Применяет эффект акварели
 */
function applyWatercolorEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    // Повышаем яркость
    .modulate({
      brightness: 1.2,
      saturation: 1.05 * intensity
    })
    // Размываем для эффекта растекания
    .blur(2 * intensity)
    // Добавляем легкую текстуру
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 0, 0, 0, 1.5, 0, 0, 0, 0],
      scale: 1
    })
    // Добавляем немного резкости
    .sharpen(3 * intensity)
    // Корректируем гамму
    .gamma(1.1);
}

/**
 * Применяет эффект карандашного наброска
 */
async function applyPencilSketchEffect(image: sharp.Sharp, intensity: number): Promise<sharp.Sharp> {
  try {
    // Подготовка изображения - делаем черно-белым и повышаем яркость
    const grayscaleBuffer = await image
      .grayscale()
      .modulate({ brightness: 1.4 })
      .toBuffer();
    
    // Создаем инвертированное изображение для эффекта dodge
    const invertedBuffer = await sharp(grayscaleBuffer)
      .negate()
      .blur(1.5)
      .linear(1.0, 20)
      .toBuffer();
    
    // Создаем основу для наброска
    let sketch = sharp(grayscaleBuffer);
    
    // Добавляем контуры
    sketch = sketch.convolve({
      width: 3,
      height: 3,
      kernel: [
        -1, -1, -1,
        -1,  9, -1,
        -1, -1, -1
      ],
      scale: 0.7 * intensity
    });
    
    // Инвертируем и настраиваем контраст
    sketch = sketch
      .negate()
      .linear(1.2 * intensity, 25);
    
    // Создаем окончательный эффект
    const sketchBuffer = await sketch.toBuffer();
    return sharp(sketchBuffer)
      .blur(0.4)
      .sharpen(Math.min(5, Math.max(1, 3 * intensity)))
      .modulate({ brightness: 1.1 })
      .threshold(200)
      .negate();
  } catch (error) {
    console.error('Ошибка при создании эффекта карандаша:', error);
    // Если что-то пошло не так, возвращаем простую версию
    return image
      .grayscale()
      .negate()
      .threshold(128)
      .negate();
  }
}

/**
 * Применяет эффект рисунка тушью
 */
function applyInkEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  const threshold = 100 + (1 - intensity) * 70;
  
  return image
    .grayscale()
    .normalize()
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
      scale: 2
    })
    .threshold(threshold)
    .sharpen(intensity * 10);
}

/**
 * Применяет эффект контурного рисунка
 */
function applyLineDrawingEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    .grayscale()
    .blur(0.5)
    .convolve({
      width: 3,
      height: 3,
      kernel: [
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1
      ],
      scale: 1
    })
    .threshold(100 + (1 - intensity) * 60)
    .negate();
}

/**
 * Применяет эффект пиксель-арта
 */
function applyPixelArtEffect(image: sharp.Sharp, intensity: number, width: number, height: number): sharp.Sharp {
  // Определяем размер пикселя на основе интенсивности
  const pixelSize = Math.max(2, Math.floor(10 * intensity));
  
  // Уменьшаем изображение и потом увеличиваем для создания эффекта пикселизации
  return image
    .modulate({ saturation: 1.3, brightness: 1.05 })
    .linear(1.1, -5)
    .resize(Math.floor(width / pixelSize), Math.floor(height / pixelSize), {
      kernel: 'nearest'
    })
    .resize(width, height, {
      kernel: 'nearest'
    });
}

/**
 * Применяет эффект аниме
 */
function applyAnimeEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    .modulate({ 
      saturation: 1.2 * intensity, 
      brightness: 1.05 
    })
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
      scale: 4
    })
    .blur(0.2);
}

/**
 * Применяет эффект комикса
 */
function applyComicEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    .modulate({ 
      saturation: 1.3 * intensity, 
      brightness: 1.1
    })
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      scale: 3
    })
    .threshold(140)
    .blur(0.3);
}

/**
 * Применяет неоновый эффект
 */
function applyNeonEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    .modulate({
      brightness: 0.8, 
      saturation: 1.5 * intensity,
      hue: 180 * intensity
    })
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      scale: 1
    })
    .negate()
    .normalize()
    .blur(0.5 * intensity);
}

/**
 * Применяет винтажный эффект
 */
function applyVintageEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    .modulate({
      brightness: 0.9,
      saturation: 0.7 * intensity,
      hue: 30
    })
    // Сепия - реализуем через цветовую модуляцию, т.к. .sepia() отсутствует в нашей версии sharp
    .tint({ r: 240, g: 200, b: 160 })
    .gamma(1.2)
    .blur(0.5 * intensity);
}

/**
 * Применяет эффект карикатуры
 */
function applyCaricatureEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    .modulate({ 
      saturation: 1.3 * intensity, 
      brightness: 1.1
    })
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
      scale: 2
    })
    .linear(1.3, 0);
}

/**
 * Применяет эффект "нейронного искусства"
 */
function applyNeuralArtEffect(image: sharp.Sharp, intensity: number): sharp.Sharp {
  return image
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
    })
    .modulate({
      brightness: 1.2, 
      saturation: 1.5 * intensity,
      hue: 45 * intensity
    })
    .sharpen(10 * intensity);
}

/**
 * Получает список доступных стилей
 */
export function getAvailableAiStyles(): AiStyle[] {
  return [
    {
      id: 1,
      name: "Масляная живопись",
      description: "Преобразуйте изображение в стиле масляной живописи с выразительными мазками и насыщенными цветами",
      previewUrl: null,
      apiParams: {
        aiModel: "Масляная живопись",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 2,
      name: "Акварель",
      description: "Преобразуйте изображение в нежный акварельный стиль с прозрачными красками и мягкими переходами",
      previewUrl: null,
      apiParams: {
        aiModel: "Акварель",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 3,
      name: "Набросок карандашом",
      description: "Преобразуйте изображение в детализированный карандашный набросок с тонкими линиями и тенями",
      previewUrl: null,
      apiParams: {
        aiModel: "Набросок карандашом",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 4,
      name: "Тушь",
      description: "Преобразуйте изображение в стиль рисунка тушью с выразительными штрихами и тонкими линиями",
      previewUrl: null,
      apiParams: {
        aiModel: "Тушь",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 5,
      name: "Контурный рисунок",
      description: "Преобразуйте изображение в чистый контурный рисунок с четкими линиями",
      previewUrl: null,
      apiParams: {
        aiModel: "Контурный рисунок",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 6,
      name: "Пиксель-арт",
      description: "Преобразуйте изображение в стиль пиксельной графики с ограниченной цветовой палитрой",
      previewUrl: null,
      apiParams: {
        aiModel: "Пиксель-арт",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 7,
      name: "Аниме",
      description: "Преобразуйте изображение в аниме-стиль с характерными чертами японской анимации",
      previewUrl: null,
      apiParams: {
        aiModel: "Аниме",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 8,
      name: "Комикс",
      description: "Преобразуйте изображение в стиль комикса с яркими цветами и четкими контурами",
      previewUrl: null,
      apiParams: {
        aiModel: "Комикс",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 9,
      name: "Неон",
      description: "Преобразуйте изображение в неоновый стиль с яркими светящимися краями",
      previewUrl: null,
      apiParams: {
        aiModel: "Неон",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 10,
      name: "Винтаж",
      description: "Преобразуйте изображение в винтажный стиль с эффектом старой фотографии",
      previewUrl: null,
      apiParams: {
        aiModel: "Винтаж",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 11,
      name: "Карикатура",
      description: "Преобразуйте изображение в стиль карикатуры с преувеличенными чертами",
      previewUrl: null,
      apiParams: {
        aiModel: "Карикатура",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    },
    {
      id: 12,
      name: "Нейронное искусство",
      description: "Преобразуйте изображение в стиль нейронного искусства с абстрактными формами и текстурами",
      previewUrl: null,
      apiParams: {
        aiModel: "Нейронное искусство",
        styleIntensity: 1.0,
        useLocalFiltersOnly: true
      }
    }
  ];
}