
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        const { error } = await supabase
            .from('reports')
            .update({ email: email })
            .eq('id', reportId);

        if (error) {
             console.error("Supabase Update Error:", error);
             // If error is row not found (which might not return error depending on configure, but usually update returns count)
             // We can check count if we want, but for now just error check.
             throw error;
        }

    } catch (err) {
         console.error("Failed to update email in DB", err);
         return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
    }

    // TODO: Trigger email sending here (e.g. Resend, SendGrid)
    console.log(`Email updated for report ${reportId}. Sending email to ${email}...`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
