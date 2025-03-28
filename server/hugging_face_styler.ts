/**
 * Модуль для стилизации изображений с использованием Hugging Face API
 * 
 * Использует проверенные модели Hugging Face для качественной стилизации изображений
 * с доступом к их инференс API.
 */

import fetch from 'node-fetch';
import sharp from 'sharp';
import { AiStyle } from '@shared/schema';

// API ключ берем из переменных окружения
const API_KEY = process.env.HUGGINGFACE_API_KEY;

// Список поддерживаемых моделей
// Используем реально существующие модели из Hugging Face API
const MODELS = {
  // Картинка в стиле аниме
  ANIME: "cagliostrolab/animagine-xl-3.0",
  
  // Трансформация в карандашный набросок
  PENCIL_SKETCH: "timbrooks/instruct-pix2pix",
  
  // Контурный рисунок
  LINE_DRAWING: "timbrooks/instruct-pix2pix",
  
  // Карикатура/комикс
  CARTOON: "stabilityai/stable-diffusion-xl-base-1.0",
  
  // Трансформация в масляную живопись
  OIL_PAINTING: "runwayml/stable-diffusion-v1-5",

  // Трансформация в стиль Ван Гога
  VAN_GOGH: "stabilityai/stable-diffusion-2-1",
  
  // Акварельная стилизация
  WATERCOLOR: "stabilityai/stable-diffusion-2-1",
  
  // Пиксель-арт
  PIXEL_ART: "stabilityai/stable-diffusion-xl-base-1.0",
  
  // Неоновый эффект
  NEON: "stabilityai/stable-diffusion-xl-base-1.0",
  
  // Винтаж
  VINTAGE: "prompthero/openjourney-v4",
  
  // Нейронное искусство
  NEURAL_ART: "stabilityai/stable-diffusion-xl-base-1.0",
};

/**
 * Стилизация изображения с помощью Hugging Face моделей
 * @param imageBase64 Исходное изображение в формате base64
 * @param styleParams Параметры стиля
 * @returns Стилизованное изображение в формате base64
 */
export async function huggingFaceStyleImage(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log("Применение стиля через Hugging Face API:", styleParams.aiModel);
    
    // Проверка API ключа
    if (!API_KEY) {
      throw new Error("API ключ Hugging Face не найден в переменных окружения");
    }
    
    // Получение модели на основе выбранного стиля
    const modelId = getModelIdForStyle(styleParams.aiModel);
    if (!modelId) {
      throw new Error(`Подходящая модель не найдена для стиля ${styleParams.aiModel}`);
    }
    
    // Получение данных изображения без префикса
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Преобразование и оптимизация изображения перед отправкой
    const optimizedBuffer = await optimizeImageForAPI(buffer);
    
    // Получение инструкции для модели в зависимости от стиля
    const prompt = getPromptForStyle(styleParams.aiModel, styleParams.styleIntensity);
    
    // Отправка запроса к API Hugging Face
    const styledImageData = await sendToHuggingFaceAPI(modelId, optimizedBuffer, prompt);
    if (!styledImageData) {
      throw new Error("Не удалось получить стилизованное изображение от API");
    }
    
    // Получение информации о типе изображения из исходного
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    // Формирование base64 строки с префиксом для возврата
    return `data:${mime};base64,${styledImageData}`;
  } catch (error) {
    console.error("Ошибка при стилизации через Hugging Face:", error);
    throw error; // Пробрасываем ошибку дальше для обработки в вызывающем коде
  }
}

/**
 * Оптимизирует изображение перед отправкой в API
 * @param imageBuffer Буфер с изображением
 * @returns Оптимизированный буфер с изображением
 */
async function optimizeImageForAPI(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Используем sharp для предварительной обработки и оптимизации
    // Масштабируем до разумного размера и преобразуем в JPEG для меньшего размера
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    // Если изображение слишком большое, уменьшаем его
    if (metadata.width && metadata.width > 1024 || metadata.height && metadata.height > 1024) {
      return await image.resize({
        width: 1024,
        height: 1024,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    }
    
    // Иначе просто конвертируем в JPEG
    return await image.jpeg({ quality: 90 }).toBuffer();
  } catch (error) {
    console.error("Ошибка при оптимизации изображения:", error);
    return imageBuffer; // В случае ошибки возвращаем исходный буфер
  }
}

/**
 * Отправляет запрос к Hugging Face API
 * @param modelId ID модели Hugging Face
 * @param imageBuffer Буфер с изображением
 * @param prompt Текстовый запрос для модели (если поддерживается)
 * @returns Promise с результатом в формате base64 или null в случае ошибки
 */
async function sendToHuggingFaceAPI(modelId: string, imageBuffer: Buffer, prompt?: string): Promise<string | null> {
  const url = `https://api-inference.huggingface.co/models/${modelId}`;
  
  // Базовые заголовки для всех запросов
  const headers: any = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  
  try {
    let payload: any = {};
    
    // Для моделей Stable Diffusion (Text-to-Image) и других генеративных моделей
    if (modelId.includes('stable-diffusion') || modelId.includes('openjourney') || modelId.includes('animagine')) {
      // Эти модели требуют текстовый запрос (промпт) и опционально изображение для img2img
      payload = {
        inputs: prompt || "Transform this image to artistic style",
        parameters: {
          negative_prompt: "bad quality, blurry, distorted", // Что исключить из генерации
          guidance_scale: 7.5,  // Сила следования промпту
          num_inference_steps: 25  // Больше шагов = выше качество, но дольше время
        }
      };
    } 
    // Для модели instruct-pix2pix специфический формат
    else if (modelId.includes('instruct-pix2pix')) {
      payload = {
        inputs: {
          image: imageBuffer.toString('base64'),
          prompt: prompt || "Transform this image"
        }
      };
    } 
    // Для всех остальных моделей (default)
    else {
      // Базовый случай - просто отправляем изображение
      payload = {
        inputs: imageBuffer.toString('base64')
      };
      
      // Если также поддерживается текстовый запрос
      if (prompt) {
        payload.parameters = { 
          prompt: prompt,
          guidance_scale: 7.5
        };
      }
    }
    
    console.log(`Отправка запроса к Hugging Face для модели ${modelId}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    // Проверка на ошибки
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка API: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Получение результата
    const result = await response.arrayBuffer();
    // Преобразуем результат в base64
    return Buffer.from(result).toString('base64');
  } catch (error) {
    console.error("Ошибка при запросе к Hugging Face API:", error);
    return null;
  }
}

/**
 * Получает ID модели Hugging Face для конкретного стиля
 * @param styleName Название стиля
 * @returns ID модели или undefined, если подходящей модели нет
 */
function getModelIdForStyle(styleName: string): string | undefined {
  // Сопоставление стилей с моделями
  switch (styleName) {
    case "Аниме":
    case "Anime":
      return MODELS.ANIME;
      
    case "Набросок карандашом":
    case "Pencil Sketch":
      return MODELS.PENCIL_SKETCH;
      
    case "Контурный рисунок":
    case "Line Drawing":
      return MODELS.LINE_DRAWING;
      
    case "Комикс":
    case "Comic":
    case "Карикатура":
    case "Cartoon":
      return MODELS.CARTOON;
      
    case "Масляная живопись":
    case "Oil Painting":
      return MODELS.OIL_PAINTING;
      
    case "Акварель":
    case "Watercolor":
      return MODELS.WATERCOLOR;
      
    case "Пиксель-арт":
    case "Pixel Art":
      return MODELS.PIXEL_ART;
      
    case "Неон":
    case "Neon":
      return MODELS.NEON;
      
    case "Винтаж":
    case "Vintage":
      return MODELS.VINTAGE;
      
    case "Нейронное искусство":
    case "Neural Art":
      return MODELS.NEURAL_ART;
      
    case "Ван Гог":
    case "Van Gogh":
      return MODELS.VAN_GOGH;
      
    default:
      // Для неизвестных стилей используем нейронное искусство как наиболее универсальное
      console.log(`Неизвестный стиль: ${styleName}, используем Neural Art`);
      return MODELS.NEURAL_ART;
  }
}

/**
 * Получает текстовый запрос для модели в зависимости от стиля
 * @param styleName Название стиля
 * @param intensity Интенсивность эффекта (0-2)
 * @returns Текстовый запрос для модели
 */
function getPromptForStyle(styleName: string, intensity: number = 1.0): string {
  // Нормализуем интенсивность
  const normalizedIntensity = Math.max(0, Math.min(2, intensity));
  
  // Базовый множитель для подстройки интенсивности
  const intensityDesc = getIntensityDescription(normalizedIntensity);
  
  // Сопоставление стилей с промптами
  switch (styleName) {
    case "Аниме":
    case "Anime":
      return `Convert this image to ${intensityDesc} anime style, high quality, detailed`;
      
    case "Набросок карандашом":
    case "Pencil Sketch":
      return `Transform this image into a ${intensityDesc} detailed pencil sketch`;
      
    case "Контурный рисунок":
    case "Line Drawing":
      return `Make a ${intensityDesc} line drawing of this image, clean lines, white background`;
      
    case "Комикс":
    case "Comic":
      return `Convert this image to ${intensityDesc} comic book style, vibrant colors, bold outlines`;
      
    case "Карикатура":
    case "Cartoon":
      return `Transform this image into a ${intensityDesc} cartoon style, exaggerated features`;
      
    case "Масляная живопись":
    case "Oil Painting":
      return `Convert this image into a ${intensityDesc} oil painting, detailed brush strokes, rich colors`;
      
    case "Акварель":
    case "Watercolor":
      return `Transform this image into a ${intensityDesc} watercolor painting, soft edges, translucent colors`;
      
    case "Пиксель-арт":
    case "Pixel Art":
      return `Convert this image to ${intensityDesc} pixel art style, limited color palette`;
      
    case "Неон":
    case "Neon":
      return `Transform this image with ${intensityDesc} neon effects, vibrant glowing edges, dark background`;
      
    case "Винтаж":
    case "Vintage":
      return `Apply a ${intensityDesc} vintage filter to this image, sepia tones, slightly faded`;
      
    case "Нейронное искусство":
    case "Neural Art":
      return `Apply ${intensityDesc} neural style transfer to this image, abstract patterns, vibrant colors`;
      
    case "Ван Гог":
    case "Van Gogh":
      return `Transform this image in the style of Vincent van Gogh with ${intensityDesc} swirling patterns and bold brushstrokes`;
      
    default:
      return `Transform this image with ${intensityDesc} artistic style`;
  }
}

/**
 * Получает описание интенсивности для промпта
 * @param intensity Интенсивность эффекта (0-2)
 * @returns Описание интенсивности для промпта
 */
function getIntensityDescription(intensity: number): string {
  if (intensity < 0.5) {
    return "subtle";
  } else if (intensity < 1.0) {
    return "moderate";
  } else if (intensity < 1.5) {
    return "strong";
  } else {
    return "very intense";
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
    
    // Определение MIME-типа на основе расширения URL
    let mimeType = 'image/jpeg'; // По умолчанию JPEG
    if (url.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (url.endsWith('.gif')) {
      mimeType = 'image/gif';
    } else if (url.endsWith('.webp')) {
      mimeType = 'image/webp';
    }
    
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
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
      previewUrl: null,
      apiParams: {
        aiModel: "Масляная живопись",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле масляной живописи с выразительными мазками и насыщенными цветами"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в нежный акварельный стиль с прозрачными красками и мягкими переходами"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в детализированный карандашный набросок с тонкими линиями и тенями"
      }
    },
    {
      id: 4,
      name: "Тушь",
      description: "Преобразуйте изображение в стиль рисунка тушью с выразительными штрихами и тонкими линиями",
      previewUrl: null,
      apiParams: {
        aiModel: "Контурный рисунок",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиль рисунка тушью с выразительными штрихами и тонкими линиями"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в чистый контурный рисунок с четкими линиями"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиль пиксельной графики с ограниченной цветовой палитрой"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в аниме-стиль с характерными чертами японской анимации"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиль комикса с яркими цветами и четкими контурами"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в неоновый стиль с яркими светящимися краями"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в винтажный стиль с эффектом старой фотографии"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиль карикатуры с преувеличенными чертами"
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
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиль нейронного искусства с абстрактными формами и текстурами"
      }
    },
    {
      id: 13,
      name: "Ван Гог",
      description: "Преобразуйте изображение в стиле картин Винсента Ван Гога с характерными вихревыми мазками",
      previewUrl: null,
      apiParams: {
        aiModel: "Ван Гог",
        styleIntensity: 1.0,
        transformType: "image-to-image",
        styleReference: "Преобразуйте изображение в стиле картин Винсента Ван Гога с характерными вихревыми мазками"
      }
    }
  ];
}