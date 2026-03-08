import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";

import type { ReportPayload } from "./types";

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxChars) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawSection(
  page: PDFPage,
  title: string,
  lines: string[],
  startY: number,
  fonts: { regular: Awaited<ReturnType<PDFDocument["embedFont"]>>; bold: Awaited<ReturnType<PDFDocument["embedFont"]>> },
) {
  let cursorY = startY;

  page.drawText(title, {
    x: 48,
    y: cursorY,
    size: 14,
    font: fonts.bold,
    color: rgb(0.83, 0.69, 0.22),
  });

  cursorY -= 22;

  for (const line of lines) {
    page.drawText(line, {
      x: 48,
      y: cursorY,
      size: 10.5,
      font: fonts.regular,
      color: rgb(0.95, 0.95, 0.97),
    });
    cursorY -= 14;
  }

  return cursorY - 10;
}

export async function buildReportPdf(payload: ReportPayload) {
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 612,
    height: 792,
    color: rgb(0.04, 0.05, 0.08),
  });

  page.drawText("MetaMap AI Risk Report", {
    x: 48,
    y: 742,
    size: 24,
    font: bold,
    color: rgb(0.96, 0.96, 0.98),
  });

  page.drawText(
    "Demo report generated for workflow validation. Use clinician review before any care decision.",
    {
      x: 48,
      y: 720,
      size: 10,
      font: regular,
      color: rgb(0.68, 0.7, 0.77),
    },
  );

  const generatedAt = payload.generatedAt ?? new Date().toISOString();
  let cursorY = 680;

  cursorY = drawSection(
    page,
    "Patient",
    [
      `Name: ${payload.patient.fullName}`,
      `Patient ID: ${payload.patient.patientId}`,
      `Age: ${payload.patient.age ?? "N/A"}    DOB: ${payload.patient.dateOfBirth || "N/A"}`,
      `Email: ${payload.patient.email}`,
      `Phone: ${payload.patient.phone || "Not provided"}`,
      `Gender: ${payload.patient.gender || "Not provided"}`,
      `Generated: ${generatedAt}`,
    ],
    cursorY,
    { regular, bold },
  );

  cursorY = drawSection(
    page,
    "Risk Analysis",
    [
      `Source: ${payload.analysisResult.sourceType.toUpperCase()}${payload.analysisResult.fileName ? ` (${payload.analysisResult.fileName})` : ""}`,
      `Risk Level: ${payload.analysisResult.riskLevel} - ${payload.analysisResult.riskLabel}`,
      `Estimated Probability: ${payload.analysisResult.probability}%`,
      `Confidence: ${payload.analysisResult.confidence}%`,
      `Predicted Organ Focus: ${payload.analysisResult.predictedOrgans.join(", ")}`,
      ...wrapText(`Summary: ${payload.analysisResult.summary}`, 84),
    ],
    cursorY,
    { regular, bold },
  );

  cursorY = drawSection(
    page,
    "Key Findings",
    payload.analysisResult.findings.flatMap((finding) =>
      wrapText(`- ${finding}`, 88),
    ),
    cursorY,
    { regular, bold },
  );

  cursorY = drawSection(
    page,
    "Recommendations",
    [
      `Urgency: ${payload.carePlan.urgency}`,
      `Recommended follow-up window: ${payload.carePlan.followUpWindow}`,
      ...payload.carePlan.patientActions.flatMap((action) =>
        wrapText(`Patient: ${action}`, 88),
      ),
      ...payload.carePlan.clinicianActions.flatMap((action) =>
        wrapText(`Clinician: ${action}`, 88),
      ),
    ],
    cursorY,
    { regular, bold },
  );

  drawSection(
    page,
    "Disclaimer",
    wrapText(payload.carePlan.disclaimer, 88),
    Math.max(cursorY, 108),
    { regular, bold },
  );

  return document.save();
}
