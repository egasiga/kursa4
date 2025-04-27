import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function MemeGenerator() {
  const { toast } = useToast();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Генератор Мемов</h1>
      <div className="p-12 text-center border rounded-lg bg-card">
        <h2 className="text-xl mb-4">Функциональность временно недоступна</h2>
        <p className="mb-8 text-muted-foreground">
          Мы работаем над новой и улучшенной версией генератора мемов. Скоро будет доступно!
        </p>
        <Button 
          onClick={() => toast({
            title: "Информация",
            description: "Новая версия генератора мемов будет доступна в ближайшее время!"
          })}
        >
          Уведомить меня, когда будет готово
        </Button>
      </div>
    </div>
  );
}