import { ReportView } from "@/components/report-view";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { getReport } from "@/lib/store";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportPage(props: PageProps) {
  const params = await props.params;
  const { id } = params;

  const report = await getReport(id);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
        <div className="bg-destructive/10 p-4 rounded-full">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Report not found</h1>
        <p className="text-muted-foreground max-w-xs">
          This report has expired or no longer exists.
        </p>
        <Link href="/">
          <Button>Start new analysis</Button>
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
