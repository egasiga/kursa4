import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";
import { useStyleContext } from "@/context/StyleContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StyleManagerProps {
  canvasRef: HTMLCanvasElement | null;
  disableControls?: boolean;
}

export function StyleManager({ canvasRef, disableControls = false }: StyleManagerProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>("none");
  const { toast } = useToast();
  const { persistImage, isStylized, resetStylizedImage } = useStyleContext();

  // Загружаем доступные стили
  const { data: aiStyles } = useQuery<{ id: number; name: string; description: string | null; previewUrl: string | null; apiParams: unknown }[]>({
    queryKey: ["/api/styles"],
  });

  // Мутация для применения стиля
  const applyStyleMutation = useMutation({
    mutationFn: async ({ imageData, styleId }: { imageData: string; styleId: string }) => {
      console.log("StyleManager: Применение стиля:", {
        styleId, 
        styleName: aiStyles?.find((s) => String(s.id) === styleId)?.name
      });
      const response = await apiRequest("POST", "/api/apply-style", { imageData, styleId });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.styledImage) {
        // Получаем исходное изображение с канваса
        if (canvasRef) {
          const originalImage = canvasRef.toDataURL("image/png");
          
          // Сохраняем пару (стилизованное + оригинальное)
          persistImage(data.styledImage, originalImage);
          
          toast({
            title: "Стиль применен",
            description: `Изображение стилизовано в стиле ${aiStyles?.find((s) => String(s.id) === variables.styleId)?.name}`,
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Ошибка при применении стиля",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Обработчик применения стиля
  const handleApplyStyle = () => {
    if (!canvasRef || selectedStyle === "none") return;
    
    const imageData = canvasRef.toDataURL("image/png");
    applyStyleMutation.mutate({ imageData, styleId: selectedStyle });
  };

  // Обработчик сброса стилизации
  const handleResetStyle = () => {
    resetStylizedImage();
    toast({
      title: "Стилизация сброшена",
      description: "Изображение возвращено к исходному состоянию",
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Выберите стиль:</label>
        <Select
          value={selectedStyle}
          onValueChange={setSelectedStyle}
          disabled={disableControls || applyStyleMutation.isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите художественный стиль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без стилизации</SelectItem>
            {aiStyles?.map((style) => (
              <SelectItem key={style.id} value={String(style.id)}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="w-full gap-2"
          onClick={handleApplyStyle}
          disabled={disableControls || selectedStyle === "none" || applyStyleMutation.isPending || !canvasRef}
        >
          <Wand2 className="w-4 h-4" />
          {applyStyleMutation.isPending ? "Применение..." : "Применить стиль"}
        </Button>
        
        {isStylized && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleResetStyle}
            disabled={disableControls || applyStyleMutation.isPending}
          >
            Сбросить стиль
          </Button>
        )}
      </div>
    </div>
  );
}