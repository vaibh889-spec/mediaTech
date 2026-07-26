"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Copy,
  Check,
  User,
  FileText,
  Image as ImageIcon,
  Loader2,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildDownloadFilename } from "@/lib/downloadUtils";

export interface MediaData {
  title: string;
  creator: string;
  caption: string;
  hashtags: string[];
  thumbnail: string;
  downloadUrl: string;
  extension?: string;
  platform?: string;
}

interface MediaCardProps {
  data: MediaData;
}

function downloadTextFile(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export function MediaCard({ data }: MediaCardProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string>("");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const captionText = data.caption?.trim() || "";
  const hashtagsText = data.hashtags?.join(" ").trim() || "";
  // Combine caption and hashtags — deduplicate hashtags that are already in caption
  const captionHashtags: string[] = captionText.match(/#[\w\u0900-\u097F]+/g) || [];
  const uniqueHashtags = data.hashtags?.filter(
    (h) => !captionHashtags.includes(h)
  );
  const extraHashtags = uniqueHashtags?.join(" ").trim() || "";
  const combinedText = [captionText, extraHashtags].filter(Boolean).join("\n\n");
  const displayText = combinedText || captionText;

  const handleDownload = async () => {
    if (!data.downloadUrl) return;

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadProgress("Preparing download...");

    try {
      const filename = buildDownloadFilename(data.title, data.extension || "mp4");
      // Use Render backend for download (Cloudflare Pages can't run yt-dlp subprocess)
      const backendBase =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace("/api/analyze", "") ||
        "";
      const proxyUrl = backendBase
        ? `${backendBase}/api/download?url=${encodeURIComponent(data.downloadUrl)}&filename=${encodeURIComponent(filename)}`
        : `/api/download?url=${encodeURIComponent(data.downloadUrl)}&filename=${encodeURIComponent(filename)}`;

      setDownloadProgress("Fetching video (this may take a moment)...");
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Download failed. Please try again.");
      }

      setDownloadProgress("Saving file...");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      setDownloadProgress("");
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Download failed";
      setDownloadError(message);
      setDownloadProgress("");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCaptionDownload = () => {
    if (!displayText) return;
    const safeTitle = (data.title || "caption").replace(/[<>:"/\\|?*\x00-\x1f]/g, "").trim().slice(0, 80);
    downloadTextFile(displayText, `${safeTitle}-caption.txt`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-muted sm:aspect-square sm:w-2/5">
          {data.thumbnail ? (
            <img
              src={data.thumbnail}
              alt={data.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent sm:bg-gradient-to-tr" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            {data.platform && data.platform !== "other" && (
              <span className="mb-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                {data.platform}
              </span>
            )}
            <h3 className="line-clamp-2 text-lg font-bold leading-tight">{data.title}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium opacity-90">
              <User className="h-4 w-4" />
              <span className="truncate">{data.creator}</span>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="flex flex-1 flex-col p-6">
          <div className="flex-1 space-y-4">
            {/* Caption Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Original Caption
                </div>
                <div className="flex items-center gap-1">
                  {/* Copy button */}
                  <button
                    onClick={() => copyToClipboard(displayText || "")}
                    disabled={!displayText}
                    title="Copy caption to clipboard"
                    className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedText ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedText ? "Copied!" : "Copy"}
                  </button>
                  {/* Download caption as .txt */}
                  <button
                    onClick={handleCaptionDownload}
                    disabled={!displayText}
                    title="Download caption as text file"
                    className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Save .txt
                  </button>
                </div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                <p className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                  {displayText || "No caption available for this media."}
                </p>
              </div>
            </div>
          </div>

          {/* Download Section */}
          <div className="mt-6 space-y-2 border-t pt-4">
            {downloadError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                <p className="font-medium">Download failed</p>
                <p className="mt-1 text-xs opacity-80">{downloadError}</p>
              </div>
            )}
            {downloadProgress && !downloadError && (
              <p className="text-center text-xs text-muted-foreground">{downloadProgress}</p>
            )}
            <button
              onClick={handleDownload}
              disabled={isDownloading || !data.downloadUrl}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-all",
                !data.downloadUrl
                  ? "bg-secondary text-muted-foreground cursor-not-allowed"
                  : isDownloading
                  ? "bg-primary/70 text-primary-foreground cursor-wait"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
              )}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing Video...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  {data.downloadUrl ? "Download Original Video" : "No Download Available"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
