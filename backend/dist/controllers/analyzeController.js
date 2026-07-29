"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeUrl = void 0;
const zod_1 = require("zod");
const mediaService_1 = require("../services/mediaService");
const analyzeSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL format'),
});
const analyzeUrl = async (req, res) => {
    try {
        const parseResult = analyzeSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ success: false, message: parseResult.error.issues[0].message });
            return;
        }
        const { url } = parseResult.data;
        // Call service to extract metadata
        const metadata = await (0, mediaService_1.extractMetadata)(url);
        res.status(200).json({
            success: true,
            ...metadata,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to analyze the provided URL.';
        console.error('Error analyzing URL:', message);
        res.status(500).json({
            success: false,
            message,
        });
    }
};
exports.analyzeUrl = analyzeUrl;
