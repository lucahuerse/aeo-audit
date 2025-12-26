import { AnalyzeScreen } from "@/components/analyze-screen";
import { Suspense } from "react";

export default function AnalyzePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center pt-10 pb-20">
      <Suspense fallback={<div className="text-center p-10">Lade Analyse...</div>}>
         <AnalyzeScreen />
      </Suspense>
    </main>
  );
}
