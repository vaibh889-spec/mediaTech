import { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { extractMetadata } from "../src/services/mediaService";

const analyzeSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Bypass-Tunnel-Reminder"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const parseResult = analyzeSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0].message,
      });
    }

    const { url } = parseResult.data;
    const metadata = await extractMetadata(url);

    return res.status(200).json({
      success: true,
      ...metadata,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to analyze the provided URL. Make sure it is public and supported.";

    console.error("Error analyzing URL:", message);
    return res.status(500).json({
      success: false,
      message,
    });
  }
}
