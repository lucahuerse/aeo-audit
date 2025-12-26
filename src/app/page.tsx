import { LeadForm } from "@/components/lead-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

import Particles from "@/components/Particles";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={['#ffffff', '#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>
      <div className="relative z-10 w-full max-w-lg space-y-8 flex flex-col items-center">
        
        {/* Header / Brand */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="relative w-48 h-12">
            <Image 
              src="/logo.png" 
              alt="huerse studios" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
            LLM Discoverability
            <br />
            <span className="text-primary block mt-1">Website Check</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-[300px] mx-auto pt-2">
            Wir prüfen, wie gut deine Website von ChatGPT & Gemini verstanden und empfohlen wird.
          </p>
        </div>

        {/* Form Card */}
        <Card className="w-full border-border/50 bg-card shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Jetzt Analyse starten</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
