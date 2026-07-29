import { Request, Response } from 'express';
import { z } from 'zod';
import { extractMetadata } from '../services/mediaService';

const analyzeSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

export const analyzeUrl = async (req: Request, res: Response) => {
  try {
    const parseResult = analyzeSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: parseResult.error.issues[0].message });
      return;
    }

    const { url } = parseResult.data;
    
    // Call service to extract metadata
    const metadata = await extractMetadata(url);
    
    res.status(200).json({
      success: true,
      ...metadata,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyze the provided URL.';
    console.error('Error analyzing URL:', message);
    res.status(500).json({
      success: false,
      message,
    });
  }
};
