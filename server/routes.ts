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

async function applyAiStyle(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log("Применение AI-стиля:", styleParams);
    
    // Убираем префикс data:image/...;base64, из строки base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Проверяем наличие API ключа OpenAI
    if (process.env.OPENAI_API_KEY) {
      console.log("Найден ключ OpenAI API, используем настоящий AI для обработки");
      
      try {
        // Создаем временную директорию для передачи данных
        const tempDir = mkdtempSync(join(tmpdir(), 'ai-meme-'));
        const imageFilePath = join(tempDir, 'image.txt');
        const styleParamsFilePath = join(tempDir, 'style-params.json');
        const resultFilePath = join(tempDir, 'result.txt');
        
        // Записываем base64 изображения и параметры стиля во временные файлы
        await writeFile(imageFilePath, base64Data);
        await writeFile(styleParamsFilePath, JSON.stringify(styleParams));
        
        // Создаем простой Python-скрипт для запуска
        const scriptPath = join(tempDir, 'run_ai.py');
        const scriptContent = `
import json
import sys
import os
from server.openai_utils import process_image_with_openai

# Пути к файлам из аргументов командной строки
image_path = sys.argv[1]
params_path = sys.argv[2]
result_path = sys.argv[3]

# Загружаем изображение из файла
with open(image_path, 'r') as f:
    image_base64 = f.read()

# Загружаем параметры из файла
with open(params_path, 'r') as f:
    style_params = json.load(f)

# Обрабатываем изображение
result = process_image_with_openai(image_base64, style_params)

# Записываем результат в файл
with open(result_path, 'w') as f:
    f.write(result)
`;
        await writeFile(scriptPath, scriptContent);
        
        // Запускаем отдельный Python-скрипт для обработки
        console.log("Запуск Python-скрипта для обработки изображения через OpenAI API...");
        const { spawn } = await import('child_process');
        
        return new Promise((resolve, reject) => {
          const pythonProcess = spawn('python', [
            scriptPath, 
            imageFilePath, 
            styleParamsFilePath, 
            resultFilePath
          ]);
          
          let errorOutput = '';
          
          pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`Python error: ${data}`);
          });
          
          pythonProcess.on('close', async (code) => {
            try {
              if (code !== 0) {
                console.error(`Python process exited with code ${code}`);
                console.error(`Error: ${errorOutput}`);
                throw new Error(`Python process failed with exit code ${code}: ${errorOutput}`);
              }
              
              // Проверяем, был ли создан файл с результатом
              try {
                const result = await readFile(resultFilePath, 'utf8');
                console.log("Обработка изображения AI успешно завершена");
                
                // Очистка временных файлов
                await Promise.all([
                  unlink(imageFilePath).catch(() => {}),
                  unlink(styleParamsFilePath).catch(() => {}),
                  unlink(scriptPath).catch(() => {}),
                  unlink(resultFilePath).catch(() => {})
                ]);
                
                resolve('data:image/png;base64,' + result.trim());
              } catch (readError) {
                console.error("Ошибка при чтении результата:", readError);
                throw readError;
              }
            } catch (error) {
              console.error("Ошибка при обработке изображения Python-скриптом:", error);
              console.log("Используем запасной вариант с Sharp для обработки изображения");
              // Продолжаем выполнение с Sharp
              resolve(applySharpFilters(imageBase64, base64Data, styleParams));
            }
          });
        });
      } catch (pythonError) {
        console.error("Ошибка при обработке изображения Python-скриптом:", pythonError);
        console.log("Используем запасной вариант с Sharp для обработки изображения");
        return applySharpFilters(imageBase64, base64Data, styleParams);
      }
    } else {
      console.log("API ключ OpenAI не найден, используем локальную обработку с Sharp");
      return applySharpFilters(imageBase64, base64Data, styleParams);
    }
  } catch (error) {
    console.error('Ошибка при применении AI-стиля:', error);
    console.error((error as Error).stack);
    // В случае ошибки возвращаем исходное изображение
    return imageBase64;
  }
}

// Отдельная функция для применения фильтров Sharp как запасной вариант
async function applySharpFilters(imageBase64: string, base64Data: string, styleParams: any): Promise<string> {
  try {
    // Преобразуем строку base64 в буфер
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Создаем объект sharp для работы с изображением
    let sharpImage = sharp(imageBuffer);
    
    // Получим информацию об изображении для сохранения пропорций
    const metadata = await sharpImage.metadata();
    
    // Применяем эффекты в зависимости от выбранной AI модели
    if (styleParams.aiModel) {
      console.log(`Запуск модели Sharp: ${styleParams.aiModel}`);
      
      switch (styleParams.aiModel) {
        case "neural-style":
          // Нейронный стиль - высокая контрастность, четкость
          console.log(`Применение нейронной стилизации с интенсивностью: ${styleParams.styleIntensity}`);
          sharpImage = sharpImage
            .modulate({
              brightness: 1.2, 
              saturation: 1.5
            })
            .sharpen(styleParams.styleIntensity * 20 || 15);
          break;
          
        case "anime-gan":
          // Аниме стиль - увеличение яркости, насыщенности цветов
          console.log(`Применение анимизации с интенсивностью: ${styleParams.styleIntensity}`);
          sharpImage = sharpImage
            .modulate({
              brightness: 1.1, 
              saturation: 1.4, 
              hue: 5
            })
            .median(3); // Сглаживание для эффекта "рисованности"
          break;
          
        case "style-transfer":
          // Перенос стиля - используем эффекты в зависимости от styleReference
          console.log(`Перенос стиля: ${styleParams.styleReference} для типа: ${styleParams.transformType}`);
          
          // Применяем разные эффекты в зависимости от запрошенного стиля
          if (styleParams.styleReference === 'pop-art') {
            sharpImage = sharpImage
              .modulate({
                brightness: 1.2, 
                saturation: 2.0, 
                hue: 90
              })
              .threshold(150);
          } else if (styleParams.styleReference === 'impressionism') {
            sharpImage = sharpImage
              .modulate({
                brightness: 1.1, 
                saturation: 1.3
              })
              .blur(2);
          } else if (styleParams.styleReference === 'cubism') {
            // Кубизм с сильным контрастом и необычными цветами
            sharpImage = sharpImage
              .modulate({
                brightness: 1.1, 
                saturation: 0.8, 
                hue: 180
              })
              .sharpen(20)
              .negate({ alpha: false });
          }
          break;
          
        case "pixel-transformer":
          // Пиксельная графика - уменьшаем разрешение и увеличиваем обратно
          console.log(`Пикселизация с размером пикселя: ${styleParams.pixelSize || 8}`);
          const pixelSize = styleParams.pixelSize || 8;
          
          const width = metadata.width;
          const height = metadata.height;
          
          if (width && height) {
            // Уменьшаем до маленького размера и затем увеличиваем обратно без сглаживания
            sharpImage = sharpImage
              .resize(Math.floor(width / pixelSize), Math.floor(height / pixelSize), {
                kernel: 'nearest'
              })
              .resize(width, height, {
                kernel: 'nearest'
              });
          }
          break;
          
        case "cartoonizer":
          // Карикатурный стиль с повышенной контрастностью
          console.log(`Преобразование в карикатуру с уровнем преувеличения: ${styleParams.exaggeration || 1.5}`);
          sharpImage = sharpImage
            .modulate({
              brightness: 1.1, 
              saturation: 1.5
            })
            .sharpen(25)
            .median(3); // Эффект сглаживания "рисунка"
          break;
          
        case "comic-transformer":
          // Комикс стиль - оконтуривание и яркие цвета
          console.log(`Преобразование в стиль комикса с эффектом чернил: ${styleParams.inkEffect || 'high'}`);
          sharpImage = sharpImage
            .sharpen(30)
            .modulate({
              brightness: 1.2, 
              saturation: 1.5
            })
            .threshold(110); // Для эффекта "чернил"
          break;
          
        case "future-vision":
          // Футуристический стиль с неоновыми эффектами
          console.log(`Применение футуристического стиля с неоновым эффектом: ${styleParams.neonEffect || 'high'}`);
          sharpImage = sharpImage
            .modulate({
              brightness: 1.2, 
              saturation: 1.7, 
              hue: 240 // Голубой оттенок
            })
            .sharpen(20)
            .negate({ alpha: false }) // Инвертируем цвета для неонового эффекта
            .normalize(); // Нормализуем результат
          break;
          
        default:
          console.log("Неизвестная AI модель, применение базовой трансформации");
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