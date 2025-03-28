/**
 * Модуль для стилизации изображений с использованием библиотеки WISE через Python
 * 
 * WISE (WIS Effects) - это библиотека для создания художественных эффектов в стиле
 * различных художественных направлений (карандашный набросок, масляная живопись, пиксель-арт)
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { AiStyle } from '@shared/schema';

// Временная директория для хранения файлов
const TEMP_DIR = './temp';

/**
 * Применяет стилизацию к изображению с помощью WISE
 * @param imageBase64 Исходное изображение в формате base64 (с префиксом data:image)
 * @param styleParams Параметры стиля
 * @returns Стилизованное изображение в формате base64
 */
export async function wiseStyleImage(imageBase64: string, styleParams: any): Promise<string> {
  console.log("Применяем WISE стиль к изображению:", styleParams.styleName);
  
  try {
    // Создаем временную директорию, если она не существует
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    // Генерируем уникальные имена файлов
    const timestamp = Date.now();
    const contentImagePath = join(TEMP_DIR, `content_${timestamp}.jpg`);
    const outputImagePath = join(TEMP_DIR, `output_${timestamp}.jpg`);
    
    // Подготавливаем base64 - удаляем префикс, если есть
    let base64Data = imageBase64;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    
    // Сохраняем исходное изображение во временный файл
    const imageBuffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(contentImagePath, imageBuffer);
    
    // Определяем стиль и интенсивность
    const styleName = styleParams.styleName || 'Набросок карандашом';
    const intensity = styleParams.styleIntensity || 1.0;
    
    // Конвертируем название стиля в англоязычный вариант для Python скрипта
    let styleNameEn = getStyleNameForWise(styleName);
    
    // Запускаем Python-скрипт для применения стиля
    console.log(`Вызываем WISE с параметрами: style=${styleNameEn}, intensity=${intensity}`);
    const result = execSync(
      `python3 server/python/wise_styler.py "${contentImagePath}" "${outputImagePath}" "${styleNameEn}" ${intensity}`, 
      { encoding: 'utf8' }
    );
    
    console.log("Результат выполнения WISE:", result);
    
    // Читаем результат и конвертируем обратно в base64
    const outputBuffer = await fs.readFile(outputImagePath);
    const outputBase64 = outputBuffer.toString('base64');
    
    // Определяем MIME-тип для корректного отображения в браузере
    const mimeType = 'image/jpeg';
    const outputBase64WithPrefix = `data:${mimeType};base64,${outputBase64}`;
    
    // Удаляем временные файлы
    try {
      await fs.unlink(contentImagePath);
      await fs.unlink(outputImagePath);
    } catch (cleanupError) {
      console.warn("Не удалось удалить временные файлы:", cleanupError);
    }
    
    return outputBase64WithPrefix;
  } catch (error) {
    console.error("Ошибка при применении WISE стиля:", error);
    // Возвращаем исходное изображение в случае ошибки
    return imageBase64;
  }
}

/**
 * Конвертирует название стиля в формат для WISE
 * @param styleName Название стиля на русском или английском
 * @returns Название стиля для использования в Python скрипте
 */
function getStyleNameForWise(styleName: string): string {
  // Маппинг названий стилей
  const styleMap: Record<string, string> = {
    'Набросок карандашом': 'pencil_sketch',
    'Pencil Sketch': 'pencil_sketch',
    'Пиксель-арт': 'pixel_art',
    'Pixel Art': 'pixel_art',
    'Масляная живопись': 'oil_painting',
    'Oil Painting': 'oil_painting',
    'Ван Гог': 'van_gogh',
    'Van Gogh': 'van_gogh',
    'Аниме': 'anime',
    'Anime': 'anime'
  };
  
  return styleMap[styleName] || 'pencil_sketch'; // По умолчанию карандашный набросок
}

/**
 * Получает список доступных WISE стилей с описаниями
 * @returns Список стилей
 */
export function getAvailableWiseStyles(): AiStyle[] {
  return [
    {
      id: 1,
      name: 'Набросок карандашом',
      description: 'Превратите фотографию в реалистичный карандашный набросок с детализированными линиями и тенями',
      previewUrl: '/server/styles/pencil_sketch.jpg',
      apiParams: {
        styleName: 'Набросок карандашом',
        styleIntensity: 1.0,
        transformType: 'wise'
      },
      source: 'wise'
    },
    {
      id: 2,
      name: 'Пиксель-арт',
      description: 'Стилизация изображения под пиксельную графику классических видеоигр',
      previewUrl: '/server/styles/pixel_art.jpg',
      apiParams: {
        styleName: 'Пиксель-арт',
        styleIntensity: 1.0,
        transformType: 'wise'
      },
      source: 'wise'
    },
    {
      id: 3,
      name: 'Масляная живопись',
      description: 'Преобразование фотографии в стиль масляной живописи с выраженными мазками кисти',
      previewUrl: '/server/styles/oil_painting.jpg',
      apiParams: {
        styleName: 'Масляная живопись',
        styleIntensity: 1.0,
        transformType: 'wise'
      },
      source: 'wise'
    },
    {
      id: 4,
      name: 'Ван Гог',
      description: 'Преобразование изображения в стиле знаменитых работ Винсента Ван Гога',
      previewUrl: '/server/styles/van_gogh.jpg',
      apiParams: {
        styleName: 'Ван Гог',
        styleIntensity: 1.0,
        transformType: 'wise'
      },
      source: 'wise'
    },
    {
      id: 5,
      name: 'Аниме',
      description: 'Стилизация фотографии в японском аниме-стиле',
      previewUrl: '/server/styles/anime.jpg',
      apiParams: {
        styleName: 'Аниме',
        styleIntensity: 1.0,
        transformType: 'wise'
      },
      source: 'wise'
    }
  ];
}