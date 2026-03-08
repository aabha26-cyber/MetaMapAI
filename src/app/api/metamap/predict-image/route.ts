import { NextResponse } from "next/server";

import { createAnalysisResult } from "@/lib/metamap/analysis";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image upload is required." }, { status: 400 });
    }

    const sizeInMb = file.size / (1024 * 1024);
    const lowerName = file.name.toLowerCase();
    const keywordBoost =
      ["brain", "lung", "liver", "bone", "mets", "metastasis", "lesion"].filter(
        (keyword) => lowerName.includes(keyword),
      ).length * 0.11;

    const score = clamp(0.28 + sizeInMb * 0.22 + keywordBoost, 0.12, 0.94);

    const result = createAnalysisResult({
      sourceType: "image",
      fileName: file.name,
      score,
      summary:
        score >= 0.62
          ? "Image analysis identified several visual cues associated with elevated metastatic risk in the demo pipeline."
          : "Image analysis did not surface a dominant high-risk visual pattern in the demo pipeline.",
      findings: [
        `Uploaded image size: ${sizeInMb.toFixed(2)} MB.`,
        keywordBoost > 0
          ? "Filename metadata contained organ or metastasis-related terms that increased the review priority."
          : "No organ-specific filename metadata was detected.",
        "Image predictions in this build are workflow-oriented demo estimates and require clinician validation.",
      ],
      metrics: [
        { label: "File size (MB)", value: Number(sizeInMb.toFixed(2)) },
        { label: "Keyword boost", value: Number((keywordBoost * 100).toFixed(1)) },
        { label: "Image score", value: Number((score * 100).toFixed(1)) },
      ],
      organSeed: file.name,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Image prediction failed", error);
    return NextResponse.json(
      { error: "Unable to analyze the uploaded image." },
      { status: 500 },
    );
  }
}
