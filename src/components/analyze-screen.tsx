"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, CheckCircle2, AlertCircle, Lock, ArrowRight, Mail } from "lucide-react";
import { Lead } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEPS = [
  "Website wird abgerufen & geprüft...",
  "Struktur wird analysiert (Titles, Headings)...",
  "LLM-Lesbarkeit wird bewertet...",
  "Empfehlbarkeit wird simuliert...",
  "Quick Wins & kritische Punkte werden formuliert...",
  "Report wird finalisiert...",
];

const TIPS = [
  "Websites mit klarer Leistungsseite werden von LLMs häufiger korrekt eingeordnet.",
  "FAQs helfen LLMs, dich für konkrete Fragen zu empfehlen.",
  "Ein eindeutiger H1 + klare Value Proposition erhöhen die ‘AI Readiness’.",
  "Zu viel JS ohne SSR kann die Textextraktion erschweren.",
  "Kontakt & Standort sichtbar = bessere lokale Zuordnung.",
];

export function AnalyzeScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Generate ID immediately on client side
  const [reportId, setReportId] = useState<string | null>(() => {
      // Check if window is defined (browser)
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
          return window.crypto.randomUUID();
      }
      return null; 
  });
  
  const [isAnalyzed, setIsAnalyzed] = useState(false); // Analysis done, waiting for email
  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  
  // Ref to prevent double-execution in React Strict Mode
  const analysisStarted = useRef(false);

  // Extract lead data
  const leadData: Lead = {
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || "",
    email: searchParams.get("email") || "", // likely empty now
    domain: searchParams.get("domain") || "",
  };

  useEffect(() => {
    // Prevent double execution
    if (analysisStarted.current) return;
    
    // Start Analysis
    const startAnalysis = async () => {
      // Mark as started immediately
      analysisStarted.current = true;
    
      try {
        // Ensure we have an ID (fallback for older browsers if state init failed)
        let currentReportId = reportId;
        if (!currentReportId) {
             currentReportId = crypto.randomUUID();
             setReportId(currentReportId);
        }

        if (!leadData.name || !leadData.domain) {
           console.warn("Missing data");
        }

        const apiPromise = fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...leadData, id: currentReportId }),
        }).then((res) => {
          if (!res.ok) throw new Error("Analysis failed");
          return res.json();
        });

        // Min wait time to show animations (e.g. 5 seconds)
        const waitPromise = new Promise((resolve) => setTimeout(resolve, 5000));

        const [data] = await Promise.all([apiPromise, waitPromise]);
        
        // Finalize progress
        setProgress(100);
        
        if (data.id) {
            // ID confirms success
            setIsAnalyzed(true);
        } else {
            setError("Keine Report ID zurückbekommen.");
        }

      } catch (err) {
        console.error(err);
        setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
    };

    startAnalysis();
  }, []); // Dependence on reportId not needed if we use ref logic carefully, but safe to leave empty as we only want mount logic

  // Progress Animation Interval
  useEffect(() => {
    if (error || isAnalyzed) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Hold at 95 until API done
        // Variable speed
        const inc = Math.random() * 5; 
        return Math.min(prev + inc, 95);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [error, isAnalyzed]);

  // Step Rotator
  useEffect(() => {
    if (error || isAnalyzed) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200); // Change step every 1.2s approximately
    return () => clearInterval(interval);
  }, [error, isAnalyzed]);

  // Tip Rotator
  useEffect(() => {
    if (error || isAnalyzed) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [error, isAnalyzed]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!email || !reportId) return;
      
      setIsSubmittingEmail(true);
      try {
          const res = await fetch("/api/leads/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reportId, email })
          });
          
          if (!res.ok) throw new Error("Failed to update email");
          
          // Success
          router.push(`/report/${reportId}`);
      } catch (err) {
          console.error(err);
          // Just redirect anyway in worst case so user gets value? 
          // Or show error? Let's show error for now.
          setError("Fehler beim Speichern der E-Mail.");
          setIsSubmittingEmail(false);
      }
  };


  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 text-center animate-in fade-in">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h2 className="text-xl font-bold">Fehler bei der Analyse</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
        </div>
    )
  }

  // --- PROCESSING STATE ---
  if (!isAnalyzed) {
    return (
        <div className="w-full max-w-md mx-auto space-y-8 px-4 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 ring-1 ring-primary/20 relative"
            >
                <Loader className="w-8 h-8 text-primary animate-spin" />
                <div className="absolute inset-0 rounded-full border-t-2 border-primary/40 animate-[spin_3s_linear_infinite]" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">Dein Report wird erstellt</h1>
            <p className="text-muted-foreground h-6 text-sm">
                <AnimatePresence mode="wait">
                    <motion.span 
                        key={stepIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="block"
                    >
                        {STEPS[stepIndex]}
                    </motion.span>
                </AnimatePresence>
            </p>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Fortschritt</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
        </div>

        <Card className="bg-black/20 border-white/10 overflow-hidden backdrop-blur-sm">
            <CardContent className="p-6 relative min-h-[120px] flex items-center justify-center text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tipIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 p-6 flex flex-col items-center justify-center"
                    >
                        <div className="flex items-center gap-2 mb-2 text-primary text-xs font-bold uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" />
                            Wusstest du schon?
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-white/80">
                            {TIPS[tipIndex]}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
        </div>
    );
  }

  // --- EMAIL GATE STATE ---
  return (
    <div className="w-full max-w-md mx-auto space-y-8 px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
             <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-2 ring-1 ring-green-500/20">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dein Report ist fertig!</h1>
            <p className="text-muted-foreground text-lg">
                Wir haben deine Website analysiert.
            </p>
        </div>

        <Card className="border-primary/20 bg-primary/5 shadow-[0_0_50px_-20px_rgba(120,0,255,0.2)]">
            <CardContent className="p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <h3 className="font-bold text-xl">Wohin sollen wir den Report schicken?</h3>
                    <p className="text-sm text-muted-foreground">
                        Erhalte sofortigen Zugriff auf dein Analyse-Dashboard.
                    </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="sr-only">E-Mail Adresse</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="name@firma.de" 
                                className="pl-10 h-12 text-base bg-background/50" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-12 font-bold text-base shadow-lg shadow-primary/25" disabled={isSubmittingEmail}>
                        {isSubmittingEmail ? (
                             <Loader className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                             <>
                                Report freischalten 
                                <ArrowRight className="ml-2 w-5 h-5" />
                             </>
                        )}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center px-1">
                        Mit <span className="font-semibold text-primary">Report freischalten</span> akzeptierst du, dass wir dich zum Report kontaktieren dürfen.
                    </p>
                </form>
                
                <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground uppercase tracking-widest">
                    <Lock className="w-3 h-3" />
                    100% Kostenlos & Sicher
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

