import { LeadForm } from "@/components/lead-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

import LiquidEther from "@/components/LiquidEther";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.2}
          autoIntensity={1.5}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
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
        <Card className="w-full border-white/10 bg-black/20 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(82,39,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(82,39,255,0.5)] transition-shadow duration-500">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg text-white/90">Jetzt Analyse starten</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
