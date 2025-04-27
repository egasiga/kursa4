import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TextEditor from "@/components/text-editor";
import MemeImageEditor from "@/components/meme-image-editor";
import SocialShare from "@/components/social-share";
import { AiStyle } from "@/components/ai-style-selector";
import ImageStyleEditor from "@/components/image-editor";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Save, Share2, RotateCcw, Plus } from "lucide-react";
import { MemeTemplate, SavedMeme } from "@shared/schema";

export default function MemeGenerator() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);

  // Изменяем структуру textContent для соответствия подходу из коллажей
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
      offsetX?: number;
      offsetY?: number;
    };
  }>>([]);
  
  const [showTextEditor, setShowTextEditor] = useState(true);
  
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [memeName, setMemeName] = useState("My Awesome Meme");
  
  // Состояния для стилизации
  const [selectedStyle, setSelectedStyle] = useState<AiStyle | undefined>(undefined);
  const [isStyleApplied, setIsStyleApplied] = useState(false);
  const [isStyleLoading, setIsStyleLoading] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Fetch templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery<MemeTemplate[]>({
    queryKey: ["/api/templates"],
  });

  // Fetch specific template if ID is provided
  const { data: templateData, isLoading: isLoadingTemplate } = useQuery<MemeTemplate>({
    queryKey: ["/api/templates", id],
    enabled: !!id,
  });



  // Save meme mutation с обновленным API клиентом
  const saveMutation = useMutation({
    mutationFn: async (memeData: any) => {
      // Используем обновленный apiRequest, который сразу возвращает данные в формате JSON
      return await apiRequest("POST", "/api/memes", memeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      toast({
        title: "Meme saved successfully",
        description: "Your meme has been saved to your collection.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save meme",
        description: String(error),
        variant: "destructive",
      });
    },
  });



  useEffect(() => {
    // When template data is loaded, set it as the selected template
    if (templateData) {
      // Создаем объект MemeTemplate из полученных данных
      const template: MemeTemplate = templateData as MemeTemplate;
      setSelectedTemplate(template);
      
      // В новой реализации мы не добавляем текст автоматически
      // Пользователь будет добавлять текст через кнопку "Add Text"
      setTextContent([]);
    }
  }, [templateData]);

  // Функция для добавления нового текста (по аналогии с коллажами)
  const handleAddText = () => {
    const newId = `text-${Date.now()}`;
    setTextContent((prev) => [
      ...prev,
      {
        id: newId,
        text: "Добавьте текст",
        style: {
          fontFamily: "Impact",
          fontSize: 48,
          color: "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 5,
          align: "center",
        },
        position: { 
          x: canvasRef ? canvasRef.width / 2 : 400, 
          y: canvasRef ? canvasRef.height / 2 : 400 
        },
      },
    ]);
    setShowTextEditor(true);
  };

  // Обновление текста по id (не по areaIndex как раньше)
  const handleTextChange = (id: string, text: string) => {
    setTextContent((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  // Обновление стиля текста по id
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
  
  // Обновление позиции текста (как в коллажах)
  const handleTextPositionChange = (id: string, newX: number, newY: number) => {
    setTextContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              position: {
                x: newX,
                y: newY,
              },
            }
          : item
      )
    );
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: number) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    
    // После изменения фильтров также обновляем текст
    setTimeout(() => {
      if (canvasRef) {
        console.log('Пытаемся обновить текст после изменения фильтров');
        renderTextOnCanvas();
      }
    }, 300);
  };

  const renderTextOnCanvas = () => {
    console.log('Вызвана функция renderTextOnCanvas, canvasRef:', canvasRef);
    
    // Проверяем все необходимые условия
    if (!canvasRef) {
      console.error('Canvas не определен');
      return;
    }
    
    if (!selectedTemplate) {
      console.error('Шаблон не определен');
      return;
    }
    
    // Если текстовый контент пуст, это нормально - просто выходим
    if (!textContent || textContent.length === 0) {
      console.log('Текстовый контент пуст - пропускаем отрисовку текста');
      return;
    }
    
    // Получаем 2D контекст
    const ctx = canvasRef.getContext("2d");
    if (!ctx) {
      console.error('Не удалось получить 2D контекст из canvas');
      return;
    }
    
    console.log('Canvas размеры:', canvasRef.width, 'x', canvasRef.height);
    console.log('Текстовый контент:', textContent);
    
    textContent.forEach((item) => {
      // Настраиваем шрифт
      ctx.font = `bold ${item.style.fontSize}px ${item.style.fontFamily}`;
      ctx.textAlign = item.style.align as CanvasTextAlign;
      
      // Настройка стиля для обводки
      ctx.lineWidth = item.style.strokeWidth;
      ctx.strokeStyle = item.style.strokeColor;
      
      console.log('Отрисовка текста:', item.text, 'позиция:', item.position?.x, item.position?.y);
      
      // Получаем позицию текста
      const position = item.position || { x: canvasRef.width / 2, y: canvasRef.height / 2 };
      
      // Разбиваем текст на строки при необходимости
      const maxWidth = canvasRef.width * 0.8; // 80% ширины холста
      const lines = wrapText(ctx, item.text, maxWidth);
      
      // Рисуем каждую строку текста
      const lineHeight = item.style.fontSize * 1.2;
      let offsetY = 0;
      
      lines.forEach((line, i) => {
        const lineY = position.y + offsetY - (lines.length - 1) * lineHeight / 2;
        
        // Рисуем обводку
        ctx.strokeText(line, position.x, lineY);
        
        // Рисуем сам текст
        ctx.fillStyle = item.style.color;
        ctx.fillText(line, position.x, lineY);
        
        offsetY += lineHeight;
      });
    });
  };
  
  // Вспомогательная функция для разбиения текста на строки
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Если текст пустой, возвращаем пустой массив
    if (!text.trim()) return lines;
    
    // Если текст короткий или состоит из одного слова, не разбиваем его
    if (words.length === 1 || ctx.measureText(text).width <= maxWidth) {
      return [text];
    }
    
    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };



  const handleSaveMeme = () => {
    if (!canvasRef || !selectedTemplate) return;
    
    const imageData = canvasRef.toDataURL("image/png");
    
    const memeData: Partial<SavedMeme> = {
      name: memeName,
      imageUrl: imageData,
      templateId: selectedTemplate.id,
      userId: 1, // For now, use a default user ID
      textContent,
      appliedFilters: [filters],
      aiStyle: isStyleApplied && selectedStyle ? selectedStyle.id : "none"
    };
    
    saveMutation.mutate(memeData);
  };

  const handleDownloadMeme = () => {
    if (!canvasRef) return;
    
    const link = document.createElement("a");
    link.download = `${memeName.replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Meme downloaded",
      description: "Your meme has been downloaded successfully.",
    });
  };

  const handleTemplateSelect = (template: MemeTemplate) => {
    setSelectedTemplate(template);
    // В новой реализации не создаем текст автоматически
    setTextContent([]);
  };

  const handleResetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  };
  
  // Обработчики для стилизации
  const handleStyleSelect = (style: AiStyle) => {
    setSelectedStyle(style);
  };
  
  const handleApplyStyle = async () => {
    if (!canvasRef || !selectedTemplate || !selectedStyle) return;
    
    try {
      setIsStyleLoading(true);
      
      // Сохраняем оригинальное изображение, если еще не сохранено
      if (!originalImageUrl) {
        setOriginalImageUrl(selectedTemplate.imageUrl);
      }
      
      // Получаем данные текущего изображения с канваса в высоком качестве
      const imageData = canvasRef.toDataURL("image/jpeg", 0.95);
      
      console.log("Отправка запроса стилизации, styleId:", selectedStyle.id);
      
      // Используем apiRequest вместо прямого fetch для стилизации
      const stylizationResult = await apiRequest("POST", "/api/stylize", {
        image: imageData,
        styleId: selectedStyle.id
      });
      
      if (stylizationResult && stylizationResult.styledImageUrl) {
        console.log("Стилизованное изображение успешно получено");
        // Обновляем шаблон с новым изображением высокого качества
        setSelectedTemplate({
          ...selectedTemplate,
          imageUrl: stylizationResult.styledImageUrl
        });
        setIsStyleApplied(true);
        
        // Вызываем нашу общую функцию рендеринга текста
        setTimeout(() => {
          renderTextOnCanvas();
        }, 250);
        
        toast({
          title: "Стиль применен",
          description: `Успешно применен стиль '${selectedStyle.name}' к вашему изображению.`
        });
      } else {
        throw new Error("Не удалось применить стиль - не получен URL стилизованного изображения");
      }
    } catch (error) {
      console.error("Ошибка применения стиля:", error);
      toast({
        title: "Ошибка применения стиля",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setIsStyleLoading(false);
    }
  };
  
  const handleRevertStyle = () => {
    if (!selectedTemplate || !originalImageUrl) return;
    
    // Восстанавливаем оригинальное изображение
    setSelectedTemplate({
      ...selectedTemplate,
      imageUrl: originalImageUrl
    });
    setIsStyleApplied(false);
    
    toast({
      title: "Original image restored",
      description: "Reverted to the original image."
    });
  };

  if (isLoadingTemplates || (id && isLoadingTemplate)) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка генератора мемов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[500px]">
              {selectedTemplate ? (
                <MemeImageEditor
                  template={selectedTemplate}
                  textContent={textContent}
                  filters={filters}
                  onCanvasReady={setCanvasRef}
                  onTextRender={renderTextOnCanvas}
                  onUpdateTextPosition={handleTextPositionChange}
                />
              ) : (
                <div className="text-center p-8 bg-accent/30 rounded-lg w-full">
                  <p className="text-xl mb-4">Выберите шаблон для начала работы</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                    {templates && Array.isArray(templates) ? templates.slice(0, 6).map((template: MemeTemplate) => (
                      <div
                        key={template.id}
                        className="cursor-pointer rounded-md overflow-hidden border hover:border-primary transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <img
                          src={template.imageUrl}
                          alt={template.name}
                          className="w-full h-auto object-cover aspect-square"
                        />
                      </div>
                    )) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTemplate && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSaveMeme}
                disabled={!selectedTemplate || saveMutation.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Сохранить мем
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadMeme}
                disabled={!selectedTemplate}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Скачать
              </Button>

              <SocialShare canvasRef={canvasRef} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {selectedTemplate && (
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
                  <Tabs defaultValue="text">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="text">Текст</TabsTrigger>
                      <TabsTrigger value="filters">Фильтры</TabsTrigger>
                      <TabsTrigger value="style">Стилизация</TabsTrigger>
                    </TabsList>
                    <div className="p-6">
                      <TabsContent value="text" className="m-0">
                        {textContent.length > 0 ? (
                          <div className="space-y-4">
                            {textContent.map((item) => (
                              <TextEditor
                                key={item.id}
                                areaIndex={0} // используем 0 как фиктивный параметр
                                textId={item.id}
                                label={`Текст`}
                                value={item.text}
                                style={{...item.style, position: item.position}}
                                onChange={(value) => handleTextChange(item.id, value)}
                                onStyleChange={(styleKey, value) => handleTextStyleChange(item.id, styleKey, value)}
                                onPositionChange={(x, y) => handleTextPositionChange(item.id, x, y)}
                                onRemove={() => {
                                  setTextContent((prev) => prev.filter((t) => t.id !== item.id));
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="mb-4 text-muted-foreground">Нет текстовых элементов</p>
                            <Button onClick={handleAddText} variant="outline" className="gap-2">
                              <Plus className="w-4 h-4" />
                              Добавить текст
                            </Button>
                          </div>
                        )}
                        
                        {textContent.length > 0 && (
                          <div className="mt-6 text-center">
                            <Button onClick={handleAddText} variant="outline" className="gap-2">
                              <Plus className="w-4 h-4" />
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
                      <TabsContent value="style" className="m-0">
                        <ImageStyleEditor
                          onStyleSelect={handleStyleSelect}
                          selectedStyle={selectedStyle}
                          onApplyStyle={handleApplyStyle}
                          onRevertStyle={handleRevertStyle}
                          isApplied={isStyleApplied}
                          isLoading={isStyleLoading}
                        />
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}

          {!selectedTemplate && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Начало работы</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Выберите шаблон мема из галереи</li>
                  <li>Добавьте свой текст в шаблон</li>
                  <li>Настройте стиль текста, цвета и положение</li>
                  <li>Примените фильтры для улучшения вашего мема</li>
                  <li>Сохраните или скачайте свою работу</li>
                </ol>
                <Button
                  onClick={() => navigate("/templates")}
                  className="w-full mt-4"
                >
                  Просмотреть все шаблоны
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
