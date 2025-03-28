import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Grid2X2, LayoutTemplate, ArrowRight, Wand2 } from "lucide-react";

export default function Home() {
  return (
    <div className="container py-8 space-y-12">
      <section className="text-center py-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Create Amazing Memes and Collages
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Design stunning memes and collages with AI-powered styling in minutes. No design experience needed.
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <Link href="/meme-generator">
            <Button size="lg" className="gap-2">
              <PenTool className="w-5 h-5" />
              Create a Meme
            </Button>
          </Link>
          <Link href="/collage-creator">
            <Button size="lg" variant="outline" className="gap-2">
              <Grid2X2 className="w-5 h-5" />
              Make a Collage
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <PenTool className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Meme Generator</CardTitle>
            <CardDescription>
              Create hilarious memes from our collection of templates or upload your own
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Choose from popular meme templates</li>
              <li>Add custom text with stylized fonts</li>
              <li>Position text precisely where you want it</li>
              <li>Save and share your creations</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/meme-generator">
              <Button variant="ghost" className="gap-2">
                Create a Meme <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Grid2X2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Collage Creator</CardTitle>
            <CardDescription>
              Combine multiple images into beautiful collages with various layouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Choose from multiple layout templates</li>
              <li>Upload your own images</li>
              <li>Resize and reposition images</li>
              <li>Add text overlays and captions</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/collage-creator">
              <Button variant="ghost" className="gap-2">
                Create a Collage <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>AI Styling</CardTitle>
            <CardDescription>
              Apply AI-powered styles to transform your memes and collages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Choose from various artistic styles</li>
              <li>Transform memes into oil paintings</li>
              <li>Apply comic book or pixel art effects</li>
              <li>Create unique watercolor or vaporwave aesthetics</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/meme-generator">
              <Button variant="ghost" className="gap-2">
                Try AI Styling <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </section>

      <section className="bg-accent/50 py-10 px-6 rounded-lg">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">Ready to create? Browse our templates</h2>
          <p className="text-muted-foreground">
            Get started by browsing our collection of meme templates or upload your own images
          </p>
          <Link href="/templates">
            <Button variant="default" className="gap-2">
              <LayoutTemplate className="w-5 h-5" />
              Browse Templates
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
