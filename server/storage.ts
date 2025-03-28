import { 
  users, type User, type InsertUser,
  memeTemplates, type MemeTemplate, type InsertMemeTemplate,
  savedMemes, type SavedMeme, type InsertSavedMeme,
  collages, type Collage, type InsertCollage,
  aiStyles, type AiStyle, type InsertAiStyle
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

  // AI Style operations
  getAiStyles(): Promise<AiStyle[]>;
  getAiStyle(id: number): Promise<AiStyle | undefined>;
  createAiStyle(style: InsertAiStyle): Promise<AiStyle>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private memeTemplates: Map<number, MemeTemplate>;
  private savedMemes: Map<number, SavedMeme>;
  private collages: Map<number, Collage>;
  private aiStyles: Map<number, AiStyle>;
  
  private userIdCounter: number;
  private templateIdCounter: number;
  private memeIdCounter: number;
  private collageIdCounter: number;
  private styleIdCounter: number;

  constructor() {
    this.users = new Map();
    this.memeTemplates = new Map();
    this.savedMemes = new Map();
    this.collages = new Map();
    this.aiStyles = new Map();
    
    this.userIdCounter = 1;
    this.templateIdCounter = 1;
    this.memeIdCounter = 1;
    this.collageIdCounter = 1;
    this.styleIdCounter = 1;

    // Add default AI styles
    this.initializeAiStyles();
    
    // Add default meme templates
    this.initializeMemeTemplates();
  }

  private initializeAiStyles() {
    const defaultStyles: InsertAiStyle[] = [
      {
        name: "Масляная живопись",
        description: "Преобразуйте изображение в стиле масляной живописи",
        previewUrl: "/api/styles/preview/oil-painting",
        apiParams: { 
          aiModel: "Масляная живопись",
          styleIntensity: 1.2
        }
      },
      {
        name: "Набросок карандашом",
        description: "Преобразуйте изображение в черно-белый набросок карандашом",
        previewUrl: "/api/styles/preview/pencil-sketch",
        apiParams: { 
          aiModel: "Контурный рисунок",
          styleIntensity: 1.0
        }
      },
      {
        name: "Акварель",
        description: "Преобразуйте изображение в стиле акварельной живописи",
        previewUrl: "/api/styles/preview/watercolor",
        apiParams: { 
          aiModel: "Акварель",
          styleIntensity: 1.2
        }
      },
      {
        name: "Тушь",
        description: "Преобразуйте изображение в стиле рисунка тушью",
        previewUrl: "/api/styles/preview/ink",
        apiParams: { 
          aiModel: "Контурный рисунок",
          styleIntensity: 1.5
        }
      },
      {
        name: "Винтаж",
        description: "Преобразуйте изображение в стиле старой фотографии",
        previewUrl: "/api/styles/preview/vintage",
        apiParams: { 
          aiModel: "Винтаж",
          styleIntensity: 1.2
        }
      },
      {
        name: "Пиксель-арт",
        description: "Преобразуйте изображение в стиле пиксельной графики",
        previewUrl: "/api/styles/preview/pixel-art",
        apiParams: { 
          aiModel: "Пиксель-арт",
          styleIntensity: 1.0
        }
      }
    ];

    defaultStyles.forEach(style => this.createAiStyle(style));
  }

  private initializeMemeTemplates() {
    const defaultTemplates: InsertMemeTemplate[] = [
      {
        name: "Отвлекшийся парень",
        imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
        isPublic: true,
        textAreas: [
          { x: 300, y: 100, width: 160, height: 70, defaultText: "Новая вещь" },
          { x: 160, y: 100, width: 160, height: 70, defaultText: "Я" },
          { x: 20, y: 100, width: 160, height: 70, defaultText: "Текущая вещь" }
        ]
      },
      {
        name: "Мем с Дрейком",
        imageUrl: "https://i.imgflip.com/30b1gx.jpg",
        isPublic: true,
        textAreas: [
          { x: 320, y: 10, width: 300, height: 300, defaultText: "Плохой вариант" },
          { x: 320, y: 400, width: 300, height: 300, defaultText: "Хороший вариант" }
        ]
      },
      {
        name: "Две кнопки",
        imageUrl: "https://i.imgflip.com/1g8my4.jpg",
        isPublic: true,
        textAreas: [
          { x: 150, y: 90, width: 140, height: 90, defaultText: "Кнопка 1" },
          { x: 325, y: 90, width: 140, height: 90, defaultText: "Кнопка 2" },
          { x: 240, y: 450, width: 200, height: 100, defaultText: "Потеющий человек" }
        ]
      },
      {
        name: "Уходящий парень",
        imageUrl: "https://i.imgflip.com/1jwhww.jpg",
        isPublic: true,
        textAreas: [
          { x: 240, y: 50, width: 200, height: 100, defaultText: "Уходящая девушка" },
          { x: 400, y: 300, width: 200, height: 100, defaultText: "Новая девушка" }
        ]
      },
      {
        name: "Жалующаяся мама",
        imageUrl: "https://i.imgflip.com/4acd7j.png",
        isPublic: true,
        textAreas: [
          { x: 160, y: 70, width: 300, height: 100, defaultText: "Жалоба 1" },
          { x: 160, y: 270, width: 300, height: 100, defaultText: "Жалоба 2" },
          { x: 160, y: 470, width: 300, height: 100, defaultText: "Жалоба 3" }
        ]
      },
      {
        name: "Один дома",
        imageUrl: "https://i.imgflip.com/1otk96.jpg",
        isPublic: true,
        textAreas: [
          { x: 350, y: 220, width: 300, height: 100, defaultText: "Текст мема" }
        ]
      },
      {
        name: "Нервничающий попугай",
        imageUrl: "https://i.imgflip.com/2o83uh.png",
        isPublic: true,
        textAreas: [
          { x: 160, y: 100, width: 250, height: 100, defaultText: "Волнующая ситуация" }
        ]
      },
      {
        name: "Умный чернокожий",
        imageUrl: "https://i.imgflip.com/1h7in3.jpg",
        isPublic: true,
        textAreas: [
          { x: 250, y: 130, width: 300, height: 100, defaultText: "Умная мысль" }
        ]
      },
      {
        name: "Разговор с байкером",
        imageUrl: "https://i.imgflip.com/4t0m5.jpg",
        isPublic: true,
        textAreas: [
          { x: 280, y: 50, width: 250, height: 100, defaultText: "Первая фраза" },
          { x: 280, y: 220, width: 250, height: 100, defaultText: "Вторая фраза" }
        ]
      },
      {
        name: "Ужасная Реализация",
        imageUrl: "https://i.imgflip.com/1e7ql7.jpg",
        isPublic: true,
        textAreas: [
          { x: 300, y: 180, width: 260, height: 100, defaultText: "Момент осознания" }
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
    const newTemplate: MemeTemplate = { ...template, id, createdAt: now };
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
    const newMeme: SavedMeme = { ...meme, id, createdAt: now };
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
    const newCollage: Collage = { ...collage, id, createdAt: now };
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

  // AI Style operations
  async getAiStyles(): Promise<AiStyle[]> {
    return Array.from(this.aiStyles.values());
  }

  async getAiStyle(id: number): Promise<AiStyle | undefined> {
    return this.aiStyles.get(id);
  }

  async createAiStyle(style: InsertAiStyle): Promise<AiStyle> {
    const id = this.styleIdCounter++;
    const newStyle: AiStyle = { ...style, id };
    this.aiStyles.set(id, newStyle);
    return newStyle;
  }
}

export const storage = new MemStorage();
