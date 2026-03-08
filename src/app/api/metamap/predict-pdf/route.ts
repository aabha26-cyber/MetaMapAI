import { NextResponse } from "next/server";

import { scoreTextDocument } from "@/lib/metamap/analysis";

async function extractPdfText(buffer: Buffer) {
  try {
    const pdfModule = await import("pdf-parse");
    const pdfParse = pdfModule.default;
    const parsed = await pdfParse(buffer);
    return parsed.text ?? "";
  } catch (error) {
    console.error("PDF parsing fallback triggered", error);
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractPdfText(buffer);

    const result = scoreTextDocument({
      sourceType: "pdf",
      fileName: file.name,
      text:
        extractedText ||
        `${file.name} PDF uploaded with ${buffer.byteLength} bytes. No readable text was extracted, so the demo model used filename and document metadata only.`,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("PDF prediction failed", error);
    return NextResponse.json(
      { error: "Unable to analyze the uploaded PDF." },
      { status: 500 },
    );
  }
}
