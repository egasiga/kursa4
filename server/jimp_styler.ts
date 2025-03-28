/**
 * Модуль для стилизации изображений с использованием библиотеки Jimp
 * 
 * Jimp - полностью бесплатная библиотека для обработки изображений в JavaScript/TypeScript,
 * не требующая внешних зависимостей или API ключей
 */

import * as JimpModule from 'jimp';
const Jimp = JimpModule;
import { AiStyle } from '@shared/schema';

/**
 * Применяет стилизацию к изображению с помощью Jimp
 * @param imageBase64 Исходное изображение в формате base64 (с префиксом data:image)
 * @param styleParams Параметры стиля
 * @returns Стилизованное изображение в формате base64
 */
export async function jimpStyleImage(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log(`Применение стиля Jimp: ${styleParams.aiModel}`);
    
    // Убираем префикс data:image/... из строки base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Получаем тип MIME из базового изображения
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    // Создаем буфер из данных base64
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Загружаем изображение в Jimp
    const image = await Jimp.read(imageBuffer);
    
    // Получаем имя стиля и интенсивность
    const styleName = styleParams.aiModel || "Нейронное искусство";
    const intensity = styleParams.styleIntensity !== undefined ? styleParams.styleIntensity : 1.0;
    
    // Применяем соответствующий стиль
    await applyStyle(image, styleName, intensity);
    
    // Получаем обработанное изображение в формате base64
    const processedBase64 = await image.getBase64Async(mime);
    
    return processedBase64;
  } catch (error) {
    console.error('Ошибка при применении стиля Jimp:', error);
    // В случае ошибки возвращаем исходное изображение
    return imageBase64;
  }
}

/**
 * Применяет выбранный стиль к изображению
 * @param image Объект Jimp с изображением
 * @param styleName Название стиля
 * @param intensity Интенсивность эффекта (0-2)
 */
async function applyStyle(image: Jimp, styleName: string, intensity: number): Promise<void> {
  switch (styleName) {
    case "Масляная живопись":
    case "Oil Painting":
      await applyOilPaintingEffect(image, intensity);
      break;
      
    case "Акварель":
    case "Watercolor":
      await applyWatercolorEffect(image, intensity);
      break;
      
    case "Набросок карандашом":
    case "Pencil Sketch":
      await applyPencilSketchEffect(image, intensity);
      break;
      
    case "Тушь":
    case "Ink Drawing":
      await applyInkEffect(image, intensity);
      break;
      
    case "Контурный рисунок":
    case "Line Drawing":
      await applyLineDrawingEffect(image, intensity);
      break;
      
    case "Пиксель-арт":
    case "Pixel Art":
      await applyPixelArtEffect(image, intensity);
      break;
      
    case "Аниме":
    case "Anime":
      await applyAnimeEffect(image, intensity);
      break;
      
    case "Комикс":
    case "Comic":
      await applyComicEffect(image, intensity);
      break;
      
    case "Неон":
    case "Neon":
      await applyNeonEffect(image, intensity);
      break;
      
    case "Винтаж":
    case "Vintage":
      await applyVintageEffect(image, intensity);
      break;
      
    case "Карикатура":
    case "Caricature":
      await applyCaricatureEffect(image, intensity);
      break;
      
    case "Нейронное искусство":
    case "Neural Art":
      await applyNeuralArtEffect(image, intensity);
      break;
      
    default:
      // По умолчанию просто делаем немного ярче и контрастнее
      image.brightness(0.1).contrast(0.1);
      break;
  }
}

/**
 * Применяет эффект масляной живописи
 */
async function applyOilPaintingEffect(image: Jimp, intensity: number): Promise<void> {
  // Масляная живопись: повышенная насыщенность, контраст и текстура
  const effectStrength = 0.2 * intensity;
  
  // Повышаем насыщенность
  image.color([
    { apply: 'saturate', params: [intensity * 30] }
  ]);
  
  // Повышаем контраст
  image.contrast(effectStrength);
  
  // Применяем постеризацию для создания "областей" цвета
  const posterizeLevel = Math.max(3, Math.round(7 - intensity * 3));
  applyPosterize(image, posterizeLevel);
  
  // Добавляем текстуру путем легкого размытия и повышения резкости
  image.blur(1);
  image.convolute([
    [-1, -1, -1],
    [-1,  9, -1],
    [-1, -1, -1]
  ]);
  
  // Корректируем яркость
  image.brightness(effectStrength / 2);
}

/**
 * Применяет эффект акварели
 */
async function applyWatercolorEffect(image: Jimp, intensity: number): Promise<void> {
  // Акварель: мягкие тона, размытие, легкая насыщенность
  
  // Увеличиваем яркость
  image.brightness(0.1 * intensity);
  
  // Немного снижаем насыщенность
  image.color([
    { apply: 'saturate', params: [intensity * 10] }
  ]);
  
  // Легкое размытие для эффекта растекания краски
  image.blur(2 * intensity);
  
  // Добавляем легкую постеризацию для создания акварельных областей
  const posterizeLevel = Math.max(5, Math.round(10 - intensity * 4));
  applyPosterize(image, posterizeLevel);
  
  // Повышаем яркость для более светлого результата
  image.brightness(0.1);
}

/**
 * Применяет эффект карандашного наброска
 */
async function applyPencilSketchEffect(image: Jimp, intensity: number): Promise<void> {
  // Создаем чёрно-белую копию
  const grayscale = image.clone().greyscale();
  
  // Инвертируем для "негативного" изображения
  const inverted = grayscale.clone().invert();
  
  // Размываем инвертированное изображение
  inverted.blur(intensity * 3);
  
  // "Сумма уклонения" (dodge blend)
  // Реализуем это через манипуляцию пикселями
  image.greyscale();
  
  // Имитируем смешивание dodge с помощью пиксельного манипулирования
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x: number, y: number, idx: number) {
    const basePixel = image.bitmap.data[idx] / 255;
    const blendPixel = inverted.bitmap.data[idx] / 255;
    
    // Dodge формула: result = base / (1 - blend)
    let result = basePixel / (1 - blendPixel + 0.01);
    result = Math.min(1, result);
    
    // Усиливаем эффект в зависимости от интенсивности
    result = Math.pow(result, 1 / (intensity * 0.5 + 0.5));
    
    // Устанавливаем результат
    image.bitmap.data[idx] = image.bitmap.data[idx + 1] = image.bitmap.data[idx + 2] = 
      Math.round(result * 255);
  });
  
  // Повышаем контраст для более чётких линий
  image.contrast(intensity * 0.3);
}

/**
 * Применяет эффект рисунка тушью
 */
async function applyInkEffect(image: Jimp, intensity: number): Promise<void> {
  // Преобразуем в чёрно-белое
  image.greyscale();
  
  // Повышаем контраст
  image.contrast(intensity * 0.5);
  
  // Применяем порог для получения только черных и белых цветов
  // Чем выше intensity, тем больше черных линий
  const threshold = 120 + (1 - intensity) * 50;
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const val = image.bitmap.data[idx];
    const newVal = val < threshold ? 0 : 255;
    image.bitmap.data[idx] = image.bitmap.data[idx + 1] = image.bitmap.data[idx + 2] = newVal;
  });
  
  // Добавляем немного размытия для сглаживания резких краёв
  if (intensity < 1) {
    image.blur(0.5);
  }
}

/**
 * Применяет эффект контурного рисунка
 */
async function applyLineDrawingEffect(image: Jimp, intensity: number): Promise<void> {
  // Создаем копию для выделения краев
  const edged = image.clone().greyscale();
  
  // Применяем детектор краев (аппроксимация через свёртку)
  edged.convolute([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ]);
  
  // Инвертируем для получения черных линий на белом фоне
  edged.invert();
  
  // Регулируем порог в зависимости от интенсивности
  const threshold = 200 - (intensity * 50);
  edged.scan(0, 0, edged.bitmap.width, edged.bitmap.height, function(x, y, idx) {
    const val = edged.bitmap.data[idx];
    const newVal = val < threshold ? 0 : 255;
    edged.bitmap.data[idx] = edged.bitmap.data[idx + 1] = edged.bitmap.data[idx + 2] = newVal;
  });
  
  // Заменяем оригинальное изображение обработанным
  image.bitmap.data = edged.bitmap.data;
}

/**
 * Применяет эффект пиксель-арта
 */
async function applyPixelArtEffect(image: Jimp, intensity: number): Promise<void> {
  // Определяем размер пикселя в зависимости от интенсивности
  const pixelSize = Math.max(2, Math.round(2 + intensity * 10));
  
  // Сначала делаем изображение маленьким, потом увеличиваем - это создаст пиксели
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  const smallWidth = Math.floor(width / pixelSize);
  const smallHeight = Math.floor(height / pixelSize);
  
  // Уменьшаем размер
  image.resize(smallWidth, smallHeight, Jimp.RESIZE_NEAREST_NEIGHBOR);
  
  // Увеличиваем обратно без сглаживания
  image.resize(width, height, Jimp.RESIZE_NEAREST_NEIGHBOR);
  
  // Повышаем насыщенность для более яркого вида
  image.color([
    { apply: 'saturate', params: [intensity * 20] }
  ]);
  
  // Уменьшаем количество цветов для пиксельного стиля
  const colorLevels = Math.max(4, Math.min(16, Math.round(8 - intensity * 4 + 4)));
  applyPosterize(image, colorLevels);
}

/**
 * Применяет эффект аниме-стиля
 */
async function applyAnimeEffect(image: Jimp, intensity: number): Promise<void> {
  // Усиливаем насыщенность
  image.color([
    { apply: 'saturate', params: [intensity * 40] }
  ]);
  
  // Повышаем контраст
  image.contrast(intensity * 0.4);
  
  // Слегка размываем
  image.blur(1);
  
  // Применяем детектор краев, чтобы найти границы
  const edges = image.clone().greyscale();
  edges.convolute([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ]);
  
  // Инвертируем и настраиваем порог для получения четких линий
  edges.invert();
  const threshold = 200 - (intensity * 40);
  edges.scan(0, 0, edges.bitmap.width, edges.bitmap.height, function(x, y, idx) {
    const val = edges.bitmap.data[idx];
    edges.bitmap.data[idx] = edges.bitmap.data[idx + 1] = edges.bitmap.data[idx + 2] = 
      val < threshold ? 0 : 255;
  });
  
  // Смешиваем исходное изображение с контурами
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    // Если у нас есть линия (черный пиксель) на слое с краями, затемняем пиксель
    if (edges.bitmap.data[idx] < 128) {
      // Темная линия
      image.bitmap.data[idx] = Math.round(image.bitmap.data[idx] * 0.6);
      image.bitmap.data[idx + 1] = Math.round(image.bitmap.data[idx + 1] * 0.6);
      image.bitmap.data[idx + 2] = Math.round(image.bitmap.data[idx + 2] * 0.6);
    }
  });
  
  // Сглаживаем цвета - уменьшаем количество цветовых уровней
  applyPosterize(image, 24 - Math.round(intensity * 16));
}

/**
 * Применяет эффект комикса
 */
async function applyComicEffect(image: Jimp, intensity: number): Promise<void> {
  // Повышаем насыщенность
  image.color([
    { apply: 'saturate', params: [intensity * 50] }
  ]);
  
  // Повышаем контраст
  image.contrast(intensity * 0.5);
  
  // Создаем слой с границами
  const edges = image.clone().greyscale();
  
  // Выделяем границы
  edges.convolute([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ]);
  
  // Инвертируем для получения черных линий на белом фоне
  edges.invert();
  
  // Настраиваем порог для получения четких линий
  const threshold = 230 - (intensity * 50);
  edges.scan(0, 0, edges.bitmap.width, edges.bitmap.height, function(x, y, idx) {
    const val = edges.bitmap.data[idx];
    edges.bitmap.data[idx] = edges.bitmap.data[idx + 1] = edges.bitmap.data[idx + 2] = 
      val < threshold ? 0 : 255;
  });
  
  // Уменьшаем количество цветов (постеризация)
  applyPosterize(image, 8 - Math.round(intensity * 4));
  
  // Смешиваем с границами
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    // Если у нас есть линия (черный пиксель) на слое с краями, затемняем пиксель
    if (edges.bitmap.data[idx] < 128) {
      // Черная линия
      image.bitmap.data[idx] = image.bitmap.data[idx + 1] = image.bitmap.data[idx + 2] = 0;
    }
  });
}

/**
 * Применяет неоновый эффект
 */
async function applyNeonEffect(image: Jimp, intensity: number): Promise<void> {
  // Создаем копию для выделения краев
  const edges = image.clone().greyscale();
  
  // Выделяем границы
  edges.convolute([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ]);
  
  // Делаем фон темным
  image.brightness(-0.5);
  
  // Увеличиваем насыщенность
  image.color([
    { apply: 'saturate', params: [intensity * 100] }
  ]);
  
  // Создаем неоновое свечение, смешивая края с основным изображением
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const edgeValue = edges.bitmap.data[idx];
    
    // Если это край (яркий пиксель на карте краев)
    if (edgeValue > 100) {
      // Усиливаем яркость и насыщенность пикселя
      const r = Math.min(255, image.bitmap.data[idx] + (edgeValue * intensity));
      const g = Math.min(255, image.bitmap.data[idx + 1] + (edgeValue * intensity));
      const b = Math.min(255, image.bitmap.data[idx + 2] + (edgeValue * intensity));
      
      image.bitmap.data[idx] = r;
      image.bitmap.data[idx + 1] = g;
      image.bitmap.data[idx + 2] = b;
    }
  });
  
  // Добавляем небольшое размытие для эффекта свечения
  image.blur(intensity);
}

/**
 * Применяет винтажный эффект
 */
async function applyVintageEffect(image: Jimp, intensity: number): Promise<void> {
  // Снижаем насыщенность
  image.color([
    { apply: 'saturate', params: [-intensity * 30] }
  ]);
  
  // Добавляем сепию
  image.sepia();
  
  // Добавляем виньетку
  applyVignette(image, intensity * 0.7);
  
  // Добавляем немного шума для "зернистости"
  applyNoise(image, intensity * 0.1);
  
  // Добавляем легкое размытие
  image.blur(intensity * 0.5);
}

/**
 * Применяет эффект карикатуры
 */
async function applyCaricatureEffect(image: Jimp, intensity: number): Promise<void> {
  // Повышаем насыщенность и контраст
  image.color([
    { apply: 'saturate', params: [intensity * 50] }
  ]);
  image.contrast(intensity * 0.4);
  
  // Создаем слой с границами
  const edges = image.clone().greyscale();
  
  // Выделяем границы
  edges.convolute([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ]);
  
  // Инвертируем и настраиваем
  edges.invert();
  const threshold = 200 - (intensity * 40);
  edges.scan(0, 0, edges.bitmap.width, edges.bitmap.height, function(x, y, idx) {
    const val = edges.bitmap.data[idx];
    edges.bitmap.data[idx] = edges.bitmap.data[idx + 1] = edges.bitmap.data[idx + 2] = 
      val < threshold ? 0 : 255;
  });
  
  // Уменьшаем количество цветов
  applyPosterize(image, 6);
  
  // Смешиваем с границами
  image.composite(edges, 0, 0, {
    mode: Jimp.BLEND_MULTIPLY,
    opacitySource: 0.7,
    opacityDest: 1.0
  });
}

/**
 * Применяет эффект "нейронного искусства"
 */
async function applyNeuralArtEffect(image: Jimp, intensity: number): Promise<void> {
  // Повышаем насыщенность и контрастность
  image.color([
    { apply: 'saturate', params: [intensity * 70] }
  ]);
  image.contrast(intensity * 0.6);
  
  // Создаем сложную текстуру
  // Сначала выделяем края
  const edges = image.clone();
  edges.convolute([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ]);
  
  // Создаем цветовую текстуру с помощью постеризации
  applyPosterize(image, 5);
  
  // Смешиваем с текстурой краев
  image.composite(edges, 0, 0, {
    mode: Jimp.BLEND_OVERLAY,
    opacitySource: intensity * 0.5,
    opacityDest: 1.0
  });
  
  // Добавляем легкое размытие и снова повышаем контраст для "мечтательного" эффекта
  image.blur(intensity);
  image.contrast(intensity * 0.3);
}

/**
 * Вспомогательная функция для применения виньетки
 */
function applyVignette(image: Jimp, intensity: number): void {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const radius = Math.sqrt(w * w + h * h) / 2;
  const centerX = w / 2;
  const centerY = h / 2;
  
  image.scan(0, 0, w, h, function(x, y, idx) {
    // Расстояние от центра
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Нормализованное расстояние (0 - центр, 1 - край)
    const normalized = distance / radius;
    
    // Затемнение зависит от расстояния и интенсивности
    const factor = 1 - (normalized * normalized * intensity);
    
    // Применяем затемнение
    image.bitmap.data[idx] = Math.floor(image.bitmap.data[idx] * factor);
    image.bitmap.data[idx + 1] = Math.floor(image.bitmap.data[idx + 1] * factor);
    image.bitmap.data[idx + 2] = Math.floor(image.bitmap.data[idx + 2] * factor);
  });
}

/**
 * Вспомогательная функция для добавления шума
 */
function applyNoise(image: Jimp, amount: number): void {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  image.scan(0, 0, w, h, function(x, y, idx) {
    // Добавляем случайное значение к каждому цветовому каналу
    const noise = Math.round((Math.random() - 0.5) * amount * 255);
    
    image.bitmap.data[idx] = Math.max(0, Math.min(255, image.bitmap.data[idx] + noise));
    image.bitmap.data[idx + 1] = Math.max(0, Math.min(255, image.bitmap.data[idx + 1] + noise));
    image.bitmap.data[idx + 2] = Math.max(0, Math.min(255, image.bitmap.data[idx + 2] + noise));
  });
}

/**
 * Вспомогательная функция для постеризации (уменьшения количества цветов)
 */
function applyPosterize(image: Jimp, levels: number): void {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  image.scan(0, 0, w, h, function(x, y, idx) {
    // Получаем значения RGB
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    
    // Преобразуем каждый канал к ограниченному числу уровней
    image.bitmap.data[idx] = Math.round(r / 255 * (levels - 1)) / (levels - 1) * 255;
    image.bitmap.data[idx + 1] = Math.round(g / 255 * (levels - 1)) / (levels - 1) * 255;
    image.bitmap.data[idx + 2] = Math.round(b / 255 * (levels - 1)) / (levels - 1) * 255;
  });
}

/**
 * Получает список доступных стилей с описаниями
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