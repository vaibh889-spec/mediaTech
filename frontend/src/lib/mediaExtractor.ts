import path from "path";
import fs from "fs";
import ytDlpExec from "yt-dlp-exec";

export interface ExtractedMedia {
  title: string;
  creator: string;
  caption: string;
  hashtags: string[];
  thumbnail: string;
  downloadUrl: string;
  extension: string;
  platform: string;
}

type YtDlpInfo = Record<string, unknown> & {
  title?: string;
  description?: string;
  uploader?: string;
  uploader_id?: string;
  creator?: string;
  channel?: string;
  thumbnail?: string;
  url?: string;
  webpage_url?: string;
  ext?: string;
  extractor?: string;
  formats?: Array<Record<string, unknown>>;
  entries?: YtDlpInfo[];
};

function getYtDlpBinary(): string {
  const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  return path.join(process.cwd(), "node_modules", "yt-dlp-exec", "bin", binaryName);
}

function getCookiesPath(): string | null {
  const cookiesPath = path.join(process.cwd(), "cookies.txt");
  return fs.existsSync(cookiesPath) ? cookiesPath : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractHashtags(text: string): string[] {
  return Array.from(new Set(text.match(/#[\w\u0900-\u097F]+/g) || []));
}

function isDirectMediaUrl(url: string): boolean {
  if (!url.startsWith("http")) return false;
  const blockedPatterns = [
    /youtube\.com\/embed\//i,
    /instagram\.com\/(p|reel|tv)\//i,
    /twitter\.com\//i,
    /x\.com\//i,
  ];
  return !blockedPatterns.some((pattern) => pattern.test(url));
}

function getBestThumbnail(info: YtDlpInfo): string {
  // yt-dlp sometimes returns an array of thumbnails
  const thumbnails = info.thumbnails as Array<Record<string, unknown>> | undefined;
  if (thumbnails?.length) {
    // Pick the highest resolution
    const sorted = [...thumbnails]
      .filter((t) => typeof t.url === "string")
      .sort((a, b) => Number(b.preference ?? b.width ?? 0) - Number(a.preference ?? a.width ?? 0));
    if (sorted[0]?.url) return sorted[0].url as string;
  }
  return (info.thumbnail as string) || "";
}

function getCreator(info: YtDlpInfo): string {
  return (
    (info.uploader as string) ||
    (info.creator as string) ||
    (info.channel as string) ||
    (info.uploader_id as string) ||
    "Unknown Creator"
  );
}

function detectPlatform(url: string, extractor?: string): string {
  if (extractor) {
    const e = extractor.toLowerCase();
    if (e.includes("instagram")) return "instagram";
    if (e.includes("youtube")) return "youtube";
    if (e.includes("twitter") || e.includes("x.com")) return "twitter";
    if (e.includes("tiktok")) return "tiktok";
    if (e.includes("facebook")) return "facebook";
  }
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "facebook";
  return "other";
}

function buildYtDlpOptions(cookiesPath: string | null) {
  const options: Record<string, unknown> = {
    dumpSingleJson: true,
    noWarnings: true,
    noPlaylist: true,
    // Get all info without downloading
    skipDownload: true,
  };

  if (cookiesPath) {
    options.cookies = cookiesPath;
  }

  return options;
}

async function extractWithYtDlp(url: string): Promise<ExtractedMedia> {
  const binaryPath = getYtDlpBinary();
  const cookiesPath = getCookiesPath();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytDlp = (ytDlpExec as any).create(binaryPath);

  const result = await ytDlp(url, buildYtDlpOptions(cookiesPath));
  const info = (typeof result === "string" ? JSON.parse(result) : result) as YtDlpInfo;

  // Handle playlists — take first entry
  const mediaInfo = info.entries?.length ? info.entries[0] : info;

  const caption = (mediaInfo.description as string) || "";
  const platform = detectPlatform(url, mediaInfo.extractor as string | undefined);

  // We don't extract the direct CDN URL here anymore — the /api/download route
  // calls yt-dlp directly to stream. But we still provide a best-guess URL for
  // quick proxying in case yt-dlp streaming is too slow.
  const bestUrl = (mediaInfo.url as string) || (mediaInfo.webpage_url as string) || url;

  return {
    title: (mediaInfo.title as string) || "Unknown Title",
    creator: getCreator(mediaInfo),
    caption,
    hashtags: extractHashtags(caption),
    thumbnail: getBestThumbnail(mediaInfo),
    downloadUrl: url, // Pass original URL — download endpoint calls yt-dlp directly
    extension: "mp4",
    platform,
  };
}

async function extractFromOpenGraph(url: string): Promise<ExtractedMedia | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) return null;

  const html = await response.text();
  const getMeta = (property: string) => {
    const patterns = [
      new RegExp(`property="${property}"\\s+content="([^"]*)"`, "i"),
      new RegExp(`content="([^"]*)"\\s+property="${property}"`, "i"),
      new RegExp(`name="${property}"\\s+content="([^"]*)"`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtmlEntities(match[1]);
    }
    return "";
  };

  const ogTitle = getMeta("og:title");
  const ogDescription = getMeta("og:description");
  const ogVideo =
    getMeta("og:video:secure_url") ||
    getMeta("og:video:url") ||
    getMeta("og:video");
  const ogImage = getMeta("og:image");
  const downloadUrl = [ogVideo, ogImage].find(isDirectMediaUrl) || "";

  if (!downloadUrl && !ogDescription && !ogTitle) return null;

  const creatorMatch = ogTitle.match(/\(@([^)]+)\)/);
  const extension = ogVideo ? "mp4" : "jpg";
  const platform = detectPlatform(url);

  return {
    title: ogTitle.split("•")[0]?.trim() || "Media",
    creator: creatorMatch?.[1] || "Unknown Creator",
    caption: ogDescription,
    hashtags: extractHashtags(ogDescription),
    thumbnail: ogImage,
    downloadUrl: url, // Use original URL for /api/download
    extension,
    platform,
  };
}

export async function extractMediaMetadata(url: string): Promise<ExtractedMedia> {
  const normalizedUrl = url.trim();

  try {
    return await extractWithYtDlp(normalizedUrl);
  } catch (ytDlpError) {
    const errMsg = ytDlpError instanceof Error ? ytDlpError.message : String(ytDlpError);
    console.warn("yt-dlp extraction failed:", errMsg);

    // Check if it's an auth error
    if (
      errMsg.includes("login") ||
      errMsg.includes("cookie") ||
      errMsg.includes("authentication") ||
      errMsg.includes("Sign in") ||
      errMsg.includes("log in") ||
      errMsg.includes("private")
    ) {
      throw new Error(
        "This content requires authentication. If you are logged in on Instagram/Twitter in your browser, export your cookies as 'cookies.txt' and place it in the project root folder."
      );
    }

    console.warn("Trying Open Graph fallback...");
    const fallback = await extractFromOpenGraph(normalizedUrl);
    if (fallback?.downloadUrl || fallback?.caption) {
      return fallback;
    }

    throw new Error(
      "Failed to retrieve media. Make sure the link is public and the URL is correct."
    );
  }
}
