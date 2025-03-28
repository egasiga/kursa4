import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { CirclePicker } from "react-color";
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";

interface TextEditorProps {
  areaIndex: number;
  textId?: string;
  label: string;
  defaultText?: string;
  value: string;
  style: any;
  onChange: (value: string) => void;
  onStyleChange: (styleKey: string, value: any) => void;
  onRemove?: () => void;
}

const FONT_FAMILIES = [
  "Arial",
  "Impact",
  "Comic Sans MS",
  "Tahoma",
  "Verdana",
  "Times New Roman",
  "Courier New",
];

export default function TextEditor({
  areaIndex,
  textId,
  label,
  defaultText = "",
  value,
  style,
  onChange,
  onStyleChange,
  onRemove,
}: TextEditorProps) {
  return (
    <div className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
      <div className="flex justify-between items-center">
        <Label htmlFor={`text-${areaIndex}`}>{label}</Label>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Input
        id={`text-${areaIndex}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultText || "Enter text"}
      />
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`font-family-${areaIndex}`} className="text-xs mb-1 block">
            Font
          </Label>
          <Select
            value={style.fontFamily}
            onValueChange={(value) => onStyleChange("fontFamily", value)}
          >
            <SelectTrigger id={`font-family-${areaIndex}`} className="h-8">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor={`font-size-${areaIndex}`} className="text-xs mb-1 block">
            Size: {style.fontSize}px
          </Label>
          <Slider
            id={`font-size-${areaIndex}`}
            value={[style.fontSize]}
            min={12}
            max={72}
            step={1}
            onValueChange={(values) => onStyleChange("fontSize", values[0])}
            className="h-8"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Text Color</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-full justify-start gap-2"
                style={{ color: style.color }}
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: style.color }}
                />
                <span>{style.color}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <CirclePicker
                color={style.color}
                onChange={(color) => onStyleChange("color", color.hex)}
                colors={[
                  "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF",
                  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
                ]}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <Label className="text-xs mb-1 block">Stroke Color</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-full justify-start gap-2"
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: style.strokeColor }}
                />
                <span>{style.strokeColor}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <CirclePicker
                color={style.strokeColor}
                onChange={(color) => onStyleChange("strokeColor", color.hex)}
                colors={[
                  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
                  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
                ]}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div>
          <Label className="text-xs mb-1 block">Stroke Width: {style.strokeWidth}</Label>
          <Slider
            value={[style.strokeWidth]}
            min={0}
            max={10}
            step={0.5}
            onValueChange={(values) => onStyleChange("strokeWidth", values[0])}
            className="w-32"
          />
        </div>
        
        <div className="ml-auto">
          <Label className="text-xs mb-1 block">Alignment</Label>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              type="button"
              variant={style.align === "left" ? "default" : "ghost"}
              className="h-8 w-8 p-0 rounded-none"
              onClick={() => onStyleChange("align", "left")}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={style.align === "center" ? "default" : "ghost"}
              className="h-8 w-8 p-0 rounded-none"
              onClick={() => onStyleChange("align", "center")}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={style.align === "right" ? "default" : "ghost"}
              className="h-8 w-8 p-0 rounded-none"
              onClick={() => onStyleChange("align", "right")}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
