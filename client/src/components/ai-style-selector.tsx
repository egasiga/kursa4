import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Wand2 } from "lucide-react";
import { AiStyle } from "@shared/schema";

interface AiStyleSelectorProps {
  styles: AiStyle[];
  selectedStyle: string;
  onChange: (styleId: string) => void;
}

export default function AiStyleSelector({
  styles,
  selectedStyle,
  onChange,
}: AiStyleSelectorProps) {
  if (!styles || styles.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading AI styles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-primary" />
        <h3 className="font-medium">AI Style Effects</h3>
      </div>
      
      <ScrollArea className="h-[250px] pr-4">
        <RadioGroup
          value={selectedStyle}
          onValueChange={onChange}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 rounded-md border p-2">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none" className="flex-1 cursor-pointer">
              No Style (Original)
            </Label>
          </div>
          
          {styles.map((style) => (
            <div
              key={style.id}
              className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent transition-colors"
            >
              <RadioGroupItem
                value={String(style.id)}
                id={`style-${style.id}`}
              />
              <Label
                htmlFor={`style-${style.id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium">{style.name}</div>
                <div className="text-sm text-muted-foreground">
                  {style.description}
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </ScrollArea>
      
      <div className="text-sm text-muted-foreground">
        Select an AI style to transform your image. This will apply artistic effects using AI algorithms.
      </div>
    </div>
  );
}
