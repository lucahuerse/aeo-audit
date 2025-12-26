"use client";

import { Report } from "@/lib/schemas";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, CheckCircle, Flame, Lock, ArrowRight, Zap, PlayCircle, CalendarCheck, Mail, Info, X, Check } from "lucide-react";
import { motion } from "framer-motion";

export function ReportView({ report }: { report: Report }) {
  
  // Color helper based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500 border-green-500";
    if (s >= 50) return "text-yellow-500 border-yellow-500";
    return "text-red-500 border-red-500";
  };

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="pb-24 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      
      {/* ABOVE THE FOLD */}
      <div className="text-center space-y-6 pt-6">
         {/* Meta */}
         <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {report.lead.domain} • AEO Audit
         </div>

         {/* Score */}
         <div className="relative inline-flex items-center justify-center">
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${getScoreColor(report.score)} bg-black/20 backdrop-blur-md shadow-[0_0_30px_-5px_currentColor]`}>
                <div className="text-center">
                    <span className="block text-4xl font-extrabold tracking-tighter text-foreground">{report.score}</span>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Readiness</span>
                </div>
            </div>
         </div>

         {/* Summary */}
         <div className="max-w-md mx-auto px-4">
             <p className="text-lg font-medium leading-relaxed text-foreground/90">
               {report.summary}
             </p>
         </div>
      </div>

      <div className="px-4 space-y-8">

        {/* SUB-SCORES BREAKDOWN */}
        {report.subScores && report.details && (
            <section className="space-y-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap className="text-purple-500 w-5 h-5" />
                    Detail-Analyse
                </h3>
                <div className="grid gap-4">
                    {[
                        { key: "meta", label: "Meta & Technik", icon: "⚙️" },
                        { key: "structure", label: "Struktur & Inhalt", icon: "📑" },
                        { key: "entity", label: "Entity & Angebot", icon: "🏷️" },
                        { key: "trust", label: "Trust & Kontakt", icon: "🤝" },
                        { key: "answerability", label: "Answerability", icon: "💡" },
                    ].map((cat: any) => {
                        const score = (report.subScores as any)[cat.key];
                        const detail = (report.details as any)[cat.key];
                        return (
                            <Accordion type="single" collapsible key={cat.key} className="w-full">
                                <AccordionItem value={cat.key} className="border-white/10 rounded-lg bg-black/20 backdrop-blur-md overflow-hidden">
                                    <AccordionTrigger className="hover:no-underline px-4 py-3 flex justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${getScoreColor(score)} bg-black/40`}>
                                                {score}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-white">{cat.label}</div>
                                                <div className="text-xs text-muted-foreground">{detail.issues.length === 0 ? "Perfekt optimiert" : detail.issues.length === 1 ? "1 Problem gefunden" : `${detail.issues.length} Probleme gefunden`}</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        <div className="space-y-3 pt-2">
                                            {/* Issues */}
                                            {detail.issues.length > 0 && (
                                                <div className="space-y-1">
                                                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Probleme</span>
                                                    <ul className="space-y-1">
                                                        {detail.issues.map((issue: string, i: number) => (
                                                            <li key={i} className="text-sm text-white/80 flex gap-2 items-start">
                                                                <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                                <span>{issue}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                    {/* Positive */}
                                    {detail.positive.length > 0 && (
                                        <div className="space-y-1 mt-3">
                                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Gut gelöst</span>
                                            <ul className="space-y-1">
                                                {detail.positive.map((pos: string, i: number) => (
                                                    <li key={i} className="text-sm text-white/80 flex gap-2 items-start">
                                                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                        <span>{pos}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        );
                    })}
                </div>
            </section>
        )}
          
          {/* CRITICAL ISSUES */}
          <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <AlertTriangle className="text-red-500 w-5 h-5" />
                 Kritische Punkte
              </h3>
              <Accordion type="single" collapsible className="w-full space-y-3">
                 {report.sections.criticalIssues.map((issue, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`} className="border-white/10 rounded-lg bg-black/20 backdrop-blur-md px-4">
                       <AccordionTrigger className="hover:no-underline py-4">
                          <div className="text-left w-full">
                             <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{issue.title}</span>
                                {issue.severity === "high" && <Badge variant="destructive" className="text-[10px] h-5">HIGH</Badge>}
                             </div>
                             <p className="text-sm text-muted-foreground font-normal line-clamp-1">{issue.impact}</p>
                          </div>
                       </AccordionTrigger>
                       <AccordionContent className="pb-4">
                          <div className="space-y-3 text-sm">
                             <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                                <span className="font-bold text-red-500 block mb-1">Auswirkung:</span>
                                {issue.impact}
                             </div>
                             <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                                <span className="font-bold text-green-500 block mb-1">Der Fix:</span>
                                {issue.fix}
                             </div>
                          </div>
                       </AccordionContent>
                    </AccordionItem>
                 ))}
              </Accordion>
          </section>

          {/* CTA MID-CONTENT */}
          <Card className="bg-gradient-to-br from-ether-primary/20 to-black/40 border-white/10 backdrop-blur-md overflow-hidden relative shadow-[0_0_40px_-10px_rgba(82,39,255,0.3)]">
              <div className="absolute top-0 right-0 p-8 opacity-20">
                 <Flame className="w-24 h-24 text-ether-secondary" />
              </div>
              <CardContent className="p-6 space-y-4 relative z-10">
                 <h3 className="text-xl font-bold text-white">Willst du das in 14 Tagen fixen?</h3>
                 <p className="text-sm text-white/80">
                    Die meisten Fehler lassen sich schnell beheben. Ich zeige dir im Call die 3 größten Hebel für {report.lead.company}.
                 </p>
                 <Button className="w-full font-bold bg-white text-black hover:bg-white/90" onClick={() => window.open(report.cta.bookingUrl, '_blank')}>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Erstgespräch buchen
                 </Button>
              </CardContent>
          </Card>

          {/* SIMULATION */}
          <section>
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PlayCircle className="text-blue-500 w-5 h-5" />
                Empfehlbarkeits-Simulation
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors ml-1">
                      <Info className="w-4 h-4" />
                      <span className="sr-only">Info zur Simulation</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-black/80 backdrop-blur-xl border-white/10 text-white p-4">
                    <h4 className="font-semibold mb-2">Wie funktioniert das?</h4>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Wir analysieren deine Inhalte und simulieren mithilfe von KI, wie Antwortmaschinen wie ChatGPT auf Nutzerfragen reagieren könnten.
                    </p>
                  </PopoverContent>
                </Popover>
             </h3>
             
             <Carousel setApi={setApi} className="w-full">
                <CarouselContent className="items-stretch">
                   {report.sections.simulation.map((sim, idx) => (
                      <CarouselItem key={idx}>
                         <div className="p-1 h-full">
                            <Card className="bg-black/20 backdrop-blur-md border-white/10 h-full flex flex-col">
                               <CardHeader className="pb-2">
                                  <div className="flex justify-between items-center mb-2">
                                     <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Query {idx + 1}</CardTitle>
                                     <span className="text-xs text-muted-foreground">{idx + 1} / {report.sections.simulation.length}</span>
                                  </div>
                                  <p className="font-serif italic text-lg text-white/90">"{sim.query}"</p>
                               </CardHeader>
                               <CardContent className="space-y-4 pt-2 flex-1 flex flex-col justify-between">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                     <div>
                                        <span className="block font-bold text-green-500 mb-1">Erwartung</span>
                                        <div className="text-white/80">{sim.expected}</div>
                                     </div>
                                     <div>
                                        <span className="block font-bold text-red-500 mb-1">Realität</span>
                                        <div className="text-white/80">{sim.result}</div>
                                     </div>
                                  </div>
                                  <div className="text-xs bg-white/5 p-3 rounded border border-white/10 mt-auto">
                                     <span className="font-bold text-white/90">Analyse:</span> <span className="text-white/70">{sim.note}</span>
                                  </div>
                               </CardContent>
                            </Card>
                         </div>
                      </CarouselItem>
                   ))}
                </CarouselContent>
                <div className="flex justify-center gap-2 mt-4">
                   {Array.from({ length: count }).map((_, index) => (
                      <button
                         key={index}
                         className={`h-2 w-2 rounded-full transition-colors ${
                            index === current - 1 ? "bg-white" : "bg-white/20"
                         }`}
                         onClick={() => api?.scrollTo(index)}
                         aria-label={`Go to slide ${index + 1}`}
                      />
                   ))}
                </div>
             </Carousel>
          </section>

          {/* QUICK WINS */}
          <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <Zap className="text-yellow-500 w-5 h-5" />
                 Quick Wins (unter 30 min)
              </h3>
              <div className="space-y-3">
                 {report.sections.quickWins.map((win, idx) => (
                    <div key={idx} className="flex gap-4 p-4 border border-white/10 rounded-lg bg-black/20 backdrop-blur-md items-start">
                        <div className="bg-primary/10 p-2 rounded-full shrink-0">
                            <CheckCircle className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-white/90">{win.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{win.how}</p>
                            <Badge variant="outline" className="mt-2 text-[10px] border-white/20 text-white/60">{win.effort.toUpperCase()} EFFORT</Badge>
                        </div>
                    </div>
                 ))}
              </div>
          </section>

          {/* READABILITY METRICS */}
          <section>
              <h3 className="text-lg font-bold mb-4">Readiness Metrics</h3>
              <div className="grid grid-cols-3 gap-2">
                  {report.sections.llmReadability.map((metric, idx) => (
                      <Card key={idx} className="text-center py-4 bg-black/20 backdrop-blur-md border-white/10">
                          <div className="text-2xl font-bold text-white/90">{metric.value}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{metric.label}</div>
                      </Card>
                  ))}
              </div>
          </section>
      </div>

      {/* STICKY BOTTOM CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-xl border-t border-white/10 z-50 md:sticky md:bottom-4 md:mx-auto md:max-w-md md:rounded-xl md:border md:shadow-2xl">
          <div className="flex gap-2">
             <Button className="flex-1 font-bold shadow-lg shadow-purple-500/20 bg-white text-black hover:bg-white/90" size="lg" onClick={() => window.open(report.cta.bookingUrl, '_blank')}>
                Erstgespräch buchen
             </Button>
             <Button variant="outline" size="icon" className="shrink-0 border-white/10 bg-white/5 hover:bg-white/10">
                <Mail className="w-5 h-5 text-white" />
             </Button>
          </div>
      </div>

    </div>
  );
}
