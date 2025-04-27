import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MemeGenerator from "@/pages/meme-generator";
import SimpleMemeGenerator from "@/pages/simple-meme-generator";
import CollageCreator from "@/pages/collage-creator";
import Templates from "@/pages/templates";
import ImageEditor from "@/pages/image-editor";
import Navbar from "@/components/navbar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/meme-generator" component={MemeGenerator} />
      <Route path="/meme-generator/:id" component={MemeGenerator} />
      {/* Добавляем синоним для страницы генератора мемов */}
      <Route path="/memes" component={MemeGenerator} />
      <Route path="/memes/:id" component={MemeGenerator} />
      {/* Новая страница генератора мемов (упрощенная) */}
      <Route path="/simple-meme" component={SimpleMemeGenerator} />
      <Route path="/simple-meme/:id" component={SimpleMemeGenerator} />
      <Route path="/collage-creator" component={CollageCreator} />
      <Route path="/templates" component={Templates} />
      <Route path="/editor" component={ImageEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
