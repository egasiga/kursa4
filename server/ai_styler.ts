/**
 * Модуль для стилизации изображений с использованием OpenAI API
 */
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { AiStyle } from '../shared/schema';

// Инициализация клиента OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Настройки для преобразования изображений
const IMAGE_SIZE = 1024; // Размер выходного изображения

/**
 * Стилизация изображения с помощью OpenAI DALL-E модели
 * @param imageBase64 Исходное изображение в формате base64
 * @param styleParams Параметры стиля
 * @returns Стилизованное изображение в формате base64
 */
export async function aiStyleImage(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log(`Применение AI стиля: ${styleParams.aiModel}`);
    
    // Убираем префикс data:image/... из строки base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Временный файл для хранения изображения
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const inputImagePath = path.join(tempDir, `input_${Date.now()}.png`);
    const writeFile = promisify(fs.writeFile);
    await writeFile(inputImagePath, base64Data, 'base64');
    
    // Формируем промпт для нужного стиля
    const styleDescription = getStyleDescription(styleParams.aiModel);
    const intensity = styleParams.styleIntensity || 1.0;
    
    // Настраиваем промпт в зависимости от интенсивности
    const intensityDesc = getIntensityDescription(intensity);
    const prompt = `${intensityDesc} ${styleDescription}. Preserve the original composition and main elements.`;
    
    // Вызываем OpenAI API для преобразования изображения
    const response = await openai.images.edit({
      model: "dall-e-2", // Используем DALL-E 2 для редактирования изображений
      image: fs.createReadStream(inputImagePath),
      prompt: prompt,
      n: 1,
      size: `${IMAGE_SIZE}x${IMAGE_SIZE}`,
      response_format: "b64_json",
    });
    
    // Очистка временных файлов
    fs.unlinkSync(inputImagePath);
    
    // Получаем результат в формате base64
    if (response.data && response.data.length > 0 && response.data[0].b64_json) {
      return `data:image/png;base64,${response.data[0].b64_json}`;
    } else {
      throw new Error("Нет данных в ответе от OpenAI");
    }
  } catch (error) {
    console.error('Ошибка при применении AI стиля:', error);
    // В случае ошибки возвращаем исходное изображение
    return imageBase64;
  }
}

/**
 * Получает описание стиля для использования в промпте
 * @param styleName Название стиля
 * @returns Описание стиля для промпта
 */
function getStyleDescription(styleName: string): string {
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