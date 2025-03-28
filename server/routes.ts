import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMemeTemplateSchema, insertSavedMemeSchema, insertCollageSchema } from "@shared/schema";
import fetch from "node-fetch";

// Функция для применения AI-стилей к изображениям
// Так как Node.js не имеет встроенных возможностей для обработки изображений, 
// мы будем симулировать применение стилей, добавляя информацию о стиле в базу данных.
// В реальном приложении здесь будет вызов API для обработки изображения.
async function applyAiStyle(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log("Applying AI style:", styleParams);
    
    // В реальном проекте здесь был бы вызов стороннего API для обработки изображения
    // Например: OpenAI API, Google Cloud Vision API или подобных сервисов.
    
    // Для демонстрации мы просто возвращаем исходное изображение
    // и имитируем применение стиля путем добавления метаданных
    
    // Модифицируем данные о примененном стиле для отображения в UI
    const styleApplied = {
      name: styleParams.style || "custom",
      filter: styleParams.filter || null,
      overlay: styleParams.overlay || null,
      timestamp: new Date().toISOString()
    };
    
    // Если бы это был реальный проект с C# на бэкенде, здесь бы использовалась 
    // библиотека System.Drawing или SkiaSharp для обработки изображений
    
    console.log("Style applied:", styleApplied);
    
    // Так как это всего лишь имитация, мы просто добавляем небольшую задержку
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Возвращаем исходное изображение (в реальном приложении здесь был бы стилизованный вариант)
    return imageBase64;
  } catch (error) {
    console.error('Error in applyAiStyle:', error);
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
