"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMetadata = void 0;
const yt_dlp_exec_1 = __importDefault(require("yt-dlp-exec"));
const extractMetadata = async (url) => {
    try {
        // Run yt-dlp to get JSON dump
        const result = await (0, yt_dlp_exec_1.default)(url, {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
        });
        // Ensure we handle both string or object responses
        const info = typeof result === 'string' ? JSON.parse(result) : result;
        // Parse hashtags from description if available
        const description = info.description || info.title || '';
        const hashtags = description.match(/#[\w]+/g) || [];
        return {
            title: info.title || 'Unknown Title',
            creator: info.uploader || info.creator || info.channel || 'Unknown Creator',
            caption: info.description || '',
            hashtags: Array.from(new Set(hashtags)), // Unique hashtags
            thumbnail: info.thumbnail || '',
            downloadUrl: info.url || '', // We can provide the direct URL for download if available
        };
    }
    catch (error) {
        console.error('yt-dlp error:', error);
        throw new Error('Failed to retrieve media information. Please check if the URL is valid and publicly accessible.');
    }
};
exports.extractMetadata = extractMetadata;
