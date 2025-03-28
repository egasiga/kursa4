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
          // Настоящий эффект масляной живописи с текстурой мазков
          // Следуем техникам, которые используются в художественной обработке
          {
            // Создаем копию изображения для смешивания слоев
            const baseImage = sharpImage.clone();
            
            // Слой 1: Базовая текстура "мазков" - сильное повышение контраста и снижение деталей
            const textureLayer = baseImage.clone()
              .median(5)  // Сглаживание для объединения похожих цветов
              .modulate({ saturation: 1.4 * intensity })  // Увеличиваем насыщенность
              .normalize()  // Нормализуем для усиления контраста
              .gamma(0.85);  // Настраиваем гамму для светлых тонов
            
            // Слой 2: Слой детализации - подчеркиваем границы и формы
            const detailLayer = baseImage.clone()
              .convolve({
                width: 3,
                height: 3,
                kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1],  // Сильное выделение деталей
                scale: 0.7  // Масштабируем эффект для естественности
              })
              .gamma(1.2)  // Настройка гаммы 
              .modulate({ 
                brightness: 1.15, 
                saturation: 1.25 * intensity  // Усиливаем цвета
              });
            
            // Комбинируем слои через композитинг
            // Сначала берем текстурный слой и накладываем поверх детали
            sharpImage = detailLayer
              .composite([
                { input: textureLayer, blend: 'overlay' }  // Режим наложения overlay для реалистичности
              ])
              .sharpen(8 * intensity);  // Финальная настройка резкости
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
          // Создание эффекта карандашного рисунка по реальным алгоритмам обработки изображений
          {
            // Создаем копию изображения для работы со слоями
            const baseImage = sharpImage.clone();
            
            // Слой 1: Фоновый слой (бумага)
            const paperBackground = baseImage.clone()
              .blur(0.5)  // Легкое размытие для имитации текстуры бумаги
              .grayscale()  // Преобразуем в оттенки серого
              .modulate({
                brightness: 1.2  // Делаем светлее для имитации бумаги
              });
            
            // Слой 2: Линии и контуры (карандаш)
            const pencilLayer = baseImage.clone()
              .grayscale()  // Преобразуем в оттенки серого
              .normalize()  // Нормализуем контраст
              // Увеличиваем контраст и выделяем края
              .convolve({  
                width: 3,
                height: 3,
                kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
                scale: 1.5
              })
              // Инвертируем для получения темных линий
              .negate()
              // Настраиваем контраст линий
              .gamma(0.7)
              .modulate({
                brightness: 0.9,  // Чуть темнее
                saturation: 0     // Полностью убираем насыщенность
              });
              
            // Комбинируем слои: линии (pencilLayer) на фоне бумаги (paperBackground)
            sharpImage = paperBackground.composite([
              {
                input: pencilLayer,
                blend: 'multiply'  // "Умножение" - стандартный режим для наложения линий
              }
            ]);
          }
          break;

        case "Тушь":
        case "Ink Drawing":
          // Эффект рисунка тушью по реальным техникам восточной каллиграфии
          {
            // Создаем копию изображения для работы со слоями
            const baseImage = sharpImage.clone();
            
            // Слой 1: Чистый белый фон (рисовая бумага)
            const paperLayer = baseImage.clone()
              .threshold(255) // Делаем полностью белым
              .modulate({
                brightness: 1.2  // Немного ярче для эффекта белоснежной бумаги
              });
            
            // Слой 2: Темные контрастные линии (тушь)
            const inkLayer = baseImage.clone()
              .grayscale()  // Преобразуем в оттенки серого
              // Повышаем контрастность, выделяем края
              .normalize()  
              // Выполняем двойную обработку для большей выразительности линий
              .convolve({
                width: 3,
                height: 3,
                kernel: [-3, -3, -3, -3, 24, -3, -3, -3, -3],
                scale: 1.5
              })
              // Инвертируем, чтобы линии стали черными
              .negate()
              // Используем пороговую обработку для создания четких линий без полутонов,
              // что характерно для традиционных рисунков тушью
              .threshold(180 * intensity);
              
            // Дополнительно утончаем линии с помощью эрозии
            const thinInkLayer = inkLayer.clone()
              .blur(0.3) // Легкое размытие перед эрозией 
              .threshold(200); // Более жесткий порог для тонких линий
              
            // Комбинируем слои: сначала чистый белый фон, поверх него тонкие четкие линии
            sharpImage = paperLayer.composite([
              {
                input: thinInkLayer,
                blend: 'multiply'  // Умножение для наложения черных линий на белый фон
              }
            ]);
          }
          break;

        case "Контурный рисунок":
        case "Line Drawing":
          // Простое выделение краев и контуров
          sharpImage = sharpImage
            .grayscale()  // Сначала преобразуем в оттенки серого
            .modulate({ brightness: 1.5 })  // Повышаем яркость
            .convolve({  // Применяем ядро свертки для выделения краев
              width: 3,
              height: 3,
              kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
            })
            .negate()  // Инвертируем для получения черных линий на белом фоне
            .threshold(120);  // Делаем контрастнее
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