"use client";

import { Report } from "@/lib/schemas";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming tabs installed
import { AlertTriangle, CheckCircle, Flame, Lock, ArrowRight, Zap, PlayCircle, CalendarCheck, Mail } from "lucide-react";
import { motion } from "framer-motion";

export function ReportView({ report }: { report: Report }) {
  
  // Color helper based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500 border-green-500";
    if (s >= 50) return "text-yellow-500 border-yellow-500";
    return "text-red-500 border-red-500";
  };

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
             </h3>
             <Tabs defaultValue="sim-0" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto bg-black/20 backdrop-blur-md border border-white/10">
                    {report.sections.simulation.map((sim, idx) => (
                        <TabsTrigger key={idx} value={`sim-${idx}`} className="min-w-[100px] data-[state=active]:bg-white/10 data-[state=active]:text-white">
                           Query {idx + 1}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {report.sections.simulation.map((sim, idx) => (
                    <TabsContent key={idx} value={`sim-${idx}`} className="mt-4">
                        <Card className="bg-black/20 backdrop-blur-md border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">User fragt:</CardTitle>
                                <p className="font-serif italic text-lg text-white/90">"{sim.query}"</p>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block font-bold text-green-500 mb-1">Erwartung</span>
                                        <div className="text-white/80">{sim.expected}</div>
                                    </div>
                                    <div>
                                        <span className="block font-bold text-red-500 mb-1">Realität</span>
                                        <div className="text-white/80">{sim.result}</div>
                                    </div>
                                </div>
                                <div className="text-xs bg-white/5 p-3 rounded border border-white/10">
                                    <span className="font-bold text-white/90">Analyse:</span> <span className="text-white/70">{sim.note}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
             </Tabs>
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
