import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AiStyle } from "@/components/ai-style-selector";
import { placeholderStyles } from "@/lib/placeholder-styles";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { ImageUp, Download, History, Share2 } from "lucide-react";
import SocialShare from "@/components/social-share";
import { useDropzone } from "react-dropzone";
import { drawTextWithOutline, loadImage } from "@/lib/image-utils";

// Компонент для выбора стиля изображения
const AiStyleSelector = ({ onStyleSelect, selectedStyle, onApplyStyle, onRevertStyle, isApplied, isLoading }: {
  onStyleSelect: (style: AiStyle) => void;
  selectedStyle?: AiStyle;
  onApplyStyle: () => void;
  onRevertStyle: () => void;
  isApplied: boolean;
  isLoading: boolean;
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Выберите стиль AI</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {placeholderStyles.map((style) => (
          <div
            key={style.id}
            className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
              selectedStyle?.id === style.id ? "border-primary" : "border-transparent"
            }`}
            onClick={() => onStyleSelect(style)}
          >
            <div className="aspect-square bg-slate-100 overflow-hidden">
              <img 
                src={style.imageUrl} 
                alt={style.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="p-1 text-center text-xs truncate">{style.name}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          onClick={onRevertStyle} 
          disabled={!isApplied || isLoading}
        >
          <History className="w-4 h-4 mr-2" />
          Отменить
        </Button>
        <Button 
          onClick={onApplyStyle} 
          disabled={!selectedStyle || isApplied || isLoading}
        >
          {isLoading ? "Обработка..." : "Применить стиль"}
        </Button>
      </div>
    </div>
  );
};

export default function ImageEditor() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AiStyle | undefined>(undefined);
  const [isStyleApplied, setIsStyleApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  
  // Добавляем состояние для отслеживания текстов
  const [texts, setTexts] = useState<Array<{
    id: string;
    value: string;
    style: {
      fontFamily: string;
      fontSize: number;
      fillStyle: string;
      textAlign: string;
      x: number;
      y: number;
      showOutline: boolean;
      outlineColor: string;
    }
  }>>([]);

  // Функция для загрузки изображения
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageDataURL = event.target.result.toString();
          setUploadedImage(imageDataURL);
          setOriginalImage(imageDataURL);
          setIsStyleApplied(false);
          setActiveTab("edit");
          renderCanvas(imageDataURL);
        }
      };
      
      reader.readAsDataURL(file);
    }
  });

  // Функция для рендеринга изображения на canvas
  const renderCanvas = async (imageUrl: string) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
      const img = await loadImage(imageUrl);
      
      // Устанавливаем размеры canvas
      const maxWidth = Math.min(800, window.innerWidth - 40);
      const maxHeight = 600;
      
      // Вычисляем размеры с сохранением пропорций
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = height * ratio;
        width = width * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Очищаем canvas
      ctx.clearRect(0, 0, width, height);
      
      // Рисуем изображение
      ctx.drawImage(img, 0, 0, width, height);
      
      // Рисуем тексты, если они есть
      texts.forEach((text) => {
        if (text.value) {
          drawTextWithOutline(
            ctx,
            text.value,
            text.style.x * width,
            text.style.y * height,
            {
              fontFamily: text.style.fontFamily,
              fontSize: text.style.fontSize,
              color: text.style.fillStyle,
              strokeColor: text.style.outlineColor || '#000000',
              strokeWidth: text.style.showOutline ? 3 : 0,
              align: text.style.textAlign as string
            }
          );
        }
      });
    } catch (error) {
      console.error('Ошибка при отрисовке изображения:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive"
      });
    }
  };

  // Функция для скачивания изображения
  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    // Создаем временную ссылку для скачивания
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    
    // Симулируем клик для начала скачивания
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Обработчик выбора стиля
  const handleStyleSelect = (style: AiStyle) => {
    setSelectedStyle(style);
  };

  // Обработчик применения стиля
  const applyStyle = async () => {
    if (!selectedStyle || !uploadedImage || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // Преобразуем canvas в Blob
      const canvas = canvasRef.current;
      
      // Преобразуем canvas в base64
      const canvasDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Отправляем изображение на сервер для стилизации
      const formData = new FormData();
      
      // Конвертируем base64 в blob
      const fetchResponse = await fetch(canvasDataUrl);
      const blob = await fetchResponse.blob();
      
      formData.append('image', blob, 'image.jpg');
      formData.append('styleId', selectedStyle.id);

      const response = await apiRequest('/api/stylize', {
        method: 'POST',
        body: formData,
        headers: {}
      });

      if (response && response.imageUrl) {
        // Загружаем стилизованное изображение
        setUploadedImage(response.imageUrl);
        setIsStyleApplied(true);
        renderCanvas(response.imageUrl);
        
        toast({
          title: "Успешно!",
          description: "Стиль успешно применен к изображению",
        });
      } else {
        throw new Error('Не удалось получить стилизованное изображение');
      }
    } catch (error) {
      console.error('Ошибка при применении стиля:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось применить стиль к изображению",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Функция для отмены стилизации
  const revertStyle = () => {
    if (originalImage) {
      setUploadedImage(originalImage);
      setIsStyleApplied(false);
      renderCanvas(originalImage);
    }
  };

  // Отрисовываем canvas при изменении изображения или текстов
  useEffect(() => {
    if (uploadedImage) {
      renderCanvas(uploadedImage);
    }
  }, [uploadedImage, texts]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Редактор изображений</h1>
        <p className="text-muted-foreground">
          Загрузите изображение и примените к нему стили AI или добавьте текст
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Загрузка</TabsTrigger>
          <TabsTrigger value="edit" disabled={!uploadedImage}>Редактирование</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="py-4">
          <Card>
            <CardContent className="pt-6">
              <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <input {...getInputProps()} />
                <ImageUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Перетащите изображение сюда или кликните для выбора файла
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Поддерживаются форматы PNG, JPG, JPEG, GIF и WEBP
                </p>
                <Button variant="outline" className="mt-4">
                  Выбрать файл
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="edit" className="py-4">
          {uploadedImage && (
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-center bg-slate-50 rounded-lg p-2">
                      <canvas
                        ref={canvasRef}
                        className="max-w-full object-contain rounded shadow-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={downloadImage}>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать
                  </Button>
                  
                  <SocialShare canvasRef={canvasRef.current} />
                </div>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-4">
                    <AiStyleSelector
                      onStyleSelect={handleStyleSelect}
                      selectedStyle={selectedStyle}
                      onApplyStyle={applyStyle}
                      onRevertStyle={revertStyle}
                      isApplied={isStyleApplied}
                      isLoading={isProcessing}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}