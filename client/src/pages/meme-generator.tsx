import { useState, useEffect } from "react";
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
import ImageEditor from "@/components/image-editor";
import AiStyleSelector from "@/components/ai-style-selector";
import SocialShare from "@/components/social-share";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Wand2, Save, Share2, RotateCcw } from "lucide-react";
import { MemeTemplate, SavedMeme } from "@shared/schema";

export default function MemeGenerator() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>("none");
  const [textContent, setTextContent] = useState<{ areaIndex: number; text: string; style: any }[]>([]);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [memeName, setMemeName] = useState("My Awesome Meme");

  // Fetch templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/templates"],
  });

  // Fetch specific template if ID is provided
  const { data: templateData, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["/api/templates", id],
    enabled: !!id,
  });

  // Fetch AI styles
  const { data: aiStyles } = useQuery({
    queryKey: ["/api/styles"],
  });

  // Save meme mutation
  const saveMutation = useMutation({
    mutationFn: async (memeData: any) => {
      const response = await apiRequest("POST", "/api/memes", memeData);
      return response.json();
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

  // Apply AI style mutation
  const applyStyleMutation = useMutation({
    mutationFn: async ({ image, styleParams }: { image: string; styleParams: any }) => {
      const response = await apiRequest("POST", "/api/apply-style", { image, styleParams });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to apply style');
      return data;
    },
    onSuccess: (data) => {
      if (!canvasRef || !data.styledImage) return;
      
      const ctx = canvasRef.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      let loaded = false;

      img.onload = () => {
        if (loaded) return; // Prevent double rendering
        loaded = true;
        
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
        ctx.drawImage(img, 0, 0, canvasRef.width, canvasRef.height);
        
        // Store the styled image data
        const imageData = ctx.getImageData(0, 0, canvasRef.width, canvasRef.height);
        ctx.putImageData(imageData, 0, 0);
        
        // Re-add text after applying style
        renderTextOnCanvas();
      };

      img.src = data.styledImage;
      
      toast({
        title: "AI style applied",
        description: "Your meme has been transformed with AI styling.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to apply AI style",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // When template data is loaded, set it as the selected template
    if (templateData) {
      setSelectedTemplate(templateData);
      
      // Initialize text content from template's text areas
      if (templateData.textAreas && Array.isArray(templateData.textAreas)) {
        setTextContent(
          templateData.textAreas.map((area: any, index: number) => ({
            areaIndex: index,
            text: area.defaultText || "",
            style: {
              fontFamily: "Arial",
              fontSize: 24,
              color: "#FFFFFF",
              strokeColor: "#000000",
              strokeWidth: 2,
              align: "center",
            },
          }))
        );
      }
    }
  }, [templateData]);

  const handleTextChange = (areaIndex: number, text: string) => {
    setTextContent((prevContent) => {
      const newContent = [...prevContent];
      const existingIndex = newContent.findIndex((item) => item.areaIndex === areaIndex);
      
      if (existingIndex >= 0) {
        newContent[existingIndex] = { ...newContent[existingIndex], text };
      } else {
        newContent.push({
          areaIndex,
          text,
          style: {
            fontFamily: "Arial",
            fontSize: 24,
            color: "#FFFFFF",
            strokeColor: "#000000",
            strokeWidth: 2,
            align: "center",
            offsetX: 0,
            offsetY: 0,
          },
        });
      }
      
      return newContent;
    });
  };

  const handleTextStyleChange = (areaIndex: number, styleKey: string, value: any) => {
    setTextContent((prevContent) => {
      const newContent = [...prevContent];
      const existingIndex = newContent.findIndex((item) => item.areaIndex === areaIndex);
      
      if (existingIndex >= 0) {
        newContent[existingIndex] = {
          ...newContent[existingIndex],
          style: {
            ...newContent[existingIndex].style,
            [styleKey]: value,
          },
        };
      }
      
      return newContent;
    });
  };
  
  const handleTextPositionChange = (areaIndex: number, offsetX: number, offsetY: number) => {
    setTextContent((prevContent) => {
      const newContent = [...prevContent];
      const existingIndex = newContent.findIndex((item) => item.areaIndex === areaIndex);
      
      if (existingIndex >= 0) {
        newContent[existingIndex] = {
          ...newContent[existingIndex],
          style: {
            ...newContent[existingIndex].style,
            offsetX,
            offsetY,
          },
        };
      }
      
      return newContent;
    });
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: number) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const renderTextOnCanvas = () => {
    if (!canvasRef || !selectedTemplate || !selectedTemplate.textAreas) return;
    
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;
    
    textContent.forEach((item) => {
      const textArea = selectedTemplate.textAreas[item.areaIndex];
      if (!textArea) return;
      
      ctx.font = `${item.style.fontSize}px ${item.style.fontFamily}`;
      ctx.textAlign = item.style.align as CanvasTextAlign;
      
      // Draw text stroke
      ctx.lineWidth = item.style.strokeWidth;
      ctx.strokeStyle = item.style.strokeColor;
      // Вычисляем позицию текста с учетом смещения
      const xPos = textArea.x + textArea.width / 2 + (item.style.offsetX || 0);
      const yPos = textArea.y + textArea.height / 2 + (item.style.offsetY || 0);
      
      ctx.strokeText(
        item.text,
        xPos,
        yPos
      );
      
      // Draw text fill
      ctx.fillStyle = item.style.color;
      ctx.fillText(
        item.text,
        xPos,
        yPos
      );
    });
  };

  const handleApplyAiStyle = async () => {
    if (!canvasRef || selectedAiStyle === "none") return;
    
    // Получаем выбранный стиль из списка доступных стилей
    const selectedStyle = Array.isArray(aiStyles) ? aiStyles.find(style => String(style.id) === selectedAiStyle) : undefined;
    if (!selectedStyle) {
      toast({
        title: "Стиль не найден",
        description: "Выбранный стиль AI не найден в списке доступных стилей.",
        variant: "destructive",
      });
      return;
    }
    
    // Получаем изображение из канваса
    const image = canvasRef.toDataURL("image/png");
    
    // Определяем параметры стиля на основе его типа
    const styleParams = {
      aiModel: selectedStyle.name,
      styleIntensity: 1.0,
      transformType: "image-to-image",
      styleReference: selectedStyle.description || "general",
      ...selectedStyle.apiParams
    };
    
    console.log("Applying style:", {
      styleId: selectedAiStyle,
      styleName: selectedStyle.name,
      styleParams
    });
    
    // Вызываем мутацию с правильными параметрами
    applyStyleMutation.mutate({ 
      image, 
      styleParams 
    });
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
      aiStyle: selectedAiStyle,
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
    setTextContent(
      template.textAreas.map((area: any, index: number) => ({
        areaIndex: index,
        text: area.defaultText || "",
        style: {
          fontFamily: "Arial",
          fontSize: 24,
          color: "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 2,
          align: "center",
          offsetX: 0,
          offsetY: 0,
        },
      }))
    );
  };

  const handleResetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  };

  if (isLoadingTemplates || (id && isLoadingTemplate)) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meme generator...</p>
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
                <ImageEditor
                  template={selectedTemplate}
                  textContent={textContent}
                  filters={filters}
                  onCanvasReady={setCanvasRef}
                  onTextRender={renderTextOnCanvas}
                  onUpdateTextPosition={handleTextPositionChange}
                />
              ) : (
                <div className="text-center p-8 bg-accent/30 rounded-lg w-full">
                  <p className="text-xl mb-4">Select a template to get started</p>
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
                Save Meme
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadMeme}
                disabled={!selectedTemplate}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="secondary"
                onClick={handleApplyAiStyle}
                disabled={!selectedTemplate || selectedAiStyle === "none" || applyStyleMutation.isPending}
                className="gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Apply AI Style
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
                      <Label htmlFor="meme-name">Meme Name</Label>
                      <Input
                        id="meme-name"
                        value={memeName}
                        onChange={(e) => setMemeName(e.target.value)}
                        placeholder="Enter a name for your meme"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Tabs defaultValue="text">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="filters">Filters</TabsTrigger>
                      <TabsTrigger value="ai">AI Style</TabsTrigger>
                    </TabsList>
                    <div className="p-6">
                      <TabsContent value="text" className="m-0">
                        <div className="space-y-4">
                          {selectedTemplate.textAreas.map((area: any, index: number) => (
                            <TextEditor
                              key={index}
                              areaIndex={index}
                              label={`Text ${index + 1}`}
                              defaultText={area.defaultText || ""}
                              value={textContent.find((t) => t.areaIndex === index)?.text || ""}
                              style={textContent.find((t) => t.areaIndex === index)?.style || {}}
                              onChange={(value) => handleTextChange(index, value)}
                              onStyleChange={(styleKey, value) => handleTextStyleChange(index, styleKey, value)}
                              onPositionChange={(offsetX, offsetY) => handleTextPositionChange(index, offsetX, offsetY)}
                            />
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="filters" className="m-0">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Brightness ({filters.brightness}%)</Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleResetFilters}
                                className="h-6 gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Reset
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
                            <Label>Contrast ({filters.contrast}%)</Label>
                            <Slider
                              value={[filters.contrast]}
                              min={0}
                              max={200}
                              step={1}
                              onValueChange={(values) => handleFilterChange("contrast", values[0])}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Saturation ({filters.saturation}%)</Label>
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
                      <TabsContent value="ai" className="m-0">
                        <AiStyleSelector
                          styles={Array.isArray(aiStyles) ? aiStyles : []}
                          selectedStyle={selectedAiStyle}
                          onChange={setSelectedAiStyle}
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
                <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Select a meme template from the gallery</li>
                  <li>Add your custom text to the template</li>
                  <li>Customize text style, colors, and positioning</li>
                  <li>Apply filters or AI styles to enhance your meme</li>
                  <li>Save or download your creation</li>
                </ol>
                <Button
                  onClick={() => navigate("/templates")}
                  className="w-full mt-4"
                >
                  Browse All Templates
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
