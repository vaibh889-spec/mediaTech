import path from "path";
import fs from "fs";
import ytDlpExec from "yt-dlp-exec";

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
  thumbnails?: Array<Record<string, unknown>>;
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

function extractHashtags(text: string): string[] {
  return Array.from(new Set(text.match(/#[\w\u0900-\u097F]+/g) || []));
}

function getBestThumbnail(info: YtDlpInfo): string {
  const thumbnails = info.thumbnails;
  if (thumbnails?.length) {
    const sorted = [...thumbnails]
      .filter((entry) => typeof entry.url === "string")
      .sort(
        (a, b) =>
          Number(b.preference ?? b.width ?? 0) - Number(a.preference ?? a.width ?? 0)
      );
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
    const value = extractor.toLowerCase();
    if (value.includes("instagram")) return "instagram";
    if (value.includes("youtube")) return "youtube";
    if (value.includes("twitter") || value.includes("x.com")) return "twitter";
    if (value.includes("tiktok")) return "tiktok";
    if (value.includes("facebook")) return "facebook";
  }

  const normalized = url.toLowerCase();
  if (normalized.includes("instagram.com")) return "instagram";
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "youtube";
  if (normalized.includes("twitter.com") || normalized.includes("x.com")) return "twitter";
  if (normalized.includes("tiktok.com")) return "tiktok";
  if (normalized.includes("facebook.com") || normalized.includes("fb.watch")) return "facebook";
  return "other";
}

export const extractMetadata = async (url: string) => {
  try {
    const binaryPath = getYtDlpBinary();
    const cookiesPath = getCookiesPath();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ytDlp = (ytDlpExec as any).create(binaryPath);

    const options: Record<string, unknown> = {
      dumpSingleJson: true,
      noWarnings: true,
      noPlaylist: true,
      skipDownload: true,
    };

    if (cookiesPath) {
      options.cookies = cookiesPath;
    }

    const result = await ytDlp(url, options);
    const info = (typeof result === "string" ? JSON.parse(result) : result) as YtDlpInfo;
    const mediaInfo = info.entries?.length ? info.entries[0] : info;
    const caption = (mediaInfo.description as string) || "";
    const platform = detectPlatform(url, mediaInfo.extractor as string | undefined);

    return {
      title: (mediaInfo.title as string) || "Unknown Title",
      creator: getCreator(mediaInfo),
      caption,
      hashtags: extractHashtags(caption),
      thumbnail: getBestThumbnail(mediaInfo),
      downloadUrl: url,
      extension: "mp4",
      platform,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("yt-dlp error:", message);

    if (
      message.includes("login") ||
      message.includes("cookie") ||
      message.includes("authentication") ||
      message.includes("Sign in") ||
      message.includes("log in") ||
      message.includes("private")
    ) {
      throw new Error(
        "This content requires authentication. Export your browser cookies as cookies.txt and place it in the project root folder."
      );
    }

    throw new Error(
      "Failed to retrieve media information. Please check if the URL is valid and publicly accessible."
    );
  }
};
