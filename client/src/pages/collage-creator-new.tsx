import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CollageLayoutSelector from "@/components/collage-layout-selector-new";
import TextEditor from "@/components/text-editor";
import SocialShare from "@/components/social-share";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Save, Share2, Upload, RotateCcw, Plus } from "lucide-react";
import { Collage } from "@shared/schema";
import { StylizedImageDisplay } from "@/components/stylized-image-display";
import { StyleManager } from "@/components/style-manager";
import { useStyleContext } from "@/context/StyleContext";

// Определение доступных макетов коллажей
const LAYOUTS = [
  { id: "grid2x2", name: "Grid 2x2", cells: 4 },
  { id: "grid3x3", name: "Grid 3x3", cells: 9 },
  { id: "horizontal3", name: "3 Horizontal", cells: 3 },
  { id: "vertical3", name: "3 Vertical", cells: 3 },
  { id: "leftFocus", name: "Left Focus", cells: 3 },
  { id: "rightFocus", name: "Right Focus", cells: 3 },
];

export default function CollageCreatorNew() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentImage, lastStyleUsed } = useStyleContext();
  
  // Основные состояния компонента
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [textContent, setTextContent] = useState<{ id: string; text: string; style: any; position: { x: number; y: number } }[]>([]);
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [collageName, setCollageName] = useState("My Awesome Collage");
  const [showTextEditor, setShowTextEditor] = useState(false);

  // При изменении изображения в контексте обновляем источник изображений
  useEffect(() => {
    if (currentImage && sourceImages.length > 0) {
      console.log("CollageCreator: Обновление источника при изменении изображения в контексте", { lastStyleUsed });
      // Заменяем первое изображение на текущее из контекста (которое может быть стилизованным)
      const updatedImages = [...sourceImages];
      updatedImages[0] = currentImage;
      setSourceImages(updatedImages);
    }
  }, [currentImage, lastStyleUsed, sourceImages]);

  // Сохранение коллажа
  const saveMutation = useMutation({
    mutationFn: async (collageData: any) => {
      const response = await apiRequest("POST", "/api/collages", collageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collages"] });
      toast({
        title: "Коллаж сохранен",
        description: "Ваш коллаж успешно сохранен в коллекции.",
      });
    },
    onError: (error) => {
      toast({
        title: "Не удалось сохранить коллаж",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Обработчик загрузки файлов
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let loadedCount = 0;
    const totalFiles = Math.min(files.length, selectedLayout.cells - sourceImages.length);

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          newImages.push(e.target.result);
          loadedCount++;
          
          if (loadedCount === totalFiles) {
            setSourceImages((prev) => {
              return [...prev, ...newImages].slice(0, selectedLayout.cells);
            });
          }
        }
      };
      
      reader.readAsDataURL(file);
    }

    // Сбрасываем input для повторного выбора того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Обработчики для текста
  const handleAddText = () => {
    const newId = `text-${textContent.length + 1}`;
    setTextContent((prev) => [
      ...prev,
      {
        id: newId,
        text: "Добавьте текст здесь",
        style: {
          fontFamily: "Arial",
          fontSize: 24,
          color: "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 2,
          align: "center",
        },
        position: { x: 100, y: 100 },
      },
    ]);
    setShowTextEditor(true);
  };

  const handleTextChange = (id: string, text: string) => {
    setTextContent((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

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

  // Управление фильтрами
  const handleFilterChange = (filterType: keyof typeof filters, value: number) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Отрисовка текста на канвасе
  const renderTextOnCanvas = () => {
    if (!canvasRef) return;
    
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;
    
    textContent.forEach((item) => {
      ctx.font = `${item.style.fontSize}px ${item.style.fontFamily}`;
      ctx.textAlign = item.style.align as CanvasTextAlign;
      
      // Отрисовка обводки текста
      ctx.lineWidth = item.style.strokeWidth;
      ctx.strokeStyle = item.style.strokeColor;
      ctx.strokeText(
        item.text,
        item.position.x,
        item.position.y
      );
      
      // Отрисовка заливки текста
      ctx.fillStyle = item.style.color;
      ctx.fillText(
        item.text,
        item.position.x,
        item.position.y
      );
    });
  };

  // Сохранение коллажа
  const handleSaveCollage = () => {
    if (!canvasRef) return;
    
    const imageData = canvasRef.toDataURL("image/png");
    
    const collageData: Partial<Collage> = {
      name: collageName,
      imageUrl: imageData,
      userId: 1, // Временно используем ID по умолчанию
      layout: selectedLayout.id,
      sourceImages,
      textContent,
      appliedFilters: [filters],
      aiStyle: "custom",
    };
    
    saveMutation.mutate(collageData);
  };

  // Скачивание коллажа
  const handleDownloadCollage = () => {
    if (!canvasRef) return;
    
    const link = document.createElement("a");
    link.download = `${collageName.replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Коллаж скачан",
      description: "Ваш коллаж успешно скачан.",
    });
  };

  // Сброс фильтров к значениям по умолчанию
  const handleResetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  };

  // Обработка изменения макета
  const handleLayoutChange = (layout: typeof LAYOUTS[0]) => {
    setSelectedLayout(layout);
    
    // Обрезаем изображения, если новый макет имеет меньше ячеек
    if (sourceImages.length > layout.cells) {
      setSourceImages((prev) => prev.slice(0, layout.cells));
    }
  };

  // Удаление изображения
  const handleRemoveImage = (index: number) => {
    setSourceImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Обработчик готовности канваса в StylizedImageDisplay
  const handleImageCanvasReady = (canvas: HTMLCanvasElement) => {
    setCanvasRef(canvas);
  };

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка с коллажем */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[500px]">
              {/* Загрузка изображений если их нет */}
              {sourceImages.length === 0 ? (
                <div className="text-center text-gray-500">
                  Загрузите изображение для создания коллажа
                </div>
              ) : (
                /* Отображаем коллаж без стилизации - используем только базовый компонент */
                <CollageLayoutSelector
                  layout={selectedLayout}
                  sourceImages={sourceImages}
                  filters={filters}
                  textContent={textContent}
                  onCanvasReady={setCanvasRef}
                  onTextRender={renderTextOnCanvas}
                  onRemoveImage={handleRemoveImage}
                />
              )}
            </CardContent>
          </Card>

          {/* Кнопки управления */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
              disabled={sourceImages.length >= selectedLayout.cells}
            >
              <Upload className="w-4 h-4" />
              Загрузить изображения
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              onClick={handleAddText}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить текст
            </Button>
            <Button
              onClick={handleSaveCollage}
              disabled={sourceImages.length === 0 || saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Сохранить коллаж
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadCollage}
              disabled={sourceImages.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Скачать
            </Button>
            {canvasRef && <SocialShare canvasRef={canvasRef} />}
          </div>
        </div>

        {/* Правая колонка с настройками */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="collage-name">Название коллажа</Label>
                  <Input
                    id="collage-name"
                    value={collageName}
                    onChange={(e) => setCollageName(e.target.value)}
                    placeholder="Введите название коллажа"
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Выберите макет</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {LAYOUTS.map((layout) => (
                      <Button
                        key={layout.id}
                        variant={selectedLayout.id === layout.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLayoutChange(layout)}
                        className="text-xs p-2 h-auto"
                      >
                        {layout.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="style" className="mt-6">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="style">Стиль</TabsTrigger>
                  <TabsTrigger value="filters">Фильтры</TabsTrigger>
                  <TabsTrigger value="text" disabled={!showTextEditor}>Текст</TabsTrigger>
                </TabsList>

                <div className="pt-2">
                  <TabsContent value="style" className="m-0">
                    {/* Менеджер стилей */}
                    <StyleManager canvasRef={canvasRef} disableControls={sourceImages.length === 0} />
                  </TabsContent>

                  <TabsContent value="filters" className="m-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Яркость ({filters.brightness}%)</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="text-xs h-auto px-2"
                          >
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

                  <TabsContent value="text" className="m-0">
                    {showTextEditor && textContent.length > 0 && (
                      <TextEditor
                        items={textContent}
                        onChange={handleTextChange}
                        onStyleChange={handleTextStyleChange}
                      />
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Начало работы</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Выберите макет коллажа</li>
                <li>Загрузите изображения в ячейки макета</li>
                <li>Добавьте текстовые подписи при необходимости</li>
                <li>Примените стили или фильтры для улучшения коллажа</li>
                <li>Сохраните или скачайте ваше творение</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}