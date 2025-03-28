import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Share2, Facebook, Twitter, Instagram, Copy, Check } from "lucide-react";

interface SocialShareProps {
  canvasRef: HTMLCanvasElement | null;
}

export default function SocialShare({ canvasRef }: SocialShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = (platform: string) => {
    if (!canvasRef) {
      toast({
        title: "Error",
        description: "No image available to share.",
        variant: "destructive",
      });
      return;
    }

    const imageData = canvasRef.toDataURL("image/png");
    
    // In a real implementation, this would handle platform-specific sharing
    // For now, we'll just show a toast message
    setSharing(true);
    
    setTimeout(() => {
      setSharing(false);
      toast({
        title: "Sharing not implemented",
        description: `Sharing to ${platform} would happen here in a production app.`,
      });
    }, 1000);
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef) {
      toast({
        title: "Error",
        description: "No image available to copy.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error("Failed to convert canvas to Blob");
        }, "image/png");
      });

      // Create a ClipboardItem and copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      
      setCopied(true);
      
      toast({
        title: "Copied to clipboard",
        description: "Image has been copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy image to clipboard:", error);
      toast({
        title: "Failed to copy",
        description: "Your browser may not support this feature",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your creation</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {canvasRef && (
            <div className="mb-4 flex justify-center">
              <img
                src={canvasRef.toDataURL("image/png")}
                alt="Preview"
                className="max-w-full max-h-[200px] object-contain rounded-md border"
              />
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-2"
              onClick={() => handleShare("Facebook")}
              disabled={sharing}
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-xs">Facebook</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-2"
              onClick={() => handleShare("Twitter")}
              disabled={sharing}
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-xs">Twitter</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-2"
              onClick={() => handleShare("Instagram")}
              disabled={sharing}
            >
              <Instagram className="w-5 h-5 text-pink-600" />
              <span className="text-xs">Instagram</span>
            </Button>
          </div>
          
          <div className="mt-4">
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={handleCopyToClipboard}
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
