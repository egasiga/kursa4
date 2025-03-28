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
 * Применяет художественный стиль к изображению с использованием библиотеки Sharp
 * @param imageBase64 - изображение в формате base64 с префиксом data:image/...;base64,
 * @param styleParams - параметры стиля
 * @returns обработанное изображение в формате base64
 */
async function applyAiStyle(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log("Применение художественного стиля:", styleParams);
    
    // Убираем префикс data:image/...;base64, из строки base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Применяем художественные фильтры с помощью Sharp
    const styledImage = await applyArtisticFilters(imageBase64, base64Data, styleParams);
    
    return styledImage;
  } catch (error) {
    console.error('Ошибка при применении художественного стиля:', error);
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
          // Эффект масляной живописи с текстурой мазков, ориентируясь на Paint.NET
          // Используем комбинацию медианного фильтра, размытия и повышенной насыщенности
          {
            // Базовое подготовленное изображение
            const baseImage = sharpImage.clone();
            
            // 1. Основной эффект: медианный фильтр для объединения областей в "мазки"
            const brushStrokeEffect = baseImage.clone()
              // Применяем медианный фильтр разной интенсивности в зависимости от размера "мазка"
              .median(Math.max(3, Math.floor(5 * intensity)))  // Минимум 3, максимум зависит от интенсивности
              // Повышаем насыщенность для живописного эффекта
              .modulate({ 
                saturation: 1.3 * intensity,  // Увеличиваем насыщенность
                brightness: 1.05  // Слегка увеличиваем яркость
              })
              // Повышаем контраст для выразительности мазков
              .linear(
                1.1,  // Множитель (контраст)
                0     // Смещение (яркость)
              );
              
            // 2. Слой текстуры для имитации холста и мазков краски
            const textureLayer = baseImage.clone()
              // Повышаем контраст краев для выделения текстуры
              .sharpen(10 * intensity)
              // Слегка сглаживаем детали, сохраняя текстуру
              .blur(0.5)
              // Применяем негативный фильтр повышения резкости для имитации текстуры
              .convolve({
                width: 3,
                height: 3,
                kernel: [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0],
                scale: 1.0
              });
            
            // 3. Создаем основу масляной живописи, смешивая эффект мазков и текстуру
            sharpImage = brushStrokeEffect
              .composite([
                { input: textureLayer, blend: 'overlay', gravity: 'centre' }
              ]);
            
            // 4. Наконец, добавляем немного резкости для подчеркивания деталей
            sharpImage = sharpImage.sharpen(5 * intensity);
          }
          break;
          
        case "Пиксель-арт":
        case "Pixel Art":
          // Пиксельная графика - уменьшаем разрешение и увеличиваем обратно
          const pixelSize = Math.max(2, Math.floor(8 * intensity));
          
          // Уменьшаем и масштабируем без сглаживания
          sharpImage = sharpImage
            .resize(Math.floor(width / pixelSize), Math.floor(height / pixelSize), {
              kernel: 'nearest'
            })
            .resize(width, height, {
              kernel: 'nearest'
            });
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
            // Настраиваем гамму для более мягких переходов
            .gamma(0.85);
          break;
          
        case "Набросок карандашом":
        case "Pencil Sketch":
          // Улучшенный эффект карандашного наброска, основанный на алгоритмах из Paint.NET и других графических редакторов
          {
            // Создаем копию изображения для работы со слоями
            const baseImage = sharpImage.clone();
            
            // Шаг 1: Создаем базовую бумажную текстуру (слегка кремовый оттенок для реализма)
            // Для этого создаем пустое белое изображение с легким оттенком
            // const paperColor = Buffer.from([255, 252, 245]); // Очень светлый кремовый цвет
            const paperBackground = baseImage.clone()
              .blur(0.5) // Легкое размытие
              .grayscale() // Преобразуем в оттенки серого
              .modulate({
                brightness: 1.3, // Очень светлый фон
                saturation: 0    // Полностью убираем насыщенность
              })
              .tint({ r: 255, g: 252, b: 245 }); // Добавляем легкий кремовый оттенок
            
            // Шаг 2: Создаем линии карандаша
            // Сначала создаем легкую основу (текстура нажима карандаша)
            const baseSketch = baseImage.clone()
              .grayscale() // Преобразуем в оттенки серого
              .normalize() // Нормализуем для улучшения контраста
              // Увеличиваем контраст и выделяем края (карандашные линии)
              .linear(
                intensity * 1.5, // Множитель контраста, зависит от интенсивности
                -(intensity * 10) // Смещение яркости, отрицательное для затемнения линий
              );
            
            // Шаг 3: Создаем дополнительные контурные линии для подчеркивания рисунка
            const edgeLines = baseImage.clone()
              .grayscale()
              // Выделяем края с помощью подходящего ядра свертки
              .convolve({
                width: 3,
                height: 3,
                kernel: [
                  -1, -1, -1,
                  -1,  8, -1,
                  -1, -1, -1
                ],
                scale: intensity, // Регулируем интенсивность контуров
                offset: 128      // Добавляем смещение для более естественного вида
              })
              // Инвертируем для темных линий на светлом фоне
              .negate()
              // Регулируем контрастность линий
              .threshold(150)
              // Слегка размываем для имитации карандашного штриха
              .blur(0.3);
            
            // Шаг 4: Комбинируем слои для получения финального эффекта
            // Сначала комбинируем базовый скетч с контурными линиями
            const combinedSketch = baseSketch.composite([
              {
                input: edgeLines,
                blend: 'multiply', // Умножение для создания эффекта наложения штрихов
                gravity: 'centre'
              }
            ]);
            
            // Шаг 5: Накладываем получившийся рисунок на текстуру бумаги
            sharpImage = paperBackground.composite([
              {
                input: combinedSketch,
                blend: 'multiply', // Умножение - стандартный режим для рисунка на бумаге
                gravity: 'centre'
              }
            ]);
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
            
            // Шаг 5: Комбинируем все слои
            // Сначала комбинируем основные и детализированные линии
            const combinedInkLayer = mainInkLayer.composite([
              {
                input: detailedInkLayer,
                blend: 'darken',  // Темнее - берет самые темные пиксели из обоих слоев
                gravity: 'centre'
              }
            ]);
            
            // Затем добавляем эффект растекания
            const finalInkLayer = combinedInkLayer.composite([
              {
                input: bleedEffect,
                blend: 'multiply',  // Умножение для наложения и смешивания областей
                gravity: 'centre'
              }
            ]);
            
            // Комбинируем финальные штрихи туши с бумагой
            sharpImage = paperLayer.composite([
              {
                input: finalInkLayer,
                blend: 'multiply',  // Классический режим для рисунка тушью на бумаге
                gravity: 'centre'
              }
            ]);
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
            
            // Объединяем основные и детальные линии
            const combinedEdges = mainEdges.composite([
              {
                input: detailEdges,
                blend: 'darken', // Режим "темнее" для объединения линий
                gravity: 'centre'
              }
            ]);
            
            // Накладываем контуры на белый фон
            sharpImage = paperLayer.composite([
              {
                input: combinedEdges,
                blend: 'multiply', // Классический режим для рисунка на бумаге
                gravity: 'centre'
              }
            ]);
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
      const styles = await storage.getAiStyles();
      res.json(styles);
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

      const style = await storage.getAiStyle(id);
      if (!style) {
        return res.status(404).json({ message: "Style not found" });
      }

      res.json(style);
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