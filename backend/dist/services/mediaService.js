"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMetadata = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const yt_dlp_exec_1 = __importDefault(require("yt-dlp-exec"));
function getYtDlpBinary() {
    const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
    return path_1.default.join(process.cwd(), "node_modules", "yt-dlp-exec", "bin", binaryName);
}
function getCookiesPath() {
    const cookiesPath = path_1.default.join(process.cwd(), "cookies.txt");
    return fs_1.default.existsSync(cookiesPath) ? cookiesPath : null;
}
function extractHashtags(text) {
    return Array.from(new Set(text.match(/#[\w\u0900-\u097F]+/g) || []));
}
function getBestThumbnail(info) {
    const thumbnails = info.thumbnails;
    if (thumbnails?.length) {
        const sorted = [...thumbnails]
            .filter((entry) => typeof entry.url === "string")
            .sort((a, b) => Number(b.preference ?? b.width ?? 0) - Number(a.preference ?? a.width ?? 0));
        if (sorted[0]?.url)
            return sorted[0].url;
    }
    return info.thumbnail || "";
}
function getCreator(info) {
    return (info.uploader ||
        info.creator ||
        info.channel ||
        info.uploader_id ||
        "Unknown Creator");
}
function detectPlatform(url, extractor) {
    if (extractor) {
        const value = extractor.toLowerCase();
        if (value.includes("instagram"))
            return "instagram";
        if (value.includes("youtube"))
            return "youtube";
        if (value.includes("twitter") || value.includes("x.com"))
            return "twitter";
        if (value.includes("tiktok"))
            return "tiktok";
        if (value.includes("facebook"))
            return "facebook";
    }
    const normalized = url.toLowerCase();
    if (normalized.includes("instagram.com"))
        return "instagram";
    if (normalized.includes("youtube.com") || normalized.includes("youtu.be"))
        return "youtube";
    if (normalized.includes("twitter.com") || normalized.includes("x.com"))
        return "twitter";
    if (normalized.includes("tiktok.com"))
        return "tiktok";
    if (normalized.includes("facebook.com") || normalized.includes("fb.watch"))
        return "facebook";
    return "other";
}
const extractMetadata = async (url) => {
    try {
        const binaryPath = getYtDlpBinary();
        const cookiesPath = getCookiesPath();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ytDlp = yt_dlp_exec_1.default.create(binaryPath);
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            noPlaylist: true,
            skipDownload: true,
        };
        if (cookiesPath) {
            options.cookies = cookiesPath;
        }
        const result = await ytDlp(url, options);
        const info = (typeof result === "string" ? JSON.parse(result) : result);
        const mediaInfo = info.entries?.length ? info.entries[0] : info;
        const caption = mediaInfo.description || "";
        const platform = detectPlatform(url, mediaInfo.extractor);
        return {
            title: mediaInfo.title || "Unknown Title",
            creator: getCreator(mediaInfo),
            caption,
            hashtags: extractHashtags(caption),
            thumbnail: getBestThumbnail(mediaInfo),
            downloadUrl: url,
            extension: "mp4",
            platform,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("yt-dlp error:", message);
        if (message.includes("login") ||
            message.includes("cookie") ||
            message.includes("authentication") ||
            message.includes("Sign in") ||
            message.includes("log in") ||
            message.includes("private")) {
            throw new Error("This content requires authentication. Export your browser cookies as cookies.txt and place it in the project root folder.");
        }
        throw new Error("Failed to retrieve media information. Please check if the URL is valid and publicly accessible.");
    }
};
exports.extractMetadata = extractMetadata;
