import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemeTemplate } from "@shared/schema";
import { Edit } from "lucide-react";

interface MemeTemplateCardProps {
  template: MemeTemplate;
}

export default function MemeTemplateCard({ template }: MemeTemplateCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="aspect-square relative overflow-hidden">
        <img
          src={template.imageUrl}
          alt={template.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link href={`/meme-generator/${template.id}`}>
            <Button variant="secondary" className="gap-2">
              <Edit className="w-4 h-4" />
              Create Meme
            </Button>
          </Link>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium truncate">{template.name}</h3>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/meme-generator/${template.id}`} className="w-full">
          <Button variant="outline" className="w-full">Use Template</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
