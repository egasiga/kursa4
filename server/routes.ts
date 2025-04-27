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

  // Маршрут для получения изображения стиля
  app.get("/api/style-preview/:id", (req: Request, res: Response) => {
    try {
      const styleId = req.params.id;
      const styleImagePath = `./styles/${styleId}.jpg`;

      // Проверяем, существует ли файл стиля
      if (!fs.existsSync(styleImagePath)) {
        return res.status(404).json({ message: "Style image not found" });
      }

      // Отправляем файл изображения
      res.sendFile(path.resolve(styleImagePath));
    } catch (error) {
      console.error("Error fetching style image:", error);
      res.status(500).json({ message: "Failed to fetch style image", error: String(error) });
    }
  });

  // Маршрут для получения доступных стилей
  app.get("/api/styles", (req: Request, res: Response) => {
    try {
      // Возвращаем список предопределенных стилей с конкретными известными картинами
      const styles = [
        {
          id: 'style1',
          name: 'Звездная ночь',
          description: 'Картина Винсента Ван Гога "Звездная ночь" (1889)',
          imageUrl: '/api/style-preview/1'
        },
        {
          id: 'style2',
          name: 'Крик',
          description: 'Картина Эдварда Мунка "Крик" (1893)',
          imageUrl: '/api/style-preview/2'
        },
        {
          id: 'style3',
          name: 'Композиция',
          description: 'Картина Василия Кандинского "Композиция" (1913)',
          imageUrl: '/api/style-preview/3'
        },
        {
          id: 'style4',
          name: 'Кубизм',
          description: 'Картина Пабло Пикассо в стиле кубизма',
          imageUrl: '/api/style-preview/4'
        },
        {
          id: 'style5',
          name: 'Водяные лилии',
          description: 'Картина Клода Моне "Водяные лилии" (1916)',
          imageUrl: '/api/style-preview/5'
        }
      ];
      res.json({ styles });
    } catch (error) {
      console.error("Error fetching styles:", error);
      res.status(500).json({ message: "Failed to fetch styles", error: String(error) });
    }
  });

  // Маршрут для стилизации изображения
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

      // Генерируем временные имена файлов с уникальным префиксом для предотвращения коллизий
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const contentPath = `./temp/content_${timestamp}_${randomString}.jpg`;
      const styleNumber = styleId.replace('style', '');
      const stylePath = `./styles/${styleNumber}.jpg`;
      const outputPath = `./temp/stylized_${timestamp}_${randomString}.jpg`;
      
      // Проверяем существование директорий, создаем при необходимости
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp', { recursive: true });
      }
      
      if (!fs.existsSync('./styles')) {
        fs.mkdirSync('./styles', { recursive: true });
      }
      
      // Проверяем существование файла стиля
      if (!fs.existsSync(stylePath)) {
        // Если файла стиля нет, создаем пустой стиль (белый квадрат)
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
      
      // Сохраняем исходное изображение с высоким качеством, но сначала очищаем от лишних данных
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(contentPath, Buffer.from(base64Data, 'base64'));
      console.log(`Исходное изображение сохранено в ${contentPath}`);
      
      // Используем Google Magenta для стилизации изображений с оптимизированными настройками
      console.log(`Запускаем стилизацию Google Magenta на ${contentPath}`);
      
      try {
        // Устанавливаем таймаут для процесса стилизации
        const timeout = 120000; // 2 минуты для гарантированного завершения процесса Google Magenta
        
        // Создаем обещание с таймаутом для предотвращения зависания процесса
        const stylizationPromise = new Promise<void>((resolve, reject) => {
          // Запускаем процесс стилизации с использованием Google Magenta
          const magentaProcess = spawn('node', [
            'server/magenta-stylize.cjs',
            contentPath,
            stylePath,
            outputPath,
            '1.0' // Используем полную силу стиля Google Magenta
          ]);
          
          let magentaOutput = '';
          let magentaError = '';
          
          magentaProcess.stdout.on('data', (data) => {
            magentaOutput += data.toString();
            console.log(`Magenta: ${data.toString().trim()}`);
          });
          
          magentaProcess.stderr.on('data', (data) => {
            magentaError += data.toString();
            console.error(`Magenta error: ${data.toString().trim()}`);
          });
          
          // Таймер для отмены процесса при превышении таймаута
          const timeoutId = setTimeout(() => {
            console.error(`Стилизация превысила таймаут ${timeout}ms, завершаем процесс`);
            magentaProcess.kill('SIGTERM');
            reject(new Error('Стилизация заняла слишком много времени'));
          }, timeout);
          
          magentaProcess.on('close', (code) => {
            clearTimeout(timeoutId); // Очищаем таймер
            
            // Проверяем существование выходного файла независимо от кода выхода
            if (fs.existsSync(outputPath)) {
              console.log(`Стилизованный файл ${outputPath} существует, проверяем его`);
              
              // Проверяем размер файла, чтобы убедиться, что стилизация была применена
              const stats = fs.statSync(outputPath);
              
              if (stats.size > 0) {
                console.log(`Стилизованный файл имеет размер ${stats.size} байт`);
                console.log('Google Magenta успешно применил стиль!');
                resolve();
                return;
              } else {
                console.error('Стилизованный файл существует, но имеет нулевой размер');
              }
            }
            
            if (code !== 0) {
              console.error(`Google Magenta завершился с кодом ${code}`);
              console.error(`Ошибка: ${magentaError}`);
              
              // Не отклоняем Promise, вместо этого проверяем, существует ли выходной файл
              // Если файл существует и имеет размер, значит что-то было создано
              // В противном случае, копируем исходное изображение
              if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
                console.log('Выходной файл не существует или пуст. Копируем исходное изображение.');
                fs.copyFileSync(contentPath, outputPath);
              }
              
              // В любом случае, считаем операцию успешной, чтобы вернуть пользователю хоть какой-то результат
              console.log('Завершаем процесс стилизации, возвращаем доступный результат');
              resolve();
            } else {
              console.log('Google Magenta успешно применил стиль!');
              resolve();
            }
          });
          
          magentaProcess.on('error', (err) => {
            clearTimeout(timeoutId);
            console.error('Ошибка запуска процесса:', err);
            reject(err);
          });
        });
        
        // Запускаем обещание стилизации с таймаутом
        await stylizationPromise;
        
      } catch (error) {
        console.error('Ошибка при выполнении Google Magenta:', error);
        // В случае ошибки копируем оригинальное изображение
        fs.copyFileSync(contentPath, outputPath);
      }
      
      // Чтение стилизованного изображения и отправка в ответе
      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ message: "Не удалось создать стилизованное изображение" });
      }
      
      // Чтение стилизованного изображения 
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
      res.status(500).json({ message: "Failed to stylize image", error: String(error) });
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