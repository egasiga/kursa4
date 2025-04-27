import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MemeTemplateSelector from "@/components/meme-template-selector";
import TextEditor from "@/components/text-editor";
import SocialShare from "@/components/social-share";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Save, Upload, RotateCcw, Plus, Wand2 } from "lucide-react";
import { SavedMeme } from "@shared/schema";

// Шаблоны мемов
const MEME_TEMPLATES = [
  { 
    id: "template1",
    name: "Exit 12",
    imageUrl: "/assets/meme-templates/1.jpg",
    description: "Мем со съездом с трассы",
  },
  { 
    id: "template2",
    name: "Expanding Brain",
    imageUrl: "/assets/meme-templates/2.jpg",
    description: "Мем с развивающимся интеллектом",
  },
  { 
    id: "template3",
    name: "Two Paths",
    imageUrl: "/assets/meme-templates/3.jpg", 
    description: "Мем с выбором пути",
  },
  { 
    id: "template4",
    name: "Megamind",
    imageUrl: "/assets/meme-templates/4.png",
    description: "Мем с персонажем Мегамозг",
  },
  { 
    id: "template5",
    name: "Bus Seats",
    imageUrl: "/assets/meme-templates/5.jpg",
    description: "Мем с разными сторонами автобуса",
  },
  { 
    id: "template6",
    name: "Red Button",
    imageUrl: "/assets/meme-templates/6.jpg",
    description: "Мем с красной кнопкой",
  },
  { 
    id: "template7",
    name: "Group Photo",
    imageUrl: "/assets/meme-templates/7.jpg",
    description: "Мем с групповым фото",
  },
];

// Стили (образцы известных художников)
const STYLES = [
  {
    id: "style1",
    name: "Звездная ночь (Ван Гог)",
    imageUrl: "/assets/1.jpg",
    description: "Яркий экспрессионизм, завихрения, насыщенные цвета",
  },
  {
    id: "style2",
    name: "Крик (Мунк)",
    imageUrl: "/assets/2.jpg",
    description: "Искаженные линии, тревожные цвета, эмоциональное напряжение",
  },
  {
    id: "style3",
    name: "Композиция (Кандинский)",
    imageUrl: "/assets/3.jpg",
    description: "Абстрактные формы, геометрические линии, яркие цвета",
  },
  {
    id: "style4",
    name: "Портрет (Пикассо)",
    imageUrl: "/assets/4.jpg",
    description: "Кубизм, асимметрия, фрагментированные формы",
  },
  {
    id: "style5",
    name: "Водяные лилии (Моне)",
    imageUrl: "/assets/5.jpg",
    description: "Импрессионизм, мягкие цвета, размытые формы",
  },
];

export default function MemeGenerator() {
  const { toast } = useToast();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Основные состояния
  const [selectedTemplate, setSelectedTemplate] = useState<typeof MEME_TEMPLATES[0] | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<Array<{
    id: string;
    text: string;
    style: {
      fontFamily: string;
      fontSize: number;
      color: string;
      strokeColor: string;
      strokeWidth: number;
      align: string;
    };
    position: {
      x: number;
      y: number;
    };
  }>>([]);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [memeName, setMemeName] = useState("Мой крутой мем");
  const [selectedStyle, setSelectedStyle] = useState<typeof STYLES[0] | null>(null);
  const [isStylizing, setIsStylizing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isStyleApplied, setIsStyleApplied] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  
  // Save meme mutation
  const saveMutation = useMutation({
    mutationFn: async (memeData: any) => {
      const response = await apiRequest("POST", "/api/memes", memeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      toast({
        title: "Мем сохранен",
        description: "Ваш мем был успешно сохранен в коллекции.",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка при сохранении",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Загрузка пользовательского изображения
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === "string") {
        setCustomImage(e.target.result);
        setSelectedTemplate(null);
        setIsStyleApplied(false);
        setOriginalImage(e.target.result);
      }
    };
    
    reader.readAsDataURL(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Выбор шаблона мема
  const handleTemplateSelect = (template: typeof MEME_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setCustomImage(null);
    setIsStyleApplied(false);
    setOriginalImage(null);
  };

  // Добавление текста
  const handleAddText = () => {
    if (!canvasRef) return;
    
    const newId = `text-${Date.now()}`;
    setTextContent((prev) => [
      ...prev,
      {
        id: newId,
        text: "Введите текст",
        style: {
          fontFamily: "Impact",
          fontSize: 36,
          color: "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 4,
          align: "center",
        },
        position: {
          x: canvasRef.width / 2,
          y: canvasRef.height / 2,
        },
      },
    ]);
    setShowTextEditor(true);
  };

  // Изменение текста
  const handleTextChange = (id: string, text: string) => {
    setTextContent((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  // Изменение стиля текста
  const handleTextStyleChange = (id: string, styleKey: string, value: any) => {
    setTextContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              style: {
                ...item.style,
                [styleKey]: value,
              },
            }
          : item
      )
    );
  };

  // Изменение позиции текста
  const handleTextPositionChange = (id: string, x: number, y: number) => {
    setTextContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              position: { x, y },
            }
          : item
      )
    );
  };

  // Удаление текста
  const handleRemoveText = (id: string) => {
    setTextContent((prev) => prev.filter((item) => item.id !== id));
  };

  // Изменение фильтров
  const handleFilterChange = (filterType: keyof typeof filters, value: number) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  };

  // Отрисовка текста на canvas
  const renderTextOnCanvas = () => {
    if (!canvasRef) return;
    
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;
    
    textContent.forEach((item) => {
      ctx.font = `${item.style.fontSize}px ${item.style.fontFamily}`;
      ctx.textAlign = item.style.align as CanvasTextAlign;
      
      // Обводка текста
      ctx.lineWidth = item.style.strokeWidth;
      ctx.strokeStyle = item.style.strokeColor;
      ctx.strokeText(
        item.text,
        item.position.x,
        item.position.y
      );
      
      // Заливка текста
      ctx.fillStyle = item.style.color;
      ctx.fillText(
        item.text,
        item.position.x,
        item.position.y
      );
    });
  };

  // Выбор стиля для AI-стилизации
  const handleStyleSelect = (style: typeof STYLES[0]) => {
    setSelectedStyle(style);
  };

  // Применение стиля с помощью API
  const handleApplyStyle = async () => {
    if (!canvasRef || !selectedStyle) return;
    
    try {
      setIsStylizing(true);
      
      // Сохраняем оригинальное изображение, если еще не сохранено
      if (!originalImage) {
        setOriginalImage(canvasRef.toDataURL("image/jpeg"));
      }
      
      // Получаем данные изображения
      const imageData = canvasRef.toDataURL("image/jpeg", 0.8);
      
      // Отправляем запрос на стилизацию
      const result = await apiRequest("POST", "/api/stylize", {
        image: imageData,
        styleId: selectedStyle.id,
      });
      
      if (result && result.styledImageUrl) {
        if (selectedTemplate) {
          // Если выбран шаблон, обновляем его с учетом стилизации
          const styledTemplate = {
            ...selectedTemplate,
            imageUrl: result.styledImageUrl,
          };
          setSelectedTemplate(styledTemplate);
        } else if (customImage) {
          // Если загружено пользовательское изображение
          setCustomImage(result.styledImageUrl);
        }
        
        setIsStyleApplied(true);
        
        toast({
          title: "Стиль применен",
          description: `Изображение стилизовано в стиле "${selectedStyle.name}"`,
        });
      } else {
        throw new Error("Не удалось получить стилизованное изображение");
      }
    } catch (error) {
      console.error("Ошибка при стилизации:", error);
      toast({
        title: "Ошибка стилизации",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsStylizing(false);
    }
  };

  // Отмена стилизации
  const handleRevertStyle = () => {
    if (!originalImage) return;
    
    if (selectedTemplate) {
      // Если используется шаблон, восстанавливаем его оригинальный URL
      const originalTemplate = MEME_TEMPLATES.find(t => t.id === selectedTemplate.id);
      if (originalTemplate) {
        setSelectedTemplate(originalTemplate);
      }
    } else if (customImage) {
      // Если загружено пользовательское изображение
      setCustomImage(originalImage);
    }
    
    setIsStyleApplied(false);
    
    toast({
      title: "Стиль отменен",
      description: "Изображение возвращено к оригиналу",
    });
  };

  // Сохранение мема
  const handleSaveMeme = () => {
    if (!canvasRef) return;
    
    const imageData = canvasRef.toDataURL("image/png");
    
    const memeData: Partial<SavedMeme> = {
      name: memeName,
      imageUrl: imageData,
      userId: 1, // Используем дефолтный userId
      templateId: selectedTemplate?.id || null,
      textContent,
      appliedFilters: [filters],
      aiStyle: isStyleApplied && selectedStyle ? selectedStyle.id : null,
    };
    
    saveMutation.mutate(memeData);
  };

  // Скачивание мема
  const handleDownloadMeme = () => {
    if (!canvasRef) return;
    
    const link = document.createElement("a");
    link.download = `${memeName.replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Мем скачан",
      description: "Ваш мем успешно скачан",
    });
  };

  const getCurrentMemeImage = () => {
    if (selectedTemplate) {
      return selectedTemplate.imageUrl;
    } else if (customImage) {
      return customImage;
    }
    return null;
  };

  // Определяем, есть ли у нас активный шаблон
  const hasActiveTemplate = selectedTemplate !== null || customImage !== null;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Генератор Мемов</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[500px]">
              {hasActiveTemplate ? (
                // Отображаем выбранный шаблон или пользовательское изображение
                <MemeTemplateSelector
                  template={{
                    id: selectedTemplate?.id || "custom",
                    name: selectedTemplate?.name || "Пользовательский шаблон",
                    imageUrl: getCurrentMemeImage() as string,
                  }}
                  filters={filters}
                  textContent={textContent}
                  onCanvasReady={setCanvasRef}
                  onTextRender={renderTextOnCanvas}
                  onTextPositionUpdate={handleTextPositionChange}
                />
              ) : (
                // Если шаблон не выбран, показываем инструкции
                <div className="text-center p-8 bg-slate-100 rounded-lg w-full">
                  <h3 className="text-xl font-medium mb-4">Выберите шаблон или загрузите изображение</h3>
                  <p className="mb-4 text-muted-foreground">
                    Для начала работы выберите один из шаблонов или загрузите собственное изображение
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Загрузить изображение
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {hasActiveTemplate && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Загрузить свое изображение
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                onClick={handleAddText}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить текст
              </Button>
              <Button
                onClick={handleSaveMeme}
                disabled={saveMutation.isPending}
                variant="outline"
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Сохранить мем
              </Button>
              <Button
                onClick={handleDownloadMeme}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Скачать мем
              </Button>
              <SocialShare canvasRef={canvasRef} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {hasActiveTemplate ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="meme-name">Название мема</Label>
                      <Input
                        id="meme-name"
                        value={memeName}
                        onChange={(e) => setMemeName(e.target.value)}
                        placeholder="Введите название для вашего мема"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Tabs defaultValue={showTextEditor ? "text" : "templates"}>
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger 
                        value="templates" 
                        onClick={() => setShowTextEditor(false)}
                      >
                        Шаблоны
                      </TabsTrigger>
                      <TabsTrigger 
                        value="text" 
                        onClick={() => setShowTextEditor(true)}
                      >
                        Текст
                      </TabsTrigger>
                      <TabsTrigger 
                        value="filters" 
                        onClick={() => setShowTextEditor(false)}
                      >
                        Фильтры
                      </TabsTrigger>
                    </TabsList>
                    <div className="p-6">
                      <TabsContent value="templates" className="m-0">
                        <div className="grid grid-cols-2 gap-3">
                          {MEME_TEMPLATES.map((template) => (
                            <div
                              key={template.id}
                              className={`cursor-pointer rounded-md overflow-hidden border hover:border-primary transition-colors ${
                                selectedTemplate?.id === template.id ? "ring-2 ring-primary" : ""
                              }`}
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <div className="aspect-square relative">
                                <img
                                  src={template.imageUrl}
                                  alt={template.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium truncate">{template.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="text" className="m-0">
                        {textContent.length > 0 ? (
                          <div className="space-y-4">
                            {textContent.map((item, index) => (
                              <TextEditor
                                key={item.id}
                                areaIndex={index}
                                textId={item.id}
                                label={`Текст ${index + 1}`}
                                value={item.text}
                                style={{
                                  ...item.style,
                                  position: item.position,
                                }}
                                onChange={(value) => handleTextChange(item.id, value)}
                                onStyleChange={(styleKey, value) => handleTextStyleChange(item.id, styleKey, value)}
                                onPositionChange={(x, y) => handleTextPositionChange(item.id, x, y)}
                                onRemove={() => handleRemoveText(item.id)}
                              />
                            ))}
                            <Button
                              onClick={handleAddText}
                              variant="outline"
                              className="w-full mt-2"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Добавить текст
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="mb-4 text-muted-foreground">Пока нет текстовых элементов</p>
                            <Button onClick={handleAddText} variant="outline">
                              Добавить текст
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="filters" className="m-0">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Яркость ({filters.brightness}%)</Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleResetFilters}
                                className="h-6 gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Сбросить
                              </Button>
                            </div>
                            <Slider
                              value={[filters.brightness]}
                              min={0}
                              max={200}
                              step={1}
                              onValueChange={(values) => handleFilterChange("brightness", values[0])}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Контраст ({filters.contrast}%)</Label>
                            <Slider
                              value={[filters.contrast]}
                              min={0}
                              max={200}
                              step={1}
                              onValueChange={(values) => handleFilterChange("contrast", values[0])}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Насыщенность ({filters.saturation}%)</Label>
                            <Slider
                              value={[filters.saturation]}
                              min={0}
                              max={200}
                              step={1}
                              onValueChange={(values) => handleFilterChange("saturation", values[0])}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Художественная стилизация</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {STYLES.map((style) => (
                        <div
                          key={style.id}
                          className={`cursor-pointer rounded-md overflow-hidden border hover:border-primary transition-colors ${
                            selectedStyle?.id === style.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => handleStyleSelect(style)}
                        >
                          <div className="aspect-square relative">
                            <img
                              src={style.imageUrl}
                              alt={style.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{style.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {selectedStyle && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {selectedStyle.description}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleApplyStyle}
                            disabled={isStylizing || !selectedStyle}
                            className="flex-1 gap-2"
                          >
                            <Wand2 className="w-4 h-4" />
                            {isStylizing ? "Применение..." : "Применить стиль"}
                          </Button>
                          {isStyleApplied && (
                            <Button
                              variant="outline"
                              onClick={handleRevertStyle}
                              className="flex-1"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Отменить стиль
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Выберите шаблон для начала</h3>
                <div className="grid grid-cols-2 gap-3">
                  {MEME_TEMPLATES.slice(0, 6).map((template) => (
                    <div
                      key={template.id}
                      className="cursor-pointer rounded-md overflow-hidden border hover:border-primary transition-colors"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={template.imageUrl}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{template.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Или загрузите свое изображение
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}