import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Share2, Facebook, Twitter, Instagram, Copy, Check, Download, Link2, MessageCircle } from "lucide-react";
import { dataUrlToBlob } from "@/lib/image-utils";

interface SocialShareProps {
  canvasRef: HTMLCanvasElement | null;
}

export default function SocialShare({ canvasRef }: SocialShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const shareToFacebook = () => {
    if (!canvasRef) return;
    
    const imageUrl = encodeURIComponent(window.location.origin);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${imageUrl}&quote=Проверьте мой мем, созданный с помощью Meme Generator!`;
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    if (!canvasRef) return;
    
    const text = encodeURIComponent('Проверьте мой мем, созданный с помощью Meme Generator!');
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareToTelegram = () => {
    if (!canvasRef) return;
    
    const text = encodeURIComponent('Проверьте мой мем, созданный с помощью Meme Generator!');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`;
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  // Функция для использования Web Share API, если доступен
  const shareViaWebShareAPI = async (platform: string) => {
    if (!canvasRef) return false;
    
    try {
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvasRef.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error("Failed to convert canvas to Blob");
        }, "image/png");
      });
      
      const imageFile = new File([imageBlob], "meme.png", { type: "image/png" });
      
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          title: "Мой мем",
          text: "Проверьте мой мем, созданный с помощью Meme Generator!",
          files: [imageFile]
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to use Web Share API:", error);
      return false;
    }
  };

  const handleShare = async (platform: string) => {
    if (!canvasRef) {
      toast({
        title: "Ошибка",
        description: "Нет доступного изображения для публикации.",
        variant: "destructive",
      });
      return;
    }

    setSharing(true);
    
    try {
      // Сначала пробуем использовать Web Share API
      const sharedViaAPI = await shareViaWebShareAPI(platform);
      
      if (!sharedViaAPI) {
        // Если Web Share API не сработал, используем специфичные для платформы методы
        switch (platform) {
          case "Facebook":
            shareToFacebook();
            break;
          case "Twitter":
            shareToTwitter();
            break;
          case "Telegram":
            shareToTelegram();
            break;
          default:
            toast({
              title: "Информация",
              description: `Публикация в ${platform} будет доступна в ближайшем обновлении.`,
            });
        }
      }
      
      toast({
        title: "Успешно!",
        description: `Мем отправлен для публикации в ${platform}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось поделиться изображением",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef) {
      toast({
        title: "Ошибка",
        description: "Нет доступного изображения для копирования.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Конвертируем canvas в blob
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error("Failed to convert canvas to Blob");
        }, "image/png");
      });

      // Создаем ClipboardItem и копируем в буфер обмена
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      
      setCopied(true);
      
      toast({
        title: "Скопировано в буфер обмена",
        description: "Изображение скопировано в буфер обмена",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy image to clipboard:", error);
      toast({
        title: "Не удалось скопировать",
        description: "Ваш браузер может не поддерживать эту функцию",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!canvasRef || !downloadLinkRef.current) {
      toast({
        title: "Ошибка",
        description: "Нет доступного изображения для скачивания.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataUrl = canvasRef.toDataURL("image/png");
      downloadLinkRef.current.href = dataUrl;
      downloadLinkRef.current.download = `meme-${Date.now()}.png`;
      downloadLinkRef.current.click();
      
      toast({
        title: "Скачивание",
        description: "Мем сохраняется на ваше устройство",
      });
    } catch (error) {
      console.error("Failed to download image:", error);
      toast({
        title: "Ошибка скачивания",
        description: "Не удалось сохранить изображение",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    // В настоящем приложении здесь был бы код для получения уникальной ссылки на мем
    // Сейчас просто симулируем функциональность
    const dummyUrl = window.location.href;
    
    navigator.clipboard.writeText(dummyUrl)
      .then(() => {
        setLinkCopied(true);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на ваш мем скопирована в буфер обмена",
        });
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy link:", error);
        toast({
          title: "Ошибка копирования",
          description: "Не удалось скопировать ссылку",
          variant: "destructive",
        });
      });
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Поделиться
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Поделиться своим творением</DialogTitle>
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
            
            <div className="grid grid-cols-4 gap-3">
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
                onClick={() => handleShare("Telegram")}
                disabled={sharing}
              >
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="text-xs">Telegram</span>
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
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="gap-2"
                onClick={handleCopyToClipboard}
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Скопировать</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="secondary"
                className="gap-2"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                <span>Скачать</span>
              </Button>
            </div>
            
            <div className="mt-3">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCopyLink}
                disabled={linkCopied}
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ссылка скопирована!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Копировать ссылку</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Скрытая ссылка для скачивания изображения */}
      <a 
        href="#" 
        ref={downloadLinkRef} 
        style={{ display: "none" }} 
        download="meme.png"
      />
    </>
  );
}
