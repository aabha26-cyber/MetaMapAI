import { NextResponse } from "next/server";

import { buildReportPdf } from "@/lib/report/buildPdf";
import type { ReportPayload } from "@/lib/report/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReportPayload;

    if (!payload?.patient || !payload?.analysisResult || !payload?.carePlan) {
      return NextResponse.json(
        { error: "patient, analysisResult, and carePlan are required." },
        { status: 400 },
      );
    }

    const pdfBytes = await buildReportPdf(payload);
    const fileName = `${payload.patient.patientId}-risk-report.pdf`;
    const pdfBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength,
    ) as ArrayBuffer;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Report generation failed", error);
    return NextResponse.json(
      { error: "Unable to generate the report PDF." },
      { status: 500 },
    );
  }
}
