import { NextResponse } from "next/server";
import { Resend } from "resend";

import { buildReportPdf } from "@/lib/report/buildPdf";
import type { ReportPayload } from "@/lib/report/types";

function hasConfiguredResendKey() {
  const apiKey = process.env.RESEND_API_KEY;
  return Boolean(apiKey && !apiKey.startsWith("your_"));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReportPayload;

    if (!payload?.patient?.email || !payload?.analysisResult || !payload?.carePlan) {
      return NextResponse.json(
        { error: "patient.email, analysisResult, and carePlan are required." },
        { status: 400 },
      );
    }

    const pdfBytes = await buildReportPdf(payload);
    const fileName = `${payload.patient.patientId}-risk-report.pdf`;

    if (!hasConfiguredResendKey()) {
      return NextResponse.json({
        success: true,
        simulated: true,
        message:
          "Email delivery is not configured in this environment. A simulated success response was returned for demo use.",
        preview: {
          to: payload.patient.email,
          subject: "Your Cancer Risk Assessment Report",
          attachmentName: fileName,
          attachmentSize: pdfBytes.length,
        },
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM || "MetaMap Reports <onboarding@resend.dev>";

    const sendResult = await resend.emails.send({
      from,
      to: payload.patient.email,
      subject: "Your Cancer Risk Assessment Report",
      text: [
        `Hi ${payload.patient.fullName},`,
        "",
        "Attached is your generated MetaMap AI risk report.",
        "",
        "This AI system provides risk estimation only and does not replace medical diagnosis.",
      ].join("\n"),
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    });

    return NextResponse.json({
      success: true,
      simulated: false,
      id: sendResult.data?.id,
      message: `Report emailed to ${payload.patient.email}.`,
    });
  } catch (error) {
    console.error("Email send failed", error);
    return NextResponse.json(
      { error: "Unable to send the report email." },
      { status: 500 },
    );
  }
}
