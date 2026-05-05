"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, CheckCircle2, AlertCircle } from "lucide-react";
import { Lead } from "@/lib/schemas";
import { Button } from "@/components/ui/button";

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

  const analysisStarted = useRef(false);

  const leadData: Lead = {
    domain: searchParams.get("domain") || "",
  };

  useEffect(() => {
    if (analysisStarted.current) return;

    const startAnalysis = async () => {
      analysisStarted.current = true;

      try {
        const reportId = crypto.randomUUID();

        if (!leadData.domain) {
          setError("Keine Domain angegeben.");
          return;
        }

        const apiPromise = fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...leadData, id: reportId }),
        }).then((res) => {
          if (!res.ok) throw new Error("Analysis failed");
          return res.json();
        });

        const waitPromise = new Promise((resolve) => setTimeout(resolve, 5000));

        const [data] = await Promise.all([apiPromise, waitPromise]);

        setProgress(100);

        if (data.id) {
          router.push(`/report/${data.id}`);
        } else {
          setError("Keine Report ID zurückbekommen.");
        }
      } catch (err) {
        console.error(err);
        setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
    };

    startAnalysis();
  }, []);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const inc = Math.random() * 5;
        return Math.min(prev + inc, 95);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [error]);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [error]);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [error]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 text-center animate-in fade-in">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Fehler bei der Analyse</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
      </div>
    );
  }

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
