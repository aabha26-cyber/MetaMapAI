import { NextResponse } from "next/server";

import { scoreManualInputs } from "@/lib/metamap/analysis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inputs = {
      meanRadius: Number(body.meanRadius ?? 0),
      meanTexture: Number(body.meanTexture ?? 0),
      meanPerimeter: Number(body.meanPerimeter ?? 0),
      meanArea: Number(body.meanArea ?? 0),
      meanConcavity: Number(body.meanConcavity ?? 0),
      meanSymmetry: Number(body.meanSymmetry ?? 0),
    };

    const result = scoreManualInputs(inputs);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Manual prediction failed", error);
    return NextResponse.json(
      { error: "Unable to process manual prediction inputs." },
      { status: 400 },
    );
  }
}
