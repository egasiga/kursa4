import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMemeTemplateSchema, insertSavedMemeSchema, insertCollageSchema } from "@shared/schema";
import fetch from "node-fetch";

// Функция для применения AI-стилей к изображениям
// В этой реализации мы используем OpenAI API через Python-скрипт
// для настоящей AI-стилизации изображений
import { exec } from 'child_process';
import { promisify } from 'util';
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
        // Запускаем Python-скрипт для обработки изображения через OpenAI API
        const styleParamsJson = JSON.stringify(styleParams);
        
        // Подготавливаем команду для запуска Python-скрипта
        // Передаем изображение и параметры стиля в качестве аргументов
        const pythonCommand = `python server/ai_processor.py "${base64Data}" '${styleParamsJson}'`;
        
        console.log("Запуск Python-скрипта для обработки изображения...");
        
        // Устанавливаем таймаут в 30 секунд, так как запросы к OpenAI API могут занимать время
        const { stdout, stderr } = await execPromise(pythonCommand, { timeout: 30000 });
        
        if (stderr) {
          console.error("Ошибка при выполнении Python-скрипта:", stderr);
        }
        
        if (stdout) {
          console.log("Обработка изображения AI успешно завершена");
          return 'data:image/png;base64,' + stdout.trim();
        }
      } catch (pythonError) {
        console.error("Ошибка при обработке изображения Python-скриптом:", pythonError);
        console.log("Используем запасной вариант с Sharp для обработки изображения");
      }
    } else {
      console.log("API ключ OpenAI не найден, используем локальную обработку с Sharp");
    }
    
    // Запасной вариант: если OpenAI API недоступен, используем Sharp
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
    console.error('Ошибка при применении AI-стиля:', error);
    console.error((error as Error).stack);
    // В случае ошибки возвращаем исходное изображение
    return imageBase64;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = app.route("/api");

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
      res.status(500).json({ message: "Failed to fetch AI styles", error: String(error) });
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
        return res.status(404).json({ message: "AI style not found" });
      }

      res.json(style);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI style", error: String(error) });
    }
  });

  // Apply AI style to an image
  app.post("/api/apply-style", async (req: Request, res: Response) => {
    try {
      const { imageData, styleId } = req.body;
      
      if (!imageData || !styleId) {
        return res.status(400).json({ message: "Image data and style ID are required" });
      }

      const style = await storage.getAiStyle(parseInt(styleId));
      if (!style) {
        return res.status(404).json({ message: "AI style not found" });
      }

      // Apply AI style transformation
      const styledImage = await applyAiStyle(imageData, style.apiParams);
      
      res.json({ styledImage });
    } catch (error) {
      res.status(500).json({ message: "Failed to apply AI style", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
