import ytDlp from "yt-dlp-exec";

type YtDlpInfo = Record<string, unknown> & {
  title?: string;
  description?: string;
  uploader?: string;
  creator?: string;
  channel?: string;
  thumbnail?: string;
  url?: string;
  webpage_url?: string;
  ext?: string;
  formats?: Array<Record<string, unknown>>;
  entries?: YtDlpInfo[];
};

function extractHashtags(text: string): string[] {
  return Array.from(new Set(text.match(/#[\w]+/g) || []));
}

function getBestFormat(formats: Array<Record<string, unknown>>) {
  const usable = formats.filter(
    (format) =>
      typeof format.url === "string" &&
      format.url.length > 0 &&
      format.ext !== "mhtml"
  );

  const videoWithAudio = usable
    .filter(
      (format) => format.vcodec !== "none" && format.acodec !== "none"
    )
    .sort(
      (a, b) => Number(b.height || 0) - Number(a.height || 0)
    );

  if (videoWithAudio[0]) {
    return videoWithAudio[0];
  }

  const videoOnly = usable
    .filter((format) => format.vcodec !== "none")
    .sort(
      (a, b) => Number(b.height || 0) - Number(a.height || 0)
    );

  if (videoOnly[0]) {
    return videoOnly[0];
  }

  const image = usable
    .filter((format) => format.vcodec === "none")
    .sort(
      (a, b) => Number(b.width || 0) - Number(a.width || 0)
    );

  return image[0] || null;
}

function getDownloadDetails(info: YtDlpInfo): { downloadUrl: string; extension: string } {
  if (info.entries?.length) {
    return getDownloadDetails(info.entries[0]);
  }

  const bestFormat = info.formats ? getBestFormat(info.formats) : null;
  if (bestFormat?.url && typeof bestFormat.url === "string") {
    return {
      downloadUrl: bestFormat.url,
      extension: String(bestFormat.ext || info.ext || "mp4"),
    };
  }

  if (info.url) {
    return {
      downloadUrl: info.url,
      extension: String(info.ext || "mp4"),
    };
  }

  return {
    downloadUrl: info.webpage_url || "",
    extension: String(info.ext || "mp4"),
  };
}

export const extractMetadata = async (url: string) => {
  try {
    const result = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
    });

    const info = (typeof result === "string" ? JSON.parse(result) : result) as YtDlpInfo;
    const caption = info.description || "";
    const { downloadUrl, extension } = getDownloadDetails(info);

    return {
      title: info.title || "Unknown Title",
      creator: info.uploader || info.creator || info.channel || "Unknown Creator",
      caption,
      hashtags: extractHashtags(caption),
      thumbnail: info.thumbnail || "",
      downloadUrl,
      extension,
    };
  } catch (error: unknown) {
    console.error("yt-dlp error:", error);
    throw new Error(
      "Failed to retrieve media information. Please check if the URL is valid and publicly accessible."
    );
  }
};
