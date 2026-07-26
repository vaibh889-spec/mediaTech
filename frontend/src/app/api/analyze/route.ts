import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractMediaMetadata } from "@/lib/mediaExtractor";

const analyzeSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = analyzeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const metadata = await extractMediaMetadata(parseResult.data.url);

    return NextResponse.json({
      success: true,
      ...metadata,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to analyze the provided URL. Make sure it is public and supported.";

    console.error("Error analyzing URL:", message);
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
