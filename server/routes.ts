import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMemeTemplateSchema, insertSavedMemeSchema, insertCollageSchema } from "@shared/schema";
import sharp from 'sharp';
import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function registerRoutes(app: Express): Promise<Server> {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  // Meme templates
  app.get("/api/templates", async (req: Request, res: Response) => {
    try {
      const templates = await storage.getMemeTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
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
      if (template) {
        res.json(template);
      } else {
        res.status(404).json({ message: "Template not found" });
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template", error: String(error) });
    }
  });

  app.post("/api/templates", async (req: Request, res: Response) => {
    try {
      const parseResult = insertMemeTemplateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid template data", errors: parseResult.error.errors });
      }
      const template = await storage.createMemeTemplate(parseResult.data);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template", error: String(error) });
    }
  });

  app.put("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      const parseResult = insertMemeTemplateSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid template data", errors: parseResult.error.errors });
      }
      const template = await storage.updateMemeTemplate(id, parseResult.data);
      if (template) {
        res.json(template);
      } else {
        res.status(404).json({ message: "Template not found" });
      }
    } catch (error) {
      console.error("Error updating template:", error);
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
      if (success) {
        res.json({ message: "Template deleted successfully" });
      } else {
        res.status(404).json({ message: "Template not found" });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template", error: String(error) });
    }
  });

  // Memes
  app.get("/api/memes", async (req: Request, res: Response) => {
    try {
      // For simplicity, assume user ID 1
      const userId = 1;
      const memes = await storage.getSavedMemes(userId);
      res.json(memes);
    } catch (error) {
      console.error("Error fetching memes:", error);
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
      if (meme) {
        res.json(meme);
      } else {
        res.status(404).json({ message: "Meme not found" });
      }
    } catch (error) {
      console.error("Error fetching meme:", error);
      res.status(500).json({ message: "Failed to fetch meme", error: String(error) });
    }
  });

  app.post("/api/memes", async (req: Request, res: Response) => {
    try {
      const parseResult = insertSavedMemeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid meme data", errors: parseResult.error.errors });
      }
      const meme = await storage.createSavedMeme(parseResult.data);
      res.status(201).json(meme);
    } catch (error) {
      console.error("Error creating meme:", error);
      res.status(500).json({ message: "Failed to create meme", error: String(error) });
    }
  });

  app.put("/api/memes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meme ID" });
      }
      const parseResult = insertSavedMemeSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid meme data", errors: parseResult.error.errors });
      }
      const meme = await storage.updateSavedMeme(id, parseResult.data);
      if (meme) {
        res.json(meme);
      } else {
        res.status(404).json({ message: "Meme not found" });
      }
    } catch (error) {
      console.error("Error updating meme:", error);
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
      if (success) {
        res.json({ message: "Meme deleted successfully" });
      } else {
        res.status(404).json({ message: "Meme not found" });
      }
    } catch (error) {
      console.error("Error deleting meme:", error);
      res.status(500).json({ message: "Failed to delete meme", error: String(error) });
    }
  });

  // Collages
  app.get("/api/collages", async (req: Request, res: Response) => {
    try {
      // For simplicity, assume user ID 1
      const userId = 1;
      const collages = await storage.getCollages(userId);
      res.json(collages);
    } catch (error) {
      console.error("Error fetching collages:", error);
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
      if (collage) {
        res.json(collage);
      } else {
        res.status(404).json({ message: "Collage not found" });
      }
    } catch (error) {
      console.error("Error fetching collage:", error);
      res.status(500).json({ message: "Failed to fetch collage", error: String(error) });
    }
  });

  app.post("/api/collages", async (req: Request, res: Response) => {
    try {
      const parseResult = insertCollageSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid collage data", errors: parseResult.error.errors });
      }
      const collage = await storage.createCollage(parseResult.data);
      res.status(201).json(collage);
    } catch (error) {
      console.error("Error creating collage:", error);
      res.status(500).json({ message: "Failed to create collage", error: String(error) });
    }
  });

  app.put("/api/collages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collage ID" });
      }
      const parseResult = insertCollageSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid collage data", errors: parseResult.error.errors });
      }
      const collage = await storage.updateCollage(id, parseResult.data);
      if (collage) {
        res.json(collage);
      } else {
        res.status(404).json({ message: "Collage not found" });
      }
    } catch (error) {
      console.error("Error updating collage:", error);
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
      if (success) {
        res.json({ message: "Collage deleted successfully" });
      } else {
        res.status(404).json({ message: "Collage not found" });
      }
    } catch (error) {
      console.error("Error deleting collage:", error);
      res.status(500).json({ message: "Failed to delete collage", error: String(error) });
    }
  });

  // Создаем директорию для временных файлов, если её нет
  if (!fs.existsSync('./temp')) {
    fs.mkdirSync('./temp', { recursive: true });
  }

  // Маршрут для получения доступных стилей
  app.get("/api/styles", (req: Request, res: Response) => {
    try {
      // Возвращаем список предопределенных стилей
      // Клиент будет использовать placeholder-styles.ts для отображения
      const styles = [
        {
          id: 'style1',
          name: 'Звёздная ночь (Ван Гог)',
          imageUrl: ''
        },
        {
          id: 'style2',
          name: 'Крик (Мунк)',
          imageUrl: ''
        },
        {
          id: 'style3',
          name: 'Композиция (Кандинский)',
          imageUrl: ''
        },
        {
          id: 'style4',
          name: 'Кубизм (Пикассо)',
          imageUrl: ''
        },
        {
          id: 'style5',
          name: 'Водяные лилии (Моне)',
          imageUrl: ''
        }
      ];
      res.json(styles);
    } catch (error) {
      console.error("Error fetching styles:", error);
      res.status(500).json({ message: "Failed to fetch styles", error: String(error) });
    }
  });

  // Маршрут для стилизации изображения с использованием Google Magenta
  app.post("/api/stylize", async (req: Request, res: Response) => {
    try {
      console.log("Получен запрос на стилизацию изображения");
      
      const { image, styleId } = req.body;
      
      if (!image) {
        console.log("Отсутствует изображение в запросе");
        return res.status(400).json({ message: "Image is required" });
      }
      
      if (!styleId) {
        console.log("Отсутствует ID стиля в запросе");
        return res.status(400).json({ message: "Style ID is required" });
      }
      
      console.log("Изображение и стиль получены. ID стиля:", styleId);

      // Генерируем временные имена файлов
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const contentPath = `./temp/content_${timestamp}_${randomString}.jpg`;
      const styleNumber = styleId.replace('style', '');
      const stylePath = `./styles/${styleNumber}.jpg`;
      const outputPath = `./temp/stylized_${timestamp}_${randomString}.jpg`;
      
      // Создаем директории при необходимости
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp', { recursive: true });
      }
      
      if (!fs.existsSync('./styles')) {
        fs.mkdirSync('./styles', { recursive: true });
      }
      
      // Проверяем существование файла стиля
      if (!fs.existsSync(stylePath)) {
        console.log(`Файл стиля не существует: ${stylePath}, создаем пустой стиль.`);
        const canvas = require('canvas');
        const { createCanvas } = canvas;
        const c = createCanvas(512, 512);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
        fs.writeFileSync(stylePath, c.toBuffer('image/jpeg', { quality: 0.95 }));
      }
      
      console.log(`Путь к файлу стиля: ${stylePath}, styleId: ${styleId}, styleNumber: ${styleNumber}`);
      
      // Сохраняем исходное изображение
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(contentPath, Buffer.from(base64Data, 'base64'));
      console.log(`Исходное изображение сохранено в ${contentPath}`);
      
      // Запускаем стилизацию через CLI-интерфейс
      console.log(`Запускаем Google Magenta стилизацию на ${contentPath}`);
      
      try {
        // Используем spawn для запуска процесса стилизации
        const stylizationPromise = new Promise<void>((resolve, reject) => {
          const magentaProcess = spawn('node', [
            'server/cli-stylize.cjs',
            contentPath,
            stylePath,
            outputPath,
            '1.0' // Сила стиля
          ]);
          
          let output = '';
          let errorOutput = '';
          
          magentaProcess.stdout.on('data', (data) => {
            const text = data.toString().trim();
            output += text;
            console.log(`Magenta: ${text}`);
          });
          
          magentaProcess.stderr.on('data', (data) => {
            const text = data.toString().trim();
            errorOutput += text;
            console.error(`Magenta error: ${text}`);
          });
          
          magentaProcess.on('close', (code) => {
            if (code === 0) {
              console.log('Стилизация успешно завершена!');
              resolve();
            } else {
              console.error(`Процесс стилизации завершился с кодом ${code}`);
              
              // Проверяем, был ли создан выходной файл несмотря на ошибку
              if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                console.log('Найден выходной файл стилизации, используем его.');
                resolve();
              } else {
                console.error('Стилизация не удалась:', errorOutput);
                reject(new Error(`Стилизация завершилась с ошибкой: ${errorOutput}`));
              }
            }
          });
          
          magentaProcess.on('error', (err) => {
            console.error('Ошибка при запуске процесса стилизации:', err);
            reject(err);
          });
        });
        
        // Ожидаем завершения процесса стилизации
        await stylizationPromise;
        
      } catch (error) {
        console.error('Ошибка при выполнении стилизации:', error);
        
        // В случае ошибки копируем исходное изображение
        console.log('Копирование исходного изображения из-за ошибки стилизации...');
        fs.copyFileSync(contentPath, outputPath);
      }
      
      // Проверяем существование выходного файла
      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ 
          message: "Не удалось создать стилизованное изображение",
          error: "Файл не был создан в процессе стилизации"
        });
      }
      
      // Читаем и отправляем стилизованное изображение
      const stylizedImage = fs.readFileSync(outputPath);
      const stylizedBase64 = `data:image/jpeg;base64,${stylizedImage.toString('base64')}`;
      
      console.log(`Отправка стилизованного изображения размером: ${stylizedImage.length} байт`);
      
      res.json({
        originalImage: image,
        styledImageUrl: stylizedBase64,
        timestamp
      });
    } catch (error) {
      console.error("Error stylizing image:", error);
      res.status(500).json({ 
        message: "Failed to stylize image", 
        error: String(error)
      });
    }
  });

  // Маршрут для удаления временных файлов
  app.delete("/api/stylize/:timestamp", (req: Request, res: Response) => {
    try {
      const timestamp = req.params.timestamp;
      
      // Читаем директорию с временными файлами
      const tempDir = './temp';
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        
        // Находим и удаляем все файлы, связанные с данным timestamp
        const relatedFiles = files.filter(file => file.includes(`_${timestamp}_`) || file.includes(`_${timestamp}.`));
        
        console.log(`Найдено ${relatedFiles.length} временных файлов для удаления`);
        
        relatedFiles.forEach(file => {
          const fullPath = `${tempDir}/${file}`;
          console.log(`Удаляем временный файл: ${fullPath}`);
          fs.unlinkSync(fullPath);
        });
      }
      
      res.json({ message: "Временные файлы успешно удалены" });
    } catch (error) {
      console.error("Ошибка при удалении временных файлов:", error);
      res.status(500).json({ message: "Не удалось удалить временные файлы", error: String(error) });
    }
  });

  return createServer(app);
}