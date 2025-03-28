/**
 * Модуль для стилизации изображений с использованием Hugging Face API
 */
import fetch from 'node-fetch';
import sharp from 'sharp';
import { AiStyle } from '../shared/schema';

// API URL для Hugging Face Inference API
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Таблица соответствия стилей и моделей на Hugging Face
const styleToModelMap: Record<string, string> = {
  "Масляная живопись": "CompVis/stable-diffusion-v1-4",
  "Акварель": "CompVis/stable-diffusion-v1-4",
  "Набросок карандашом": "Salesforce/blip-image-captioning-large",
  "Тушь": "CompVis/stable-diffusion-v1-4",
  "Контурный рисунок": "CompVis/stable-diffusion-v1-4",
  "Пиксель-арт": "CompVis/stable-diffusion-v1-4",
  "Аниме": "Linaqruf/anything-v3.0",
  "Комикс": "CompVis/stable-diffusion-v1-4",
  "Неон": "CompVis/stable-diffusion-v1-4",
  "Винтаж": "CompVis/stable-diffusion-v1-4",
  "Карикатура": "CompVis/stable-diffusion-v1-4",
  "Нейронное искусство": "runwayml/stable-diffusion-v1-5"
};

/**
 * Стилизация изображения с помощью Hugging Face моделей
 * @param imageBase64 Исходное изображение в формате base64
 * @param styleParams Параметры стиля
 * @returns Стилизованное изображение в формате base64
 */
export async function huggingFaceStyleImage(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log(`Применение стиля Hugging Face: ${styleParams.aiModel}`);
    
    // Убираем префикс data:image/... из строки base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Получаем имя модели на основе выбранного стиля
    const modelName = styleToModelMap[styleParams.aiModel] || "CompVis/stable-diffusion-v1-4";
    
    // Формируем промпт для нужного стиля
    const styleDescription = getStylePrompt(styleParams.aiModel);
    const intensity = styleParams.styleIntensity || 1.0;
    const intensityDesc = getIntensityDescription(intensity);
    const prompt = `${intensityDesc} ${styleDescription}. Preserve the original composition and main elements.`;
    
    // Пытаемся получить API ключ для Hugging Face из переменных среды
    const apiKey = process.env.HUGGINGFACE_API_KEY || '';
    
    try {
      // Если есть API ключ, используем Hugging Face API
      if (apiKey) {
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Отправляем запрос к Hugging Face API
        const response = await fetch(`${HF_API_URL}/${encodeURIComponent(modelName)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: {
              image: imageBase64,
              prompt: prompt
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`Hugging Face API error: ${response.statusText}`);
        }
        
        // Получаем результат в виде изображения
        const resultBuffer = await response.buffer();
        // Конвертируем в base64
        const resultBase64 = resultBuffer.toString('base64');
        
        return `data:image/jpeg;base64,${resultBase64}`;
      } else {
        // Если нет ключа API, применяем локальные фильтры
        console.log("API ключ Hugging Face не найден, применяем локальные фильтры");
        return applyLocalImageFilters(base64Data, styleParams);
      }
    } catch (apiError) {
      console.error('Ошибка Hugging Face API:', apiError);
      // В случае ошибки API также применяем локальные фильтры
      return applyLocalImageFilters(base64Data, styleParams);
    }
  } catch (error) {
    console.error('Ошибка при применении стиля:', error);
    // В случае ошибки возвращаем исходное изображение
    return imageBase64;
  }
}

/**
 * Применяет локальные фильтры изображения с использованием sharp
 * @param base64Data Данные изображения в формате base64 (без префикса)
 * @param styleParams Параметры стиля
 * @returns Обработанное изображение в формате base64
 */
async function applyLocalImageFilters(base64Data: string, styleParams: any): Promise<string> {
  try {
    // Преобразуем строку base64 в буфер
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Создаем объект sharp для работы с изображением
    let sharpImage = sharp(imageBuffer);
    
    // Получим информацию об изображении для сохранения пропорций
    const metadata = await sharpImage.metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    if (!width || !height) {
      throw new Error("Не удалось получить размеры изображения");
    }
    
    // Применяем эффекты в зависимости от выбранного стиля
    if (styleParams.aiModel) {
      console.log(`Применение локального стиля: ${styleParams.aiModel}`);
      
      // Интенсивность эффекта
      const intensity = styleParams.styleIntensity || 1.0;
      
      switch (styleParams.aiModel) {
        case "Нейронное искусство":
        case "Neural Art":
          // Имитация нейронной стилизации: высокая контрастность, насыщенные цвета, четкость
          sharpImage = sharpImage
            .convolve({
              width: 3,
              height: 3,
              kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
            })
            .modulate({
              brightness: 1.2, 
              saturation: 1.5 * intensity
            });
          break;
        
        case "Масляная живопись":
        case "Oil Painting":
          // Имитация масляной живописи: размытие, повышенная насыщенность, контрастность
          sharpImage = sharpImage
            .median(Math.ceil(3 * intensity))
            .modulate({
              brightness: 1.0,
              saturation: 1.2 * intensity
            })
            .convolve({
              width: 3,
              height: 3,
              kernel: [1, 1, 1, 1, 1, 1, 1, 1, 1],
              scale: 9
            });
          break;
        
        case "Акварель":
        case "Watercolor":
          // Имитация акварели: мягкое размытие, осветление, снижение контраста
          sharpImage = sharpImage
            .blur(1.5 * intensity)
            .modulate({
              brightness: 1.1,
              saturation: 0.9 + (0.2 * intensity)
            });
          break;
        
        case "Набросок карандашом":
        case "Pencil Sketch":
          // Улучшенный алгоритм карандашного наброска
          {
            // Создаем копию для инвертированного размытого изображения
            let invertedBlurred = await sharpImage
              .clone()
              .grayscale()
              .negate()
              .blur(0.5)
              .toBuffer();
            
            // Подготавливаем основное изображение
            sharpImage = sharpImage
              .grayscale()
              // Слегка повышаем яркость
              .modulate({ brightness: 1.1 });

            // Создаем "делительное смешивание" - имитация карандашного эффекта
            sharpImage = sharp(await sharpImage.toBuffer())
              // Накладываем инвертированное размытое изображение в режиме делителя
              // Это создает эффект деления яркостей пикселей
              .composite([
                { 
                  input: invertedBlurred,
                  blend: 'multiply'  // Используем multiply вместо divide
                }
              ])
              // Финальные корректировки
              .modulate({ brightness: 1.05 })
              .linear(1.1, 0);  // Повышаем контраст
          }
          break;
        
        case "Тушь":
        case "Ink Drawing":
          // Имитация рисунка тушью: смягченная версия для предотвращения черных изображений
          sharpImage = sharpImage
            .grayscale()
            // Вместо жесткого порога используем адаптивное усиление контуров
            .convolve({
              width: 3,
              height: 3,
              kernel: [-1, -1, -1, -1, 12, -1, -1, -1, -1],
              scale: 4 // Делим на большее значение для смягчения эффекта
            })
            // Корректируем яркость для предотвращения черного изображения
            .modulate({ brightness: 1.5 });
          break;
        
        case "Контурный рисунок":
        case "Line Drawing":
          // Имитация контурного рисунка: выделение краев (улучшенная версия)
          sharpImage = sharpImage
            .grayscale()
            // Подготовка изображения - легкое размытие для удаления шума
            .blur(0.5)
            // Улучшенный фильтр выделения краев
            .convolve({
              width: 3,
              height: 3,
              kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
              scale: 1.5 // Смягчаем эффект
            })
            // Нормализация с ограничением для предотвращения экстремальных результатов
            .linear(1.0, 20) // Добавляем смещение, чтобы избежать полностью черного изображения
            .normalize()
            .negate()
            // Финальная коррекция для видимости линий
            .modulate({ brightness: 1.05 });
          break;
        
        case "Пиксель-арт":
        case "Pixel Art":
          // Имитация пиксель-арта: уменьшение размера и увеличение с эффектом пикселизации
          const pixelSize = Math.max(2, Math.min(10, Math.floor(5 * intensity)));
          const smallWidth = Math.floor(width / pixelSize);
          const smallHeight = Math.floor(height / pixelSize);
          
          sharpImage = sharpImage
            .resize(smallWidth, smallHeight, { kernel: 'nearest' })
            .resize(width, height, { kernel: 'nearest' })
            .modulate({ saturation: 1.2 * intensity });
          break;
        
        case "Аниме":
        case "Anime":
          // Имитация аниме-стиля: смягченная версия
          sharpImage = sharpImage
            // Умеренная насыщенность
            .modulate({ saturation: 1.2 * intensity, brightness: 1.05 })
            // Смягченная конволюция с повышенным масштабом
            .convolve({
              width: 3,
              height: 3,
              kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
              scale: 4 // Увеличиваем масштаб для ослабления эффекта
            })
            // Добавляем легкое размытие для смягчения линий
            .blur(0.2);
          break;
        
        case "Комикс":
        case "Comic":
          // Имитация комикса: более мягкий и стабильный вариант
          sharpImage = sharpImage
            .modulate({ saturation: 1.2 * intensity })
            // Смягчаем фильтр Лапласа, добавляя scale
            .convolve({
              width: 3,
              height: 3,
              kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
              scale: 3 // Увеличиваем масштаб для ослабления эффекта
            })
            // Добавляем легкое размытие для смягчения линий
            .blur(0.3);
          break;
        
        case "Неон":
        case "Neon":
          // Имитация неонового свечения
          sharpImage = sharpImage
            .modulate({ brightness: 0.8, saturation: 1.5 * intensity })
            .convolve({
              width: 3,
              height: 3,
              kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
              scale: 1
            })
            .blur(0.5);
          break;
        
        case "Винтаж":
        case "Vintage":
          // Имитация винтажного стиля: сепия, виньетка
          sharpImage = sharpImage
            .modulate({ saturation: 0.6, brightness: 0.9 })
            .tint({ r: 240, g: 200, b: 160 });
          break;
        
        case "Карикатура":
        case "Caricature":
          // Имитация карикатуры: исправленная версия для предотвращения черных изображений
          sharpImage = sharpImage
            .modulate({ saturation: 1.3 * intensity })
            .convolve({
              width: 3,
              height: 3,
              kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
              scale: 2 // Смягчаем эффект
            })
            // Вместо жесткого порога используем контраст
            .linear(1.3, 0); // Усиливаем контраст без риска получить черное изображение
          break;
          
        default:
          // По умолчанию просто увеличиваем контрастность и насыщенность
          sharpImage = sharpImage
            .modulate({ saturation: 1.2 })
            .linear(1.1, 0); // contrast
          break;
      }
    }
    
    // Получаем обработанное изображение в формате base64
    const processedImageBuffer = await sharpImage.toBuffer();
    const processedImageBase64 = processedImageBuffer.toString('base64');
    
    // Вернем данные с правильным префиксом
    // Определяем формат изображения для префикса
    let mimePrefix = 'data:image/jpeg;base64,';
    if (metadata.format) {
      mimePrefix = `data:image/${metadata.format};base64,`;
    }
    
    return `${mimePrefix}${processedImageBase64}`;
  } catch (error) {
    console.error('Ошибка при применении локальных фильтров:', error);
    // В случае ошибки возвращаем исходное изображение с префиксом
    return `data:image/jpeg;base64,${base64Data}`;
  }
}

/**
 * Получает описание стиля для использования в промпте
 * @param styleName Название стиля
 * @returns Описание стиля для промпта
 */
function getStylePrompt(styleName: string): string {
  const styleDescriptions: { [key: string]: string } = {
    "Масляная живопись": "Transform this image into oil painting style with visible brush strokes and rich texture",
    "Акварель": "Transform this image into watercolor painting style with soft edges and transparent washes",
    "Набросок карандашом": "Transform this image into a detailed pencil sketch with fine lines and shading",
    "Тушь": "Transform this image into an ink drawing style with bold strokes and fine lines",
    "Контурный рисунок": "Transform this image into a clean line drawing with precise outlines",
    "Пиксель-арт": "Transform this image into pixel art style with limited colors and visible pixels",
    "Аниме": "Transform this image into anime style with characteristic features and simplified details",
    "Комикс": "Transform this image into comic book style with bold outlines and flat colors",
    "Неон": "Transform this image into neon style with glowing edges and vibrant colors against dark background",
    "Винтаж": "Transform this image into vintage style with faded colors and retro look",
    "Карикатура": "Transform this image into caricature style with exaggerated features",
    "Нейронное искусство": "Transform this image into neural art style with dream-like patterns and textures",
  };
  
  return styleDescriptions[styleName] || "Transform this image into artistic style";
}

/**
 * Получает описание интенсивности для промпта
 * @param intensity Интенсивность эффекта (0-2)
 * @returns Описание интенсивности для промпта
 */
function getIntensityDescription(intensity: number): string {
  if (intensity <= 0.5) {
    return "Apply a subtle";
  } else if (intensity <= 1.0) {
    return "Apply a moderate";
  } else if (intensity <= 1.5) {
    return "Apply a strong";
  } else {
    return "Apply a very dramatic";
  }
}

/**
 * Преобразует URL изображения в base64
 * @param url URL изображения
 * @returns Промис с данными в формате base64
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Ошибка при преобразовании URL в base64:', error);
    throw error;
  }
}

/**
 * Получает список доступных AI стилей с описаниями
 * @returns Список AI стилей
 */
export function getAvailableAiStyles(): AiStyle[] {
  return [
    {
      id: 1,
      name: "Масляная живопись",
      description: "Преобразуйте изображение в стиле масляной живописи с выразительными мазками и насыщенными цветами",
      previewUrl: "https://example.com/previews/oil_painting.jpg",
      apiParams: {
        aiModel: "Масляная живопись",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле масляной живописи"
      }
    },
    {
      id: 2,
      name: "Акварель",
      description: "Преобразуйте изображение в нежный акварельный стиль с прозрачными красками и мягкими переходами",
      previewUrl: "https://example.com/previews/watercolor.jpg",
      apiParams: {
        aiModel: "Акварель",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле акварели"
      }
    },
    {
      id: 3,
      name: "Набросок карандашом",
      description: "Преобразуйте изображение в детализированный карандашный набросок с тонкими линиями и тенями",
      previewUrl: "https://example.com/previews/pencil_sketch.jpg",
      apiParams: {
        aiModel: "Набросок карандашом",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле карандашного наброска"
      }
    },
    {
      id: 4,
      name: "Тушь",
      description: "Преобразуйте изображение в стиль рисунка тушью с выразительными штрихами и тонкими линиями",
      previewUrl: "https://example.com/previews/ink.jpg",
      apiParams: {
        aiModel: "Тушь",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле рисунка тушью"
      }
    },
    {
      id: 5,
      name: "Контурный рисунок",
      description: "Преобразуйте изображение в чистый контурный рисунок с четкими линиями",
      previewUrl: "https://example.com/previews/line_drawing.jpg",
      apiParams: {
        aiModel: "Контурный рисунок",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле контурного рисунка"
      }
    },
    {
      id: 6,
      name: "Пиксель-арт",
      description: "Преобразуйте изображение в стиле пиксельной графики с ограниченной палитрой и видимыми пикселями",
      previewUrl: "https://example.com/previews/pixel_art.jpg",
      apiParams: {
        aiModel: "Пиксель-арт",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле пиксельной графики"
      }
    },
    {
      id: 7,
      name: "Аниме",
      description: "Преобразуйте изображение в стиле аниме с характерными чертами и упрощенными деталями",
      previewUrl: "https://example.com/previews/anime.jpg",
      apiParams: {
        aiModel: "Аниме",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле аниме"
      }
    },
    {
      id: 8,
      name: "Комикс",
      description: "Преобразуйте изображение в стиле комикса с выразительными контурами и плоскими цветами",
      previewUrl: "https://example.com/previews/comic.jpg",
      apiParams: {
        aiModel: "Комикс",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле комикса"
      }
    },
    {
      id: 9,
      name: "Неон",
      description: "Преобразуйте изображение в неоновый стиль с яркими светящимися краями на темном фоне",
      previewUrl: "https://example.com/previews/neon.jpg",
      apiParams: {
        aiModel: "Неон",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в неоновом стиле"
      }
    },
    {
      id: 10,
      name: "Винтаж",
      description: "Преобразуйте изображение в винтажный стиль с выцветшими цветами и ретро-эффектом",
      previewUrl: "https://example.com/previews/vintage.jpg",
      apiParams: {
        aiModel: "Винтаж",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в винтажном стиле"
      }
    }
  ];
}