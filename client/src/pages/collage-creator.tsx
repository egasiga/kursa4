import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CollageLayoutSelector from "@/components/collage-layout-selector";
import TextEditor from "@/components/text-editor";
import AiStyleSelector from "@/components/ai-style-selector";
import SocialShare from "@/components/social-share";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Wand2, Save, Share2, Upload, RotateCcw, Plus } from "lucide-react";
import { Collage } from "@shared/schema";

const LAYOUTS = [
  { id: "grid2x2", name: "Grid 2x2", cells: 4 },
  { id: "grid3x3", name: "Grid 3x3", cells: 9 },
  { id: "horizontal3", name: "3 Horizontal", cells: 3 },
  { id: "vertical3", name: "3 Vertical", cells: 3 },
  { id: "leftFocus", name: "Left Focus", cells: 3 },
  { id: "rightFocus", name: "Right Focus", cells: 3 },
];

export default function CollageCreator() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>("none");
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

  // Fetch AI styles
  const { data: aiStyles } = useQuery({
    queryKey: ["/api/styles"],
  });

  // Save collage mutation
  const saveMutation = useMutation({
    mutationFn: async (collageData: any) => {
      const response = await apiRequest("POST", "/api/collages", collageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collages"] });
      toast({
        title: "Collage saved successfully",
        description: "Your collage has been saved to your collection.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save collage",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Apply AI style mutation
  const applyStyleMutation = useMutation({
    mutationFn: async ({ imageData, styleId }: { imageData: string; styleId: string }) => {
      console.log("Applying style:", {
        styleId, 
        styleName: aiStyles?.find(s => String(s.id) === styleId)?.name,
        styleParams: aiStyles?.find(s => String(s.id) === styleId)?.apiParams
      });
      const response = await apiRequest("POST", "/api/apply-style", { imageData, styleId });
      return response.json();
    },
    onSuccess: (data) => {
      // Apply the styled image to the canvas
      if (canvasRef && data.styledImage) {
        const ctx = canvasRef.getContext("2d");
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
            ctx.drawImage(img, 0, 0, canvasRef.width, canvasRef.height);
            // Re-add text after applying style
            renderTextOnCanvas();
          };
          img.src = data.styledImage;
          
          // Важно: обновляем исходные изображения, заменяя их на стилизованные
          // Если у нас только одно изображение, заменяем его целиком
          if (sourceImages.length === 1) {
            setSourceImages([data.styledImage]);
          } 
          // Если у нас коллаж с множеством изображений, мы не можем разделить их
          // Поэтому создаем новый массив с одним стилизованным изображением всего коллажа
          else if (sourceImages.length > 1) {
            // Сохраняем стилизованную версию как новый единственный исходный файл
            setSourceImages([data.styledImage]);
          }
        }
      }
      
      toast({
        title: "AI style applied",
        description: "Your collage has been transformed with AI styling.",
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
            setSourceImages((prev) => [...prev, ...newImages].slice(0, selectedLayout.cells));
          }
        }
      };
      
      reader.readAsDataURL(file);
    }

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddText = () => {
    const newId = `text-${textContent.length + 1}`;
    setTextContent((prev) => [
      ...prev,
      {
        id: newId,
        text: "Add your text here",
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

  const handleFilterChange = (filterType: keyof typeof filters, value: number) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const renderTextOnCanvas = () => {
    if (!canvasRef) return;
    
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;
    
    textContent.forEach((item) => {
      ctx.font = `${item.style.fontSize}px ${item.style.fontFamily}`;
      ctx.textAlign = item.style.align as CanvasTextAlign;
      
      // Draw text stroke
      ctx.lineWidth = item.style.strokeWidth;
      ctx.strokeStyle = item.style.strokeColor;
      ctx.strokeText(
        item.text,
        item.position.x,
        item.position.y
      );
      
      // Draw text fill
      ctx.fillStyle = item.style.color;
      ctx.fillText(
        item.text,
        item.position.x,
        item.position.y
      );
    });
  };

  const handleApplyAiStyle = () => {
    if (!canvasRef || selectedAiStyle === "none") return;
    
    const imageData = canvasRef.toDataURL("image/png");
    applyStyleMutation.mutate({ imageData, styleId: selectedAiStyle });
  };

  const handleSaveCollage = () => {
    if (!canvasRef) return;
    
    const imageData = canvasRef.toDataURL("image/png");
    
    const collageData: Partial<Collage> = {
      name: collageName,
      imageUrl: imageData,
      userId: 1, // For now, use a default user ID
      layout: selectedLayout.id,
      sourceImages,
      textContent,
      appliedFilters: [filters],
      aiStyle: selectedAiStyle,
    };
    
    saveMutation.mutate(collageData);
  };

  const handleDownloadCollage = () => {
    if (!canvasRef) return;
    
    const link = document.createElement("a");
    link.download = `${collageName.replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Collage downloaded",
      description: "Your collage has been downloaded successfully.",
    });
  };

  const handleResetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  };

  const handleLayoutChange = (layout: typeof LAYOUTS[0]) => {
    setSelectedLayout(layout);
    // Trim source images if new layout has fewer cells
    if (sourceImages.length > layout.cells) {
      setSourceImages((prev) => prev.slice(0, layout.cells));
    }
  };

  const handleRemoveImage = (index: number) => {
    setSourceImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[500px]">
              <CollageLayoutSelector
                layout={selectedLayout}
                sourceImages={sourceImages}
                filters={filters}
                textContent={textContent}
                onCanvasReady={setCanvasRef}
                onTextRender={renderTextOnCanvas}
                onRemoveImage={handleRemoveImage}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
              disabled={sourceImages.length >= selectedLayout.cells}
            >
              <Upload className="w-4 h-4" />
              Upload Images
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
              Add Text
            </Button>
            <Button
              onClick={handleSaveCollage}
              disabled={sourceImages.length === 0 || saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Collage
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadCollage}
              disabled={sourceImages.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              variant="secondary"
              onClick={handleApplyAiStyle}
              disabled={sourceImages.length === 0 || selectedAiStyle === "none" || applyStyleMutation.isPending}
              className="gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Apply AI Style
            </Button>
            <SocialShare canvasRef={canvasRef} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="collage-name">Collage Name</Label>
                  <Input
                    id="collage-name"
                    value={collageName}
                    onChange={(e) => setCollageName(e.target.value)}
                    placeholder="Enter a name for your collage"
                  />
                </div>
                <div>
                  <Label htmlFor="layout-select">Layout</Label>
                  <Select
                    value={selectedLayout.id}
                    onValueChange={(value) => {
                      const layout = LAYOUTS.find((l) => l.id === value);
                      if (layout) handleLayoutChange(layout);
                    }}
                  >
                    <SelectTrigger id="layout-select">
                      <SelectValue placeholder="Select a layout" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUTS.map((layout) => (
                        <SelectItem key={layout.id} value={layout.id}>
                          {layout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue={showTextEditor ? "text" : "filters"}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="text" onClick={() => setShowTextEditor(true)}>
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="filters" onClick={() => setShowTextEditor(false)}>
                    Filters
                  </TabsTrigger>
                  <TabsTrigger value="ai" onClick={() => setShowTextEditor(false)}>
                    AI Style
                  </TabsTrigger>
                </TabsList>
                <div className="p-6">
                  <TabsContent value="text" className="m-0">
                    {textContent.length > 0 ? (
                      <div className="space-y-4">
                        {textContent.map((item, index) => (
                          <TextEditor
                            key={item.id}
                            areaIndex={index}
                            textId={item.id}
                            label={`Text ${index + 1}`}
                            value={item.text}
                            style={item.style}
                            onChange={(value) => handleTextChange(item.id, value)}
                            onStyleChange={(styleKey, value) => handleTextStyleChange(item.id, styleKey, value)}
                            onRemove={() => {
                              setTextContent((prev) => prev.filter((t) => t.id !== item.id));
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="mb-4 text-muted-foreground">No text elements added yet</p>
                        <Button onClick={handleAddText} variant="outline">
                          Add Text
                        </Button>
                      </div>
                    )}
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
                      styles={aiStyles || []}
                      selectedStyle={selectedAiStyle}
                      onChange={setSelectedAiStyle}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Choose a collage layout</li>
                <li>Upload images for each cell in the layout</li>
                <li>Add text captions if needed</li>
                <li>Apply filters or AI styles to enhance your collage</li>
                <li>Save or download your creation</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
