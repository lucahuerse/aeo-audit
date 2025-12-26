import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { ReportView } from "@/components/report-view";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Report } from "@/lib/schemas";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportPage(props: PageProps) {
  const params = await props.params;
  const { id } = params;
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: reportData, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  let report: Report | null = null;

  if (reportData) {
      report = {
          id: reportData.id,
          createdAt: reportData.created_at,
          lead: {
              name: reportData.contact_name || "",
              company: reportData.company_name || "", 
              domain: reportData.domain,
              email: reportData.email || "",
          },
          score: reportData.score,
          subScores: reportData.sub_scores,
          details: reportData.details,
          summary: reportData.summary,
          sections: reportData.sections,
          cta: reportData.cta,
      };
  }

  if (!report) {
    // Handling case where in-memory store is wiped or invalid ID
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
             <div className="bg-destructive/10 p-4 rounded-full">
                <AlertCircle className="w-8 h-8 text-destructive" />
             </div>
             <h1 className="text-2xl font-bold">Report nicht gefunden</h1>
             <p className="text-muted-foreground max-w-xs">
                Der Report ist abgelaufen oder existiert nicht mehr.
             </p>
             <Link href="/">
                <Button>Neue Analyse starten</Button>
             </Link>
        </div>
    );
  }

  return (
    <main className="min-h-screen">
      <ReportView report={report} />
    </main>
  );
}
