import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MemeTemplateCard from "@/components/meme-template-card";
import { Search, Upload, Plus } from "lucide-react";
import { MemeTemplate } from "@shared/schema";

export default function Templates() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Fetch all templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/templates"],
  });

  // Filter templates based on search query
  const filteredTemplates = templates
    ? templates.filter((template: MemeTemplate) =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleUploadTemplate = () => {
    toast({
      title: "Not implemented",
      description: "Template upload feature is coming soon.",
    });
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Шаблоны изображений</h1>
          <p className="text-muted-foreground mt-1">
            Просмотрите нашу коллекцию шаблонов или загрузите свои собственные
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUploadModal(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            Загрузить шаблон
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Поиск шаблонов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-square bg-accent animate-pulse" />
              <CardContent className="p-4">
                <div className="h-4 bg-accent rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredTemplates.map((template: MemeTemplate) => (
                <MemeTemplateCard key={template.id} template={template} />
              ))}
              <Card className="overflow-hidden border-dashed border-2 border-muted-foreground/30">
                <Link href="/meme-generator">
                  <a className="block aspect-square flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <Plus className="w-12 h-12 mb-2" />
                    <span className="font-medium">Создать пользовательский шаблон</span>
                  </a>
                </Link>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-accent">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Шаблоны не найдены</h3>
              <p className="text-muted-foreground mb-6">
                Мы не смогли найти шаблоны, соответствующие вашему запросу.
              </p>
              <Button onClick={() => setSearchQuery("")}>Очистить поиск</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
