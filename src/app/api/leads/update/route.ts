
import { NextRequest, NextResponse } from "next/server";
import { reportStore } from "@/lib/store";
import { z } from "zod";

const updateSchema = z.object({
  reportId: z.string(),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = updateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { reportId, email } = parseResult.data;
    
    // Update the report in the store
    const success = reportStore.update(reportId, {
        lead: {
            ...reportStore.get(reportId)?.lead,
            email: email,
            name: reportStore.get(reportId)?.lead.name || "",
            company: reportStore.get(reportId)?.lead.company || "",
            domain: reportStore.get(reportId)?.lead.domain || "",
        }
    });

    if (!success) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // TODO: Trigger email sending here (e.g. Resend, SendGrid)
    console.log(`Email updated for report ${reportId}. Sending email to ${email}...`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
