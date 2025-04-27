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

  // Временно отключаем функциональность текста
  const [textContent, setTextContent] = useState<Array<any>>([]);
  const [showTextEditor, setShowTextEditor] = useState(false);
  
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

  // Заглушки для функций обработки текста (будут полностью переписаны)
  const handleAddText = () => {};
  const handleTextChange = (id: string, text: string) => {};
  const handleTextStyleChange = (id: string, styleKey: string, value: any) => {};
  const handleTextPositionChange = (id: string, newX: number, newY: number) => {};
  const renderTextOnCanvas = () => {};

  const handleFilterChange = (filterType: keyof typeof filters, value: number) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
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
        
        // Текстовая функциональность отключена
        // setTimeout(() => {
        //   renderTextOnCanvas();
        // }, 250);
        
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
                        <div className="text-center py-6">
                          <p className="mb-4 text-muted-foreground">Функциональность текста временно отключена</p>
                          <p className="text-sm text-gray-500">Мы работаем над улучшением текстового редактора</p>
                        </div>
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
