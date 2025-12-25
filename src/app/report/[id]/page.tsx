import { reportStore } from "@/lib/store";
import { ReportView } from "@/components/report-view";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportPage(props: PageProps) {
  const params = await props.params;
  const { id } = params;
  const report = reportStore.get(id);

  if (!report) {
    // Handling case where in-memory store is wiped or invalid ID
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
             <div className="bg-destructive/10 p-4 rounded-full">
                <AlertCircle className="w-8 h-8 text-destructive" />
             </div>
             <h1 className="text-2xl font-bold">Report nicht gefunden</h1>
             <p className="text-muted-foreground max-w-xs">
                Der Report ist abgelaufen oder existiert nicht mehr. (Hinweis: In-Memory Speicher wird bei Neustart gelöscht).
             </p>
             <Link href="/">
                <Button>Neue Analyse starten</Button>
             </Link>
        </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <ReportView report={report} />
    </main>
  );
}
