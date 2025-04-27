import { 
  users, type User, type InsertUser,
  memeTemplates, type MemeTemplate, type InsertMemeTemplate,
  savedMemes, type SavedMeme, type InsertSavedMeme,
  collages, type Collage, type InsertCollage
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Meme template operations
  getMemeTemplates(): Promise<MemeTemplate[]>;
  getMemeTemplate(id: number): Promise<MemeTemplate | undefined>;
  getMemeTemplatesByUser(userId: number): Promise<MemeTemplate[]>;
  createMemeTemplate(template: InsertMemeTemplate): Promise<MemeTemplate>;
  updateMemeTemplate(id: number, template: Partial<InsertMemeTemplate>): Promise<MemeTemplate | undefined>;
  deleteMemeTemplate(id: number): Promise<boolean>;

  // Saved meme operations
  getSavedMemes(userId: number): Promise<SavedMeme[]>;
  getSavedMeme(id: number): Promise<SavedMeme | undefined>;
  createSavedMeme(meme: InsertSavedMeme): Promise<SavedMeme>;
  updateSavedMeme(id: number, meme: Partial<InsertSavedMeme>): Promise<SavedMeme | undefined>;
  deleteSavedMeme(id: number): Promise<boolean>;

  // Collage operations
  getCollages(userId: number): Promise<Collage[]>;
  getCollage(id: number): Promise<Collage | undefined>;
  createCollage(collage: InsertCollage): Promise<Collage>;
  updateCollage(id: number, collage: Partial<InsertCollage>): Promise<Collage | undefined>;
  deleteCollage(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private memeTemplates: Map<number, MemeTemplate>;
  private savedMemes: Map<number, SavedMeme>;
  private collages: Map<number, Collage>;
  
  private userIdCounter: number;
  private templateIdCounter: number;
  private memeIdCounter: number;
  private collageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.memeTemplates = new Map();
    this.savedMemes = new Map();
    this.collages = new Map();
    
    this.userIdCounter = 1;
    this.templateIdCounter = 1;
    this.memeIdCounter = 1;
    this.collageIdCounter = 1;
    
    // Add default meme templates
    this.initializeMemeTemplates();
  }

  private initializeMemeTemplates() {
    // Устанавливаем базовый URL для изображений (локальные изображения вместо imgflip)
    const baseImageUrl = "/images/meme-templates/";

    const defaultTemplates: InsertMemeTemplate[] = [
      {
        name: "Шаблон изображения 1",
        imageUrl: `${baseImageUrl}1.jpg`,
        isPublic: true,
        textAreas: [
          { x: 400, y: 200, width: 300, height: 100, defaultText: "Верхний текст" },
          { x: 400, y: 500, width: 300, height: 100, defaultText: "Нижний текст" }
        ]
      },
      {
        name: "Шаблон изображения 2",
        imageUrl: `${baseImageUrl}2.jpg`,
        isPublic: true,
        textAreas: [
          { x: 350, y: 150, width: 300, height: 100, defaultText: "Верхний текст" },
          { x: 350, y: 350, width: 300, height: 100, defaultText: "Нижний текст" }
        ]
      },
      {
        name: "Шаблон изображения 3",
        imageUrl: `${baseImageUrl}3.jpg`,
        isPublic: true,
        textAreas: [
          { x: 400, y: 200, width: 350, height: 100, defaultText: "Основной текст" },
          { x: 400, y: 400, width: 350, height: 100, defaultText: "Дополнительный текст" }
        ]
      },
      {
        name: "Шаблон изображения 4",
        imageUrl: `${baseImageUrl}4.jpg`,
        isPublic: true,
        textAreas: [
          { x: 350, y: 150, width: 300, height: 100, defaultText: "Верхний текст" },
          { x: 350, y: 350, width: 300, height: 100, defaultText: "Нижний текст" }
        ]
      },
      {
        name: "Шаблон изображения 5",
        imageUrl: `${baseImageUrl}5.jpg`,
        isPublic: true,
        textAreas: [
          { x: 300, y: 100, width: 280, height: 80, defaultText: "Текст 1" },
          { x: 300, y: 200, width: 280, height: 80, defaultText: "Текст 2" },
          { x: 300, y: 300, width: 280, height: 80, defaultText: "Текст 3" }
        ]
      }
    ];

    defaultTemplates.forEach(template => this.createMemeTemplate(template));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Meme template operations
  async getMemeTemplates(): Promise<MemeTemplate[]> {
    return Array.from(this.memeTemplates.values()).filter(
      template => template.isPublic
    );
  }

  async getMemeTemplate(id: number): Promise<MemeTemplate | undefined> {
    return this.memeTemplates.get(id);
  }

  async getMemeTemplatesByUser(userId: number): Promise<MemeTemplate[]> {
    return Array.from(this.memeTemplates.values()).filter(
      template => template.userId === userId || template.isPublic
    );
  }

  async createMemeTemplate(template: InsertMemeTemplate): Promise<MemeTemplate> {
    const id = this.templateIdCounter++;
    const now = new Date();
    const newTemplate: MemeTemplate = { 
      ...template, 
      id, 
      createdAt: now,
      userId: template.userId ?? null,
      isPublic: template.isPublic ?? null,
      textAreas: template.textAreas ?? {}
    };
    this.memeTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateMemeTemplate(id: number, template: Partial<InsertMemeTemplate>): Promise<MemeTemplate | undefined> {
    const existingTemplate = this.memeTemplates.get(id);
    if (!existingTemplate) return undefined;

    const updatedTemplate = { ...existingTemplate, ...template };
    this.memeTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteMemeTemplate(id: number): Promise<boolean> {
    return this.memeTemplates.delete(id);
  }

  // Saved meme operations
  async getSavedMemes(userId: number): Promise<SavedMeme[]> {
    return Array.from(this.savedMemes.values()).filter(
      meme => meme.userId === userId
    );
  }

  async getSavedMeme(id: number): Promise<SavedMeme | undefined> {
    return this.savedMemes.get(id);
  }

  async createSavedMeme(meme: InsertSavedMeme): Promise<SavedMeme> {
    const id = this.memeIdCounter++;
    const now = new Date();
    const newMeme: SavedMeme = { 
      ...meme, 
      id, 
      createdAt: now,
      userId: meme.userId ?? null,
      templateId: meme.templateId ?? null,
      textContent: meme.textContent ?? {},
      appliedFilters: meme.appliedFilters ?? {},
      aiStyle: meme.aiStyle ?? null
    };
    this.savedMemes.set(id, newMeme);
    return newMeme;
  }

  async updateSavedMeme(id: number, meme: Partial<InsertSavedMeme>): Promise<SavedMeme | undefined> {
    const existingMeme = this.savedMemes.get(id);
    if (!existingMeme) return undefined;

    const updatedMeme = { ...existingMeme, ...meme };
    this.savedMemes.set(id, updatedMeme);
    return updatedMeme;
  }

  async deleteSavedMeme(id: number): Promise<boolean> {
    return this.savedMemes.delete(id);
  }

  // Collage operations
  async getCollages(userId: number): Promise<Collage[]> {
    return Array.from(this.collages.values()).filter(
      collage => collage.userId === userId
    );
  }

  async getCollage(id: number): Promise<Collage | undefined> {
    return this.collages.get(id);
  }

  async createCollage(collage: InsertCollage): Promise<Collage> {
    const id = this.collageIdCounter++;
    const now = new Date();
    const newCollage: Collage = { 
      ...collage, 
      id, 
      createdAt: now,
      userId: collage.userId ?? null,
      textContent: collage.textContent ?? {},
      appliedFilters: collage.appliedFilters ?? {},
      aiStyle: collage.aiStyle ?? null,
      sourceImages: collage.sourceImages ?? {}
    };
    this.collages.set(id, newCollage);
    return newCollage;
  }

  async updateCollage(id: number, collage: Partial<InsertCollage>): Promise<Collage | undefined> {
    const existingCollage = this.collages.get(id);
    if (!existingCollage) return undefined;

    const updatedCollage = { ...existingCollage, ...collage };
    this.collages.set(id, updatedCollage);
    return updatedCollage;
  }

  async deleteCollage(id: number): Promise<boolean> {
    return this.collages.delete(id);
  }


}

export const storage = new MemStorage();
