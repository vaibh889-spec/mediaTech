"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, Check, User, Hash, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaData {
  title: string;
  creator: string;
  caption: string;
  hashtags: string[];
  thumbnail: string;
  downloadUrl: string;
}

interface MediaCardProps {
  data: MediaData;
}

export function MediaCard({ data }: MediaCardProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const combinedText = [data.caption, data.hashtags?.join(" ")].filter(Boolean).join("\n\n");

  const handleDownload = () => {
    // In a real app, this might trigger a backend stream or direct download
    setIsDownloading(true);
    
    // Creating a temporary link to download
    const link = document.createElement("a");
    link.href = data.downloadUrl;
    link.target = "_blank";
    link.download = data.title || "media-download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setIsDownloading(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail Section */}
        <div className="relative aspect-video w-full bg-muted sm:aspect-square sm:w-2/5">
          {data.thumbnail ? (
            <img
              src={data.thumbnail}
              alt={data.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:bg-gradient-to-tr" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="line-clamp-2 text-lg font-bold leading-tight">{data.title}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium opacity-90">
              <User className="h-4 w-4" />
              <span className="truncate">{data.creator}</span>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex flex-1 flex-col p-6">
          <div className="flex-1 space-y-4">
            {/* Caption & Hashtags Combined */}
            {combinedText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Caption & Hashtags
                  </div>
                  <button
                    onClick={() => copyToClipboard(combinedText)}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
                  >
                    {copiedText ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedText ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                  <p className="line-clamp-6 whitespace-pre-wrap">{combinedText}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <button
              onClick={handleDownload}
              disabled={isDownloading || !data.downloadUrl}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-all",
                !data.downloadUrl 
                  ? "bg-secondary text-muted-foreground cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
              )}
            >
              {isDownloading ? (
                <>
                  <Check className="h-5 w-5" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  {data.downloadUrl ? "Download Media" : "No Download Available"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
