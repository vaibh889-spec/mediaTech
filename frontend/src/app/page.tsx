"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { URLInput } from "@/components/URLInput";
import { MediaCard, type MediaData } from "@/components/MediaCard";
import { AlertCircle } from "lucide-react";

async function fetchMetadata(url: string): Promise<MediaData> {
  // NEXT_PUBLIC_API_URL points to Render backend in production
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const endpoint =
    apiBase && !apiBase.includes("your-app") && !apiBase.includes("backend-your")
      ? apiBase
      : "/api/analyze"; // fallback for local dev only

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: url.trim() }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to analyze the provided URL.");
  }

  return {
    title: data.title,
    creator: data.creator,
    caption: data.caption,
    hashtags: data.hashtags || [],
    thumbnail: data.thumbnail,
    downloadUrl: data.downloadUrl,
    extension: data.extension || "mp4",
    platform: data.platform || "other",
  };
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<MediaData | null>(null);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMediaData(null);

    try {
      const data = await fetchMetadata(url);
      setMediaData(data);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-24">
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 max-w-3xl"
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Download Media <span className="text-primary">Instantly</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Paste a link from supported platforms to fetch metadata, captions, hashtags, and download your content in high quality.
          </p>
        </motion.div>

        <URLInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        <div className="w-full max-w-2xl min-h-[300px] flex flex-col items-center justify-start mt-8">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex w-full items-center gap-3 rounded-xl bg-destructive/10 p-4 text-destructive border border-destructive/20"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium text-left">{error}</p>
              </motion.div>
            )}

            {mediaData && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <MediaCard data={mediaData} />
              </motion.div>
            )}

            {isLoading && !mediaData && !error && (
              <motion.div
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="aspect-video w-full sm:w-2/5 animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1 space-y-4">
                    <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="space-y-2 pt-4">
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="mt-auto h-12 w-full animate-pulse rounded-xl bg-muted pt-4" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
