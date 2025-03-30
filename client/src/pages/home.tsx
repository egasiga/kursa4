import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Grid2X2, LayoutTemplate, ArrowRight, Wand2, Image, Folder, Download, CircleHelp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Боковая панель, как в настольном приложении */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 text-white">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Быстрый доступ</h3>
            <div className="space-y-1">
              <Link href="/meme-generator">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer">
                  <PenTool className="w-5 h-5" />
                  <span>Генератор мемов</span>
                </div>
              </Link>
              <Link href="/collage-creator">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer">
                  <Grid2X2 className="w-5 h-5" />
                  <span>Создание коллажей</span>
                </div>
              </Link>
              <Link href="/templates">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer">
                  <LayoutTemplate className="w-5 h-5" />
                  <span>Шаблоны</span>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Инструменты</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer">
                <Image className="w-5 h-5" />
                <span>Галерея изображений</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer">
                <Wand2 className="w-5 h-5" />
                <span>AI Стили</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer">
                <Folder className="w-5 h-5" />
                <span>Мои проекты</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer">
              <Download className="w-5 h-5" />
              <span>Обновления</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer">
              <CircleHelp className="w-5 h-5" />
              <span>Справка</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Основное содержимое */}
      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        <section className="text-center mb-12 space-y-4 bg-white p-8 shadow-sm rounded-lg">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Создавайте потрясающие мемы и коллажи
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Создавайте великолепные мемы и коллажи с помощью стилей на основе ИИ за считанные минуты. Опыт дизайна не требуется.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link href="/meme-generator">
              <Button size="lg" className="gap-2">
                <PenTool className="w-5 h-5" />
                Создать мем
              </Button>
            </Link>
            <Link href="/collage-creator">
              <Button size="lg" variant="outline" className="gap-2">
                <Grid2X2 className="w-5 h-5" />
                Создать коллаж
              </Button>
            </Link>
          </div>
        </section>

        <h2 className="text-xl font-bold mb-4 text-black">Доступные функции</h2>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm bg-slate-800">
            <CardHeader className="pb-2">
              <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mb-2 border border-slate-700">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Генератор мемов</CardTitle>
              <CardDescription className="text-slate-300">
                Создавайте смешные мемы из нашей коллекции шаблонов или загрузите свои
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-200">
                <li>Выбор из популярных шаблонов мемов</li>
                <li>Добавление текста со стилизованными шрифтами</li>
                <li>Точное позиционирование текста</li>
                <li>Сохранение и публикация ваших творений</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/meme-generator">
                <Button variant="outline" className="gap-2 text-white bg-slate-700 hover:bg-slate-600">
                  Создать мем <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-sm bg-slate-800">
            <CardHeader className="pb-2">
              <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mb-2 border border-slate-700">
                <Grid2X2 className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Создание коллажей</CardTitle>
              <CardDescription className="text-slate-300">
                Объединяйте несколько изображений в красивые коллажи с различными макетами
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-200">
                <li>Выбор из множества шаблонов макетов</li>
                <li>Загрузка собственных изображений</li>
                <li>Изменение размера и положения изображений</li>
                <li>Добавление текстовых подписей</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/collage-creator">
                <Button variant="outline" className="gap-2 text-white bg-slate-700 hover:bg-slate-600">
                  Создать коллаж <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-sm bg-slate-800">
            <CardHeader className="pb-2">
              <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mb-2 border border-slate-700">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">AI Стилизация</CardTitle>
              <CardDescription className="text-slate-300">
                Применяйте ИИ-стили для преобразования ваших мемов и коллажей
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-200">
                <li>Выбор из различных художественных стилей</li>
                <li>Превращение мемов в картины маслом</li>
                <li>Применение комикс-эффектов и пиксель-арта</li>
                <li>Создание уникальных эстетических стилей</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/meme-generator">
                <Button variant="outline" className="gap-2 text-white bg-slate-700 hover:bg-slate-600">
                  Попробовать AI стили <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-xl font-bold text-black">Готовы к творчеству? Просмотрите наши шаблоны</h2>
            <p className="text-slate-600">
              Начните с просмотра нашей коллекции шаблонов мемов или загрузите собственные изображения
            </p>
            <Link href="/templates">
              <Button variant="default" className="gap-2">
                <LayoutTemplate className="w-5 h-5" />
                Просмотр шаблонов
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
