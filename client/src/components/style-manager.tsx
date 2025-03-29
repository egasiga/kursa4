import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StyleManagerProps {
  canvasRef: HTMLCanvasElement | null;
  disableControls?: boolean;
}

export function StyleManager({ canvasRef, disableControls = false }: StyleManagerProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>("none");
  const { toast } = useToast();

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
      if (data.styledImage && canvasRef) {
        // НЕОБРАТИМО заменяем изображение в канвасе на стилизованное
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const ctx = canvasRef.getContext('2d');
          if (ctx) {
            // Очищаем канвас
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
            
            // Рисуем новое стилизованное изображение на канвасе
            ctx.drawImage(img, 0, 0, canvasRef.width, canvasRef.height);
            
            // ВАЖНО: НЕ сохраняем оригинальное изображение, работаем только со стилизованным
            toast({
              title: "Стиль применен",
              description: `Изображение стилизовано в стиле ${aiStyles?.find((s) => String(s.id) === variables.styleId)?.name}`,
            });
          }
        };
        img.src = data.styledImage;
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

  // Больше не используем обработчик сброса стилизации - изменения необратимы

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
      
      <Button
        variant="secondary"
        className="w-full gap-2"
        onClick={handleApplyStyle}
        disabled={disableControls || selectedStyle === "none" || applyStyleMutation.isPending || !canvasRef}
      >
        <Wand2 className="w-4 h-4" />
        {applyStyleMutation.isPending ? "Применение..." : "Применить стиль"}
      </Button>
    </div>
  );
}