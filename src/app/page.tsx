import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Sparkles, UploadCloud, Download, Video } from 'lucide-react';
import Image from 'next/image'; // Use next/image

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="flex justify-center w-full py-12 md:py-24 lg:py-32 xl:py-24 bg-gradient-to-b from-secondary/50 to-background">
        <div className="container px-4 md:px-6 text-center">
          <div className="space-y-4">
             <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
               Give Your Images an <span className="text-primary">Artistic Edge</span>
             </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              With <span className="font-semibold text-primary">TearDrop</span>, effortlessly apply unique torn paper effects and realistic drop shadows to your photos. Create stunning visuals in seconds.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow duration-300 text-white">
                <Link href="/create" target='_blank'>Create Your Torn Image Now</Link>
              </Button>
            </div>
          </div>
          <div className="mt-12 flex justify-center">
             {/* Placeholder Image showcasing the effect */}
             <Image
                src="https://picsum.photos/800/450" // Replace with an actual example image later
                alt="Example of Torn Edge Effect"
                width={800}
                height={450}
                className="rounded-lg shadow-2xl border border-border aspect-video object-cover"
                priority // Load this image first
             />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="flex justify-center w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">Features</h2>
            <p className="max-w-[600px] mx-auto text-muted-foreground md:text-lg">
              Everything you need to transform your images.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-card shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                 <div className="bg-primary/10 p-3 rounded-full">
                    <Scissors className="h-6 w-6 text-primary" />
                 </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">Torn Edge Effect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Apply an authentic-looking torn paper border. Control the intensity and style of the tear for the perfect look.
                </p>
              </CardContent>
            </Card>
             <Card className="bg-card shadow-md hover:shadow-lg transition-shadow duration-300">
               <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                     <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                 <CardTitle className="text-xl font-semibold text-card-foreground">Customizable Shadow</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-muted-foreground">
                   Add depth with a realistic drop shadow. Adjust direction, intensity, and color to match your image.
                 </p>
               </CardContent>
             </Card>
            <Card className="bg-card shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                 <div className="bg-primary/10 p-3 rounded-full">
                    <UploadCloud className="h-6 w-6 text-primary" />
                 </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">Easy Image Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Quickly upload images from your device using drag-and-drop or file selection.
                </p>
              </CardContent>
            </Card>
             <Card className="bg-card shadow-md hover:shadow-lg transition-shadow duration-300">
               <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                     <Video className="h-6 w-6 text-primary" />
                  </div>
                 <CardTitle className="text-xl font-semibold text-card-foreground">Animated Export</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-muted-foreground">
                    Bring your creations to life! Export images with a subtle paper tremble animation as MP4 or WebM video.
                 </p>
               </CardContent>
             </Card>
              <Card className="bg-card shadow-md hover:shadow-lg transition-shadow duration-300">
               <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                     <Download className="h-6 w-6 text-primary" />
                  </div>
                 <CardTitle className="text-xl font-semibold text-card-foreground">Static PNG Export</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-muted-foreground">
                    Download your final image as a high-quality, transparent PNG file, perfect for any background.
                 </p>
               </CardContent>
             </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 md:py-8 border-t border-border mt-auto bg-secondary/30">
        <div className="container px-4 md:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TearDrop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
