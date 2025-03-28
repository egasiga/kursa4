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
        name: "Comic Book",
        description: "Transform your image into a comic book style illustration",
        previewUrl: "/api/styles/preview/comic",
        apiParams: { style: "comic" }
      },
      {
        name: "Oil Painting",
        description: "Make your meme look like an oil painting",
        previewUrl: "/api/styles/preview/oil-painting",
        apiParams: { style: "oil-painting" }
      },
      {
        name: "Pixel Art",
        description: "Convert your image to retro pixel art style",
        previewUrl: "/api/styles/preview/pixel",
        apiParams: { style: "pixel-art" }
      },
      {
        name: "Vaporwave",
        description: "Apply vaporwave aesthetics to your image",
        previewUrl: "/api/styles/preview/vaporwave",
        apiParams: { style: "vaporwave" }
      },
      {
        name: "Watercolor",
        description: "Transform your image into a watercolor painting",
        previewUrl: "/api/styles/preview/watercolor",
        apiParams: { style: "watercolor" }
      }
    ];

    defaultStyles.forEach(style => this.createAiStyle(style));
  }

  private initializeMemeTemplates() {
    const defaultTemplates: InsertMemeTemplate[] = [
      {
        name: "Drake Hotline Bling",
        imageUrl: "https://i.imgflip.com/30b1gx.jpg",
        isPublic: true,
        textAreas: [
          { x: 320, y: 10, width: 300, height: 300, defaultText: "Bad option" },
          { x: 320, y: 400, width: 300, height: 300, defaultText: "Good option" }
        ]
      },
      {
        name: "Two Buttons",
        imageUrl: "https://i.imgflip.com/1g8my4.jpg",
        isPublic: true,
        textAreas: [
          { x: 150, y: 90, width: 140, height: 90, defaultText: "Button 1" },
          { x: 325, y: 90, width: 140, height: 90, defaultText: "Button 2" },
          { x: 240, y: 450, width: 200, height: 100, defaultText: "Sweating person" }
        ]
      },
      {
        name: "Distracted Boyfriend",
        imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
        isPublic: true,
        textAreas: [
          { x: 300, y: 100, width: 160, height: 70, defaultText: "New thing" },
          { x: 160, y: 100, width: 160, height: 70, defaultText: "Me" },
          { x: 20, y: 100, width: 160, height: 70, defaultText: "Current thing" }
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
