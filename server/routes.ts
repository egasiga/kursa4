import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMemeTemplateSchema, insertSavedMemeSchema, insertCollageSchema } from "@shared/schema";
import sharp from 'sharp';

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

  return createServer(app);
}