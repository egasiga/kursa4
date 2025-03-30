import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Image, PenTool, Grid2X2, LayoutTemplate, Home, Settings, Wand2 } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();

  const navItems = [
    {
      title: "Главная",
      href: "/",
      icon: <Home className="w-5 h-5 mr-2" />,
    },
    {
      title: "Редактор",
      href: "/editor",
      icon: <Wand2 className="w-5 h-5 mr-2" />,
    },
    {
      title: "Генератор Мемов",
      href: "/meme-generator",
      icon: <PenTool className="w-5 h-5 mr-2" />,
    },
    {
      title: "Создание Коллажей",
      href: "/collage-creator",
      icon: <Grid2X2 className="w-5 h-5 mr-2" />,
    },
    {
      title: "Шаблоны",
      href: "/templates",
      icon: <LayoutTemplate className="w-5 h-5 mr-2" />,
    },
  ];

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
      <div className="flex justify-between items-center h-12 px-4">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center font-bold text-xl text-white cursor-pointer">
              <Image className="w-6 h-6 mr-2" />
              МемМастер Pro
            </div>
          </Link>
        </div>
        
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-3 py-1 rounded-md text-sm hover:bg-slate-700 transition-colors text-white cursor-pointer",
                  location === item.href && "bg-slate-700 font-medium"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </div>
            </Link>
          ))}
          <button className="flex items-center px-3 py-1 rounded-md text-sm hover:bg-slate-700 transition-colors text-white">
            <Settings className="w-5 h-5 mr-2" />
            <span>Настройки</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
