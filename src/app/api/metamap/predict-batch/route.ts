import { NextResponse } from "next/server";

import { scoreCsvContent } from "@/lib/metamap/analysis";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
    }

    const content = await file.text();
    const result = scoreCsvContent(file.name, content);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Batch prediction failed", error);
    return NextResponse.json(
      { error: "Unable to analyze the uploaded dataset." },
      { status: 500 },
    );
  }
}
