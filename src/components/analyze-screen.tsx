"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, CheckCircle2, AlertCircle, ShieldOff } from "lucide-react";
import { Lead } from "@/lib/schemas";
import { Button } from "@/components/ui/button";

type ErrorState = {
  code: "blocked" | "not_found" | "unreachable" | "unknown" | "generic";
  message: string;
};

const STEPS = [
  "Fetching website and checking access...",
  "Analyzing structure (titles, headings)...",
  "Evaluating LLM readability...",
  "Simulating recommendability...",
  "Drafting quick wins and critical issues...",
  "Finalizing report...",
];

const TIPS = [
  "Sites with a clear services page are more often categorized correctly by LLMs.",
  "FAQs help LLMs recommend you for specific user questions.",
  "A single, clear H1 plus a sharp value proposition boost AI readiness.",
  "Too much JS without SSR can break text extraction.",
  "Visible contact and location info means better local relevance.",
];

export function AnalyzeScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [error, setError] = useState<ErrorState | null>(null);

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
          setError({ code: "generic", message: "No domain provided." });
          return;
        }

        const apiPromise = fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...leadData, id: reportId }),
        }).then(async (res) => {
          if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            const err = new Error(payload.error || "Analysis failed") as Error & {
              code?: ErrorState["code"];
            };
            err.code = payload.code ?? "generic";
            throw err;
          }
          return res.json();
        });

        const waitPromise = new Promise((resolve) => setTimeout(resolve, 5000));

        const [data] = await Promise.all([apiPromise, waitPromise]);

        setProgress(100);

        if (data.id) {
          router.push(`/report/${data.id}`);
        } else {
          setError({ code: "generic", message: "Server didn't return a report ID." });
        }
      } catch (err) {
        console.error(err);
        const e = err as Error & { code?: ErrorState["code"] };
        setError({
          code: e.code ?? "generic",
          message: e.message || "Something went wrong. Please try again.",
        });
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
    if (error.code === "blocked") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 text-center animate-in fade-in max-w-md mx-auto">
          <ShieldOff className="h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-bold">This website blocks automated requests</h2>
          <p className="text-muted-foreground text-sm">
            The site is likely using bot protection (e.g. Cloudflare) and rejected our request.
            For LLMs like ChatGPT to discover and recommend its content, the site owner should
            allow legitimate crawlers — otherwise it stays effectively invisible to AI search.
          </p>
          <p className="text-xs text-muted-foreground">
            Tip: allow GPTBot, ClaudeBot, and PerplexityBot in robots.txt, and loosen
            bot-management rules for these user agents.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => router.push("/")}>Try another website</Button>
            <Button onClick={() => window.location.reload()}>Try again</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 text-center animate-in fade-in">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Analysis failed</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
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
        <h1 className="text-2xl font-bold tracking-tight">Generating your report</h1>
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
          <span>Progress</span>
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
                Did you know?
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
