import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Save, RotateCcw, Plus, Trash } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

export default function NewMemeGenerator() {
  const { toast } = useToast();
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Состояния
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    isDragging: boolean;
  }>>([]);
  const [selectedStyle, setSelectedStyle] = useState<typeof STYLES[0] | null>(null);
  const [isStylizing, setIsStylizing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isStyleApplied, setIsStyleApplied] = useState(false);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [memeName, setMemeName] = useState("My Meme");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Загрузка изображения
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setOriginalImage(result);
      setIsStyleApplied(false);
      
      // Сбросить стилизацию при загрузке нового изображения
      setSelectedStyle(null);
    };
    reader.readAsDataURL(file);
  };

  // Добавление текста
  const handleAddText = () => {
    const id = Date.now().toString();
    const canvasWidth = canvasRef.current?.width || 500;
    const canvasHeight = canvasRef.current?.height || 500;
    
    setTextElements([
      ...textElements,
      {
        id,
        text: "Введите текст",
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        fontSize: 36,
        fontFamily: "Impact",
        color: "#FFFFFF",
        strokeColor: "#000000",
        strokeWidth: 4,
        isDragging: false,
      },
    ]);
  };

  // Изменение текста
  const handleTextChange = (id: string, text: string) => {
    setTextElements(
      textElements.map((el) => (el.id === id ? { ...el, text } : el))
    );
  };

  // Изменение свойства текста
  const handleTextPropertyChange = (
    id: string,
    property: string,
    value: any
  ) => {
    setTextElements(
      textElements.map((el) =>
        el.id === id ? { ...el, [property]: value } : el
      )
    );
  };

  // Удаление текста
  const handleDeleteText = (id: string) => {
    setTextElements(textElements.filter((el) => el.id !== id));
  };

  // Начало перетаскивания текста
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTextElements(
      textElements.map((el) =>
        el.id === id
          ? { ...el, isDragging: true }
          : { ...el, isDragging: false }
      )
    );
  };

  // Перетаскивание текста
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTextElements(
      textElements.map((el) =>
        el.isDragging ? { ...el, x, y } : el
      )
    );
  };

  // Завершение перетаскивания
  const handleMouseUp = () => {
    setTextElements(
      textElements.map((el) => ({ ...el, isDragging: false }))
    );
  };

  // Применение фильтров
  const handleFilterChange = (filter: keyof typeof filters, value: number) => {
    setFilters({ ...filters, [filter]: value });
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  };

  // Выбор стиля
  const handleStyleSelect = (style: typeof STYLES[0]) => {
    setSelectedStyle(style);
  };

  // Применение стиля
  const handleApplyStyle = async () => {
    if (!imagePreview || !selectedStyle) return;
    
    try {
      setIsStylizing(true);
      
      // Сохраняем оригинальное изображение
      if (!originalImage) {
        setOriginalImage(imagePreview);
      }
      
      // Получаем данные изображения с canvas
      const imageData = canvasRef.current?.toDataURL("image/jpeg", 0.9);
      
      // Отправляем запрос на стилизацию
      const result = await apiRequest("POST", "/api/stylize", {
        image: imageData,
        styleId: selectedStyle.id,
      });
      
      if (result && result.styledImageUrl) {
        setImagePreview(result.styledImageUrl);
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

  // Отмена стиля
  const handleRevertStyle = () => {
    if (!originalImage) return;
    
    setImagePreview(originalImage);
    setIsStyleApplied(false);
    
    toast({
      title: "Стиль отменен",
      description: "Изображение возвращено к оригиналу",
    });
  };

  // Сохранение мема
  const handleSaveMeme = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `${memeName.replace(/\s+/g, "-")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Мем сохранен",
      description: "Изображение сохранено на ваше устройство",
    });
  };

  // Обновление canvas при изменении изображения или фильтров
  useEffect(() => {
    if (!imagePreview) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const image = new Image();
    image.crossOrigin = "anonymous";
    
    image.onload = () => {
      // Устанавливаем размеры canvas
      const maxWidth = 800;
      const maxHeight = 800;
      
      let width = image.width;
      let height = image.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      setCanvasSize({ width, height });
      
      // Очищаем canvas
      ctx.clearRect(0, 0, width, height);
      
      // Применяем фильтры
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
      
      // Рисуем изображение
      ctx.drawImage(image, 0, 0, width, height);
      
      // Сбрасываем фильтры для текста
      ctx.filter = "none";
      
      // Рисуем текст
      textElements.forEach((el) => {
        ctx.font = `${el.fontSize}px ${el.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Обводка текста
        ctx.lineWidth = el.strokeWidth;
        ctx.strokeStyle = el.strokeColor;
        ctx.strokeText(el.text, el.x, el.y);
        
        // Заливка текста
        ctx.fillStyle = el.color;
        ctx.fillText(el.text, el.x, el.y);
      });
    };
    
    image.onerror = () => {
      console.error("Ошибка при загрузке изображения");
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      });
    };
    
    image.src = imagePreview;
  }, [imagePreview, filters, textElements]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Новый генератор мемов</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основной редактор */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[500px]">
              {imagePreview ? (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={(e) => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const rect = canvas.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      // Находим текст, на который нажали
                      const clickedText = textElements.find((el) => {
                        const textWidth = el.text.length * (el.fontSize / 2);
                        const textHeight = el.fontSize;
                        
                        return (
                          Math.abs(x - el.x) <= textWidth / 2 &&
                          Math.abs(y - el.y) <= textHeight / 2
                        );
                      });
                      
                      if (clickedText) {
                        handleMouseDown(e, clickedText.id);
                      }
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ 
                      cursor: textElements.some((el) => el.isDragging) 
                        ? "grabbing" 
                        : "default",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.375rem"
                    }}
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-accent/30 rounded-lg w-full">
                  <p className="text-xl mb-4">Загрузите изображение для начала работы</p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Выбрать изображение
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {imagePreview && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Загрузить другое изображение
              </Button>
              
              <Button onClick={handleSaveMeme} className="gap-2">
                <Download className="w-4 h-4" />
                Скачать мем
              </Button>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
        
        {/* Панель инструментов */}
        <div className="space-y-6">
          {imagePreview && (
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
                      {/* Вкладка текста */}
                      <TabsContent value="text" className="m-0">
                        <div className="space-y-4">
                          {textElements.map((el, index) => (
                            <div key={el.id} className="space-y-3 pb-4 border-b last:border-0">
                              <div className="flex justify-between items-center">
                                <Label>Текст {index + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteText(el.id)}
                                  className="h-8 w-8 p-0 text-destructive"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <Input
                                value={el.text}
                                onChange={(e) => handleTextChange(el.id, e.target.value)}
                                placeholder="Введите текст"
                              />
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs mb-1 block">Шрифт</Label>
                                  <select
                                    value={el.fontFamily}
                                    onChange={(e) => handleTextPropertyChange(el.id, "fontFamily", e.target.value)}
                                    className="w-full h-8 px-3 rounded-md border"
                                  >
                                    <option value="Impact">Impact</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Comic Sans MS">Comic Sans MS</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <Label className="text-xs mb-1 block">
                                    Размер: {el.fontSize}px
                                  </Label>
                                  <Slider
                                    value={[el.fontSize]}
                                    min={12}
                                    max={72}
                                    step={1}
                                    onValueChange={(values) => 
                                      handleTextPropertyChange(el.id, "fontSize", values[0])
                                    }
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs mb-1 block">Цвет текста</Label>
                                  <input
                                    type="color"
                                    value={el.color}
                                    onChange={(e) => 
                                      handleTextPropertyChange(el.id, "color", e.target.value)
                                    }
                                    className="w-full h-8"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs mb-1 block">Цвет обводки</Label>
                                  <input
                                    type="color"
                                    value={el.strokeColor}
                                    onChange={(e) => 
                                      handleTextPropertyChange(el.id, "strokeColor", e.target.value)
                                    }
                                    className="w-full h-8"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs mb-1 block">
                                  Толщина обводки: {el.strokeWidth}px
                                </Label>
                                <Slider
                                  value={[el.strokeWidth]}
                                  min={0}
                                  max={10}
                                  step={0.5}
                                  onValueChange={(values) => 
                                    handleTextPropertyChange(el.id, "strokeWidth", values[0])
                                  }
                                />
                              </div>
                            </div>
                          ))}
                          
                          <Button
                            onClick={handleAddText}
                            variant="outline"
                            className="w-full gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Добавить текст
                          </Button>
                        </div>
                      </TabsContent>
                      
                      {/* Вкладка фильтров */}
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
                      
                      {/* Вкладка стилизации */}
                      <TabsContent value="style" className="m-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {STYLES.map((style) => (
                              <div
                                key={style.id}
                                className={`rounded-md overflow-hidden border cursor-pointer transition-all ${
                                  selectedStyle?.id === style.id
                                    ? "ring-2 ring-primary border-primary"
                                    : "hover:border-gray-400"
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
                                  <p className="text-sm font-medium">{style.name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {selectedStyle && (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm text-gray-500">
                                {selectedStyle.description}
                              </p>
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleApplyStyle}
                                  disabled={isStylizing || !selectedStyle}
                                  className="flex-1"
                                >
                                  {isStylizing ? "Применение..." : "Применить стиль"}
                                </Button>
                                
                                {isStyleApplied && (
                                  <Button
                                    variant="outline"
                                    onClick={handleRevertStyle}
                                    className="flex-1"
                                  >
                                    Отменить стиль
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
          
          {!imagePreview && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Как создать мем</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Загрузите изображение</li>
                  <li>Добавьте текст и настройте его внешний вид</li>
                  <li>Примените фильтры для настройки изображения</li>
                  <li>Попробуйте стилизацию в стиле известных художников</li>
                  <li>Сохраните или поделитесь своим мемом</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}