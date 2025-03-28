import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMemeTemplateSchema, insertSavedMemeSchema, insertCollageSchema, insertAiStyleSchema } from "@shared/schema";
import fetch from "node-fetch";

// Функция для применения AI-стилей к изображениям
// В этой реализации мы используем OpenAI API через Python-скрипт
// для настоящей AI-стилизации изображений
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';

// Преобразуем exec в промис для удобства использования
const execPromise = promisify(exec);

/**
 * Применяет художественный стиль к изображению с использованием Hugging Face или локальных фильтров
 * @param imageBase64 - изображение в формате base64 с префиксом data:image/...;base64,
 * @param styleParams - параметры стиля
 * @returns обработанное изображение в формате base64
 */
async function applyAiStyle(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log("Применение художественного стиля:", styleParams);
    
    // Флаг для принудительного использования локальных фильтров
    const useLocalFiltersOnly = styleParams.useLocalFiltersOnly === true;
    
    // Проверяем доступность API ключей
    const huggingFaceEnabled = !useLocalFiltersOnly && process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.length > 0;
    const openaiEnabled = !useLocalFiltersOnly && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
    
    // Приоритезируем безопасную последовательность вызовов
    if (useLocalFiltersOnly || (!huggingFaceEnabled && !openaiEnabled)) {
      // Используем локальные фильтры без API
      try {
        // Сначала пробуем Sharp фильтры (новая реализация)
        const { applyImageStyles } = await import('./image_filters');
        console.log("Используем бесплатные фильтры Sharp для стилизации");
        return await applyImageStyles(imageBase64, styleParams);
      } catch (sharpError) {
        console.error("Ошибка при применении Sharp фильтров:", sharpError);
        
        try {
          // Запасной вариант - используем Jimp
          console.log("Используем бесплатные фильтры Jimp для стилизации");
          const { jimpStyleImage } = await import('./jimp_styler');
          return await jimpStyleImage(imageBase64, styleParams);
        } catch (jimpError) {
          console.error("Ошибка при применении Jimp фильтров:", jimpError);
          
          // Последняя попытка - применяем базовые фильтры Sharp
          console.log("Используем базовые фильтры Sharp");
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          return await applyArtisticFilters(imageBase64, base64Data, styleParams);
        }
      }
    } else {
      // Пробуем API сервисы
      if (huggingFaceEnabled) {
        try {
          console.log("Пробуем использовать Hugging Face API");
          const { huggingFaceStyleImage } = await import('./hugging_face_styler');
          return await huggingFaceStyleImage(imageBase64, styleParams);
        } catch (hfError) {
          console.error('Ошибка Hugging Face API:', hfError);
        }
      }
      
      if (openaiEnabled) {
        try {
          console.log("Пробуем использовать OpenAI API");
          const { aiStyleImage } = await import('./ai_styler');
          return await aiStyleImage(imageBase64, styleParams);
        } catch (openaiError) {
          console.error('Ошибка OpenAI API:', openaiError);
        }
      }
      
      // Если ни один API не сработал, возвращаемся к локальным фильтрам
      try {
        const { applyImageStyles } = await import('./image_filters');
        console.log("API не сработали, используем Sharp фильтры");
        return await applyImageStyles(imageBase64, styleParams);
      } catch (finalError) {
        console.error('Ошибка при попытке использовать локальные фильтры:', finalError);
        
        // В самом крайнем случае пробуем Jimp
        try {
          const { jimpStyleImage } = await import('./jimp_styler');
          return await jimpStyleImage(imageBase64, styleParams);
        } catch (ultimateError) {
          console.error('Все методы стилизации не сработали, возвращаем исходное изображение:', ultimateError);
          return imageBase64;
        }
      }
    }
  } catch (error) {
    console.error('Критическая ошибка при применении художественного стиля:', error);
    console.error((error as Error).stack);
    // В случае ошибки возвращаем исходное изображение
    return imageBase64;
  }
}

/**
 * Применяет художественные фильтры к изображению с помощью Sharp
 * @param imageBase64 изображение в формате base64 с префиксом
 * @param base64Data изображение в формате base64 без префикса
 * @param styleParams параметры стиля
 * @returns обработанное изображение в формате base64
 */
async function applyArtisticFilters(imageBase64: string, base64Data: string, styleParams: any): Promise<string> {
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
      console.log(`Применение стиля: ${styleParams.aiModel}`);
      
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
            })
            .sharpen(10 * intensity);
          break;
          
        case "Аниме":
        case "Anime":
          // Аниме стиль: яркие цвета, сглаженные края
          sharpImage = sharpImage
            .modulate({
              brightness: 1.1, 
              saturation: 1.4 * intensity, 
              hue: 5
            })
            .median(3)  // Сглаживание для эффекта "рисованности"
            .sharpen(5 * intensity);
          break;
          
        case "Поп-арт":
        case "Pop Art":
          // Яркие, контрастные цвета в стиле поп-арт
          sharpImage = sharpImage
            .modulate({
              brightness: 1.2, 
              saturation: 2.0 * intensity, 
              hue: 90 * intensity
            })
            .threshold(150);
          break;
          
        case "Импрессионизм":
        case "Impressionism":
          // Мягкие края, пастельные тона
          sharpImage = sharpImage
            .modulate({
              brightness: 1.1, 
              saturation: 1.3 * intensity
            })
            .blur(2 * intensity)
            .sharpen(3 * intensity);
          break;
          
        case "Масляная живопись":
        case "Oil Painting":
          // Профессиональный эффект масляной живописи по примеру
          {
            // Используем подход на основе медианного фильтра и модуляции цветов
            // Шаг 1: Применение базового эффекта масляной живописи
            sharpImage = sharpImage
              // Делаем более глубокие и насыщенные цвета
              .modulate({
                saturation: 1.4 * intensity,
                brightness: 1.1
              })
              // Уменьшаем детализацию с помощью медианного фильтра
              // для создания эффекта смешивания красок
              .median(Math.max(3, Math.round(7 * intensity)))
              // Повышаем контраст для лучшего выделения цветовых областей
              .linear(
                1.2,   // Усиление контраста
                -10    // Слегка затемняем для более насыщенных цветов
              );
            
            // Шаг 2: Добавляем текстуру мазков
            sharpImage = sharpImage
              // Сначала слегка размываем для создания более плавных переходов
              .blur(0.8)
              // Затем добавляем резкость, имитирующую мазки кисти
              .sharpen(Math.round(10 * intensity))
              // Применяем матрицу свертки для усиления краев и создания эффекта мазков
              .convolve({
                width: 3,
                height: 3,
                kernel: [
                  -0.15, -0.15, -0.15,
                  -0.15,  2.4,  -0.15,
                  -0.15, -0.15, -0.15
                ],
                scale: 1.0
              });
            
            // Шаг 3: Финальная корректировка цветов
            sharpImage = sharpImage
              // Регулируем кривую тонов для создания эффекта масляной краски
              .gamma(1.1)
              // Повышаем насыщенность для финального штриха
              .modulate({
                saturation: 1.15,
                hue: 2  // Легкий сдвиг цвета для более теплого тона
              })
              // Добавляем финальную резкость для подчеркивания деталей
              .sharpen(Math.min(5, Math.round(7 * intensity)));
          }
          break;
          
        case "Пиксель-арт":
        case "Pixel Art":
          // Улучшенный эффект пиксельной графики для более реалистичного ретро-вида
          {
            // Определяем размер пикселей в зависимости от интенсивности
            // Минимум 2, максимум рассчитывается по интенсивности
            const pixelSize = Math.max(2, Math.floor(12 * intensity));
            
            // Шаг 1: Сначала улучшаем цвета и контраст, чтобы пиксели выглядели ярче
            sharpImage = sharpImage
              // Усиливаем насыщенность для более выразительных цветов
              .modulate({
                saturation: 1.3,
                brightness: 1.05
              })
              // Повышаем контраст для более четких переходов между цветовыми блоками
              .linear(
                1.1,  // Множитель контраста
                -5    // Небольшое снижение яркости
              );
              
            // Шаг 2: Применяем пикселизацию - уменьшаем разрешение и увеличиваем обратно
            // Используем kernel: 'nearest' для резких краев между пикселями
            sharpImage = sharpImage
              // Уменьшаем размер, используя целочисленное деление для равномерных пикселей
              .resize(Math.floor(width / pixelSize), Math.floor(height / pixelSize), {
                kernel: 'nearest'  // Обеспечивает четкую пикселизацию
              })
              // Масштабируем обратно до исходного размера без сглаживания
              .resize(width, height, {
                kernel: 'nearest'  // Сохраняет четкие границы пикселей
              });
              
            // Шаг 3: Добавляем легкую "сетку" между пикселями для более выраженного эффекта
            // Этот эффект достигается через усиление резкости на краях пикселей
            if (intensity > 0.5) {
              sharpImage = sharpImage
                .sharpen(Math.min(1.0, intensity * 0.5));  // Легкое повышение резкости для выделения пикселей
            }
          }
          break;
          
        case "Карикатура":
        case "Cartoon":
          // Карикатурный стиль с повышенной контрастностью и выделенными краями
          sharpImage = sharpImage
            .modulate({
              brightness: 1.1, 
              saturation: 1.5 * intensity
            })
            .sharpen(15 * intensity)
            .median(3);
          break;
          
        case "Комикс":
        case "Comic":
          // Комикс стиль - оконтуривание и яркие цвета
          sharpImage = sharpImage
            .sharpen(20 * intensity)
            .modulate({
              brightness: 1.2, 
              saturation: 1.5 * intensity
            })
            .threshold(110);
          break;
          
        case "Неон":
        case "Neon":
          // Неоновый эффект с яркими контрастными цветами
          sharpImage = sharpImage
            .modulate({
              brightness: 1.2, 
              saturation: 1.7 * intensity, 
              hue: 240 * intensity  // Голубой/пурпурный оттенок
            })
            .sharpen(15 * intensity)
            .negate({ alpha: false })  // Инвертируем цвета для неонового эффекта
            .normalize();  // Нормализуем результат
          break;
          
        case "Винтаж":
        case "Vintage":
          // Эффект старой фотографии
          sharpImage = sharpImage
            .modulate({
              brightness: 0.9,
              saturation: 0.7 * intensity,
              hue: 30  // Смещение тона в сторону сепии
            })
            .gamma(1.2)
            .blur(0.5 * intensity);
          break;
          
        case "Акварель":
        case "Watercolor":
          // Эффект акварели: мягкие края, светлые тона, текстура
          sharpImage = sharpImage
            // Сначала увеличиваем яркость и снижаем контрастность
            .modulate({
              brightness: 1.2,
              saturation: 1.05 * intensity
            })
            // Слегка размываем для "растекания" красок
            .blur(2 * intensity)
            // Затем повышаем контрастность для выделения деталей
            .convolve({
              width: 3,
              height: 3,
              kernel: [0, 0, 0, 0, 1.5, 0, 0, 0, 0],
              scale: 1
            })
            // Добавляем немного резкости для текстуры бумаги
            .sharpen(3 * intensity)
            // Настраиваем гамму для более мягких переходов (значение должно быть 1.0 - 3.0)
            .gamma(1.1);
          break;
          
        case "Набросок карандашом":
        case "Pencil Sketch":
          // Карандашный набросок по примеру с высококачественной детализацией
          {
            // Полностью переработанный алгоритм для соответствия целевому примеру
            // с более чёткими линиями и большей естественностью
            
            // Подготовка базового изображения
            const baseImage = sharpImage.clone();
            
            // Шаг 1: Создаем очень светлый фон с полным обесцвечиванием
            sharpImage = sharpImage
              // Преобразуем в оттенки серого для карандашного наброска
              .grayscale()
              // Делаем светлее всё изображение, как на примере
              .modulate({
                brightness: 1.4
              })
              // Усиливаем контраст для выделения линий
              .linear(
                1.1,  // Множитель контраста
                10    // Делаем светлее, чтобы не было слишком темных областей
              );
            
            // Шаг 2: Применяем особую фильтрацию для контурного выделения
            sharpImage = sharpImage
              // Делаем чёткие контуры основных границ
              .convolve({
                width: 3,
                height: 3,
                kernel: [
                  -1, -1, -1,
                  -1,  9, -1,
                  -1, -1, -1
                ],
                scale: 0.7 * intensity  // Масштабируем интенсивность контуров
              })
              // Инвертируем цвета для черных линий на белом фоне
              .negate()
              // Настраиваем яркость и контраст для более естественного эффекта
              .linear(
                1.2 * intensity,  // Контраст линий (зависит от интенсивности)
                25               // Осветляем всё изображение
              );
            
            // Шаг 3: Делаем изображение более мягким, как карандашный рисунок
            sharpImage = sharpImage
              // Применяем небольшое размытие для имитации мягкости грифеля
              .blur(0.4)
              // Выделяем контрастные линии, но не слишком резко
              .sharpen(Math.min(5, Math.max(1, 3 * intensity)))
              // Финальная коррекция яркости для баланса белых и черных участков
              .modulate({
                brightness: 1.1
              })
              // Убираем лишний шум, сохраняя основные линии
              .threshold(200)
              // Инвертируем для получения черных линий на белом фоне
              .negate();
            
            // Шаг 4: Финальные улучшения для достижения эффекта как на примере
            sharpImage = sharpImage
              // Делаем общий тон чуть светлее, чтобы подчеркнуть карандашные линии
              .modulate({
                brightness: 1.15
              })
              // Добавляем мягкую текстуру бумаги
              .sharpen(0.5); // Легкая резкость для текстуры
          }
          break;

        case "Тушь":
        case "Ink Drawing":
          // Улучшенный эффект рисунка тушью, основанный на технике суми-э и каллиграфии
          {
            // Создаем копию изображения для работы со слоями
            const baseImage = sharpImage.clone();
            
            // Шаг 1: Создаем текстуру рисовой бумаги (васи)
            const paperLayer = baseImage.clone()
              // Сначала делаем яркий белый фон
              .threshold(250)
              // Добавляем легкую текстуру "бумаги"
              .modulate({
                brightness: 1.25  // Увеличиваем яркость для более белого фона
              });
            
            // Шаг 2: Создаем основные штрихи туши
            const mainInkLayer = baseImage.clone()
              .grayscale()  // Преобразуем в оттенки серого
              // Усиливаем контраст
              .normalize()
              // Применяем сильную пороговую обработку для четких линий без полутонов
              .threshold(125 + (70 * (1 - intensity)))  // Более низкие значения для более жирных линий
              // Инвертируем для получения черных линий на белом
              .negate();
              
            // Шаг 3: Создаем детализированные тонкие линии
            const detailedInkLayer = baseImage.clone()
              .grayscale()
              // Выделяем края с помощью оператора Собеля или похожего ядра
              .convolve({
                width: 3,
                height: 3,
                kernel: [
                  -2, -2, -2,
                  -2, 16, -2,
                  -2, -2, -2
                ],
                scale: 1.2
              })
              // Настраиваем контраст линий
              .normalize()
              // Выбираем только самые сильные линии через пороговую обработку
              .threshold(200)
              // Инвертируем для черных линий
              .negate();
            
            // Шаг 4: Создаем "растекание" туши для более органичного вида
            const bleedEffect = baseImage.clone()
              .grayscale()
              // Сначала размываем для имитации растекания туши по волокнам бумаги
              .blur(2)
              // Усиливаем темные области
              .linear(
                intensity * 2,  // Усиливаем контраст
                -20             // Делаем темнее
              )
              // Оставляем только заметные области растекания
              .threshold(230)
              // Инвертируем для получения черных пятен
              .negate()
              // Слегка размываем края для более естественного вида
              .blur(0.5);
            
            // Шаг 5: Упрощенная версия без сложных комбинаций слоев
            // Используем более простой подход без composite для предотвращения ошибок
            
            // Создаем основные штрихи с эффектом туши
            const inkLines = await mainInkLayer
              .threshold(100) // Более четкие линии
              .negate() // Инвертируем для получения черных линий
              .sharpen(intensity * 5); // Увеличиваем резкость для более четких линий
            
            // Применяем финальную обработку изображения
            sharpImage = await paperLayer
              .grayscale()
              .modulate({
                brightness: 1.3 // Увеличиваем яркость фона
              })
              // Имитируем эффект туши через сильный контраст и резкость
              .threshold(150)
              .negate() // Инвертируем для черных линий на белом фоне
              .sharpen(intensity * 6); // Высокая резкость для четких контуров
          }
          break;

        case "Контурный рисунок":
        case "Line Drawing":
          // Улучшенный контурный рисунок на основе методов выделения краев
          {
            // Создаем копию изображения
            const baseImage = sharpImage.clone();
            
            // Шаг 1: Создаем белый фон (чистая бумага)
            const paperLayer = baseImage.clone()
              .threshold(255) // Полностью белый
              .modulate({
                brightness: 1.25  // Чуть ярче для более чистого белого
              });
            
            // Шаг 2: Создаем контурные линии с использованием алгоритма обнаружения краев (Canny или похожий)
            // Используем комбинацию фильтров для более четкого результата
            
            // Сначала создаем основные линии с помощью высокочастотного фильтра
            const mainEdges = baseImage.clone()
              .grayscale() // Убираем цвет
              .normalize() // Нормализуем контраст
              // Применяем улучшенное ядро свертки для выделения краев
              .convolve({
                width: 3,
                height: 3,
                kernel: [
                  -1, -1, -1,
                  -1,  9, -1,
                  -1, -1, -1
                ],
                scale: 1.0
              })
              // Настраиваем контраст и яркость для четких линий
              .linear(
                intensity * 2.0,  // Множитель контраста
                -40               // Смещение яркости (отрицательное для темных линий)
              )
              // Применяем порог для отсечения мелких деталей, оставляя только четкие линии
              .threshold(150)
              // Инвертируем для получения черных линий на белом фоне
              .negate();
              
            // Выделяем тонкие детали для более полного контура
            const detailEdges = baseImage.clone()
              .grayscale()
              // Используем другой тип фильтра для обнаружения тонких деталей
              .convolve({
                width: 3,
                height: 3,
                kernel: [
                  0, -1, 0,
                  -1, 4, -1,
                  0, -1, 0
                ],
                scale: intensity * 1.5
              })
              // Настраиваем для получения тонких линий
              .threshold(200)
              // Инвертируем для черных линий
              .negate();
            
            // Вместо composite, используем более простой подход для предотвращения ошибок
            // Создаем линии с контуром без комбинирования слоев
            const edgeBuffer = await mainEdges.toBuffer();
            
            // Применяем финальную обработку изображения
            sharpImage = await paperLayer
              .grayscale()
              // Четкие края с высоким контрастом
              .normalize()
              .convolve({
                width: 3,
                height: 3,
                kernel: [
                  -1, -1, -1,
                  -1,  8, -1,
                  -1, -1, -1
                ],
                scale: intensity * 1.2
              })
              .threshold(180)
              .negate() // Черные линии на белом фоне
              .sharpen(intensity * 4); // Увеличиваем резкость линий
          }
          break;
          
        default:
          console.log("Неизвестный стиль, применение базовой трансформации");
          sharpImage = sharpImage
            .modulate({
              brightness: 1.1, 
              saturation: 1.2
            });
      }
      
      console.log("Обработка изображения с помощью Sharp завершена");
    }
    
    // Преобразуем обработанное изображение в PNG и затем в base64
    const processedBuffer = await sharpImage.toFormat('png').toBuffer();
    const processedBase64 = 'data:image/png;base64,' + processedBuffer.toString('base64');
    
    return processedBase64;
  } catch (error) {
    console.error('Ошибка при применении фильтров Sharp:', error);
    return imageBase64;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Meme Templates
  app.get("/api/templates", async (req: Request, res: Response) => {
    try {
      const templates = await storage.getMemeTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates", error: String(error) });
    }
  });

  app.get("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getMemeTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template", error: String(error) });
    }
  });

  app.post("/api/templates", async (req: Request, res: Response) => {
    try {
      const templateData = insertMemeTemplateSchema.parse(req.body);
      const newTemplate = await storage.createMemeTemplate(templateData);
      res.status(201).json(newTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template", error: String(error) });
    }
  });

  app.put("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const templateData = insertMemeTemplateSchema.partial().parse(req.body);
      const updatedTemplate = await storage.updateMemeTemplate(id, templateData);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(updatedTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template", error: String(error) });
    }
  });

  app.delete("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const success = await storage.deleteMemeTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template", error: String(error) });
    }
  });

  // Saved Memes
  app.get("/api/memes", async (req: Request, res: Response) => {
    try {
      // For now, we'll use a default user ID of 1
      const userId = 1;
      const memes = await storage.getSavedMemes(userId);
      res.json(memes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch memes", error: String(error) });
    }
  });

  app.get("/api/memes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meme ID" });
      }

      const meme = await storage.getSavedMeme(id);
      if (!meme) {
        return res.status(404).json({ message: "Meme not found" });
      }

      res.json(meme);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meme", error: String(error) });
    }
  });

  app.post("/api/memes", async (req: Request, res: Response) => {
    try {
      const memeData = insertSavedMemeSchema.parse(req.body);
      const newMeme = await storage.createSavedMeme(memeData);
      res.status(201).json(newMeme);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meme data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create meme", error: String(error) });
    }
  });

  app.put("/api/memes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meme ID" });
      }

      const memeData = insertSavedMemeSchema.partial().parse(req.body);
      const updatedMeme = await storage.updateSavedMeme(id, memeData);
      
      if (!updatedMeme) {
        return res.status(404).json({ message: "Meme not found" });
      }

      res.json(updatedMeme);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meme data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update meme", error: String(error) });
    }
  });

  app.delete("/api/memes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meme ID" });
      }

      const success = await storage.deleteSavedMeme(id);
      if (!success) {
        return res.status(404).json({ message: "Meme not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meme", error: String(error) });
    }
  });

  // Collages
  app.get("/api/collages", async (req: Request, res: Response) => {
    try {
      // For now, we'll use a default user ID of 1
      const userId = 1;
      const collages = await storage.getCollages(userId);
      res.json(collages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collages", error: String(error) });
    }
  });

  app.get("/api/collages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collage ID" });
      }

      const collage = await storage.getCollage(id);
      if (!collage) {
        return res.status(404).json({ message: "Collage not found" });
      }

      res.json(collage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collage", error: String(error) });
    }
  });

  app.post("/api/collages", async (req: Request, res: Response) => {
    try {
      const collageData = insertCollageSchema.parse(req.body);
      const newCollage = await storage.createCollage(collageData);
      res.status(201).json(newCollage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collage data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create collage", error: String(error) });
    }
  });

  app.put("/api/collages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collage ID" });
      }

      const collageData = insertCollageSchema.partial().parse(req.body);
      const updatedCollage = await storage.updateCollage(id, collageData);
      
      if (!updatedCollage) {
        return res.status(404).json({ message: "Collage not found" });
      }

      res.json(updatedCollage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collage data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update collage", error: String(error) });
    }
  });

  app.delete("/api/collages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collage ID" });
      }

      const success = await storage.deleteCollage(id);
      if (!success) {
        return res.status(404).json({ message: "Collage not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete collage", error: String(error) });
    }
  });

  // AI Styles
  app.get("/api/styles", async (req: Request, res: Response) => {
    try {
      // Используем нашу новую реализацию бесплатных фильтров
      try {
        const { getAvailableAiStyles } = await import('./image_filters');
        const styles = getAvailableAiStyles();
        res.json(styles);
      } catch (localError) {
        console.error('Ошибка при загрузке стилей из локального модуля:', localError);
        // Пробуем резервный вариант - Hugging Face
        try {
          const { getAvailableAiStyles } = await import('./hugging_face_styler');
          const styles = getAvailableAiStyles();
          res.json(styles);
        } catch (aiError) {
          console.error('Ошибка при загрузке стилей из AI модуля:', aiError);
          // Если все не работает - загружаем из хранилища
          const styles = await storage.getAiStyles();
          res.json(styles);
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch styles", error: String(error) });
    }
  });

  app.get("/api/styles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid style ID" });
      }

      try {
        // Сначала пробуем получить из модуля image_filters
        const { getAvailableAiStyles } = await import('./image_filters');
        const styles = getAvailableAiStyles();
        const style = styles.find(s => s.id === id);
        
        if (style) {
          return res.json(style);
        } else {
          // Если стиль не найден, пробуем другие источники
          try {
            // Пробуем получить из Hugging Face
            const { getAvailableAiStyles: getHfStyles } = await import('./hugging_face_styler');
            const hfStyles = getHfStyles();
            const hfStyle = hfStyles.find(s => s.id === id);
            
            if (hfStyle) {
              return res.json(hfStyle);
            }
          } catch (hfError) {
            console.error('Ошибка при загрузке стиля из Hugging Face:', hfError);
          }
          
          // В крайнем случае, пробуем получить из хранилища
          const storageStyle = await storage.getAiStyle(id);
          if (!storageStyle) {
            return res.status(404).json({ message: "Style not found" });
          }
          
          return res.json(storageStyle);
        }
      } catch (localError) {
        console.error('Ошибка при загрузке стиля из локального модуля:', localError);
        
        // Если с image_filters возникли проблемы, пробуем Hugging Face
        try {
          const { getAvailableAiStyles } = await import('./hugging_face_styler');
          const styles = getAvailableAiStyles();
          const style = styles.find(s => s.id === id);
          
          if (style) {
            return res.json(style);
          }
        } catch (aiError) {
          console.error('Ошибка при загрузке стиля из HF модуля:', aiError);
        }
        
        // Резервный вариант - загружаем из хранилища
        const style = await storage.getAiStyle(id);
        if (!style) {
          return res.status(404).json({ message: "Style not found" });
        }
        
        return res.json(style);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch style", error: String(error) });
    }
  });

  // Apply AI style to an image
  app.post("/api/apply-style", async (req: Request, res: Response) => {
    try {
      const { image, styleParams } = req.body;
      
      if (!image || !styleParams) {
        return res.status(400).json({ message: "Missing image or style parameters" });
      }
      
      // Применяем AI-стиль к изображению
      const styledImage = await applyAiStyle(image, styleParams);
      
      res.json({ styledImage });
    } catch (error) {
      console.error("Error applying style:", error);
      res.status(500).json({ 
        message: "Failed to apply style", 
        error: String(error) 
      });
    }
  });

  return createServer(app);
}