import { LeadForm } from "@/components/lead-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";


export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
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
            Is your website
            <br />
            <span className="text-primary block mt-1">AI-ready?</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-[320px] mx-auto pt-2">
            Free audit of how ChatGPT, Gemini & Perplexity discover, understand, and recommend your site.
          </p>
        </div>

        {/* Form Card */}
        <Card className="w-full transition-shadow duration-500">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-white/90">Start your audit</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
