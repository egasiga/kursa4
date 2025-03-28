import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Image, PenTool, Grid2X2, LayoutTemplate, Home } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();

  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: <Home className="w-5 h-5 mr-2" />,
    },
    {
      title: "Meme Generator",
      href: "/meme-generator",
      icon: <PenTool className="w-5 h-5 mr-2" />,
    },
    {
      title: "Collage Creator",
      href: "/collage-creator",
      icon: <Grid2X2 className="w-5 h-5 mr-2" />,
    },
    {
      title: "Templates",
      href: "/templates",
      icon: <LayoutTemplate className="w-5 h-5 mr-2" />,
    },
  ];

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="container flex justify-between items-center h-16">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center font-bold text-xl text-primary">
              <Image className="w-6 h-6 mr-2" />
              Meme Creator
            </a>
          </Link>
        </div>
        
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md hover:bg-accent transition-colors",
                  location === item.href && "bg-accent text-accent-foreground font-medium"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </a>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
