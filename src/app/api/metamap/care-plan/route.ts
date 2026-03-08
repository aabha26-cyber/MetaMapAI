import { NextResponse } from "next/server";

import { deriveCarePlan } from "@/lib/metamap/analysis";
import type { AnalysisResult } from "@/lib/metamap/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { analysisResult?: AnalysisResult };

    if (!body.analysisResult) {
      return NextResponse.json(
        { error: "analysisResult is required." },
        { status: 400 },
      );
    }

    const carePlan = deriveCarePlan(body.analysisResult);
    return NextResponse.json({ carePlan });
  } catch (error) {
    console.error("Care plan generation failed", error);
    return NextResponse.json(
      { error: "Unable to generate the care plan." },
      { status: 500 },
    );
  }
}
