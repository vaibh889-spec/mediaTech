"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface URLInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export function URLInput({ onAnalyze, isLoading }: URLInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onAnalyze(url.trim());
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onSubmit={handleSubmit}
      className="relative flex w-full max-w-2xl items-center"
    >
      <div className="relative flex w-full items-center overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:shadow-md">
        <div className="flex h-14 w-14 items-center justify-center text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste media URL here (e.g. YouTube, Instagram, Twitter)..."
          className="h-14 w-full bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground"
          disabled={isLoading}
          required
        />
        <div className="px-2">
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={cn(
              "flex h-10 items-center justify-center rounded-xl bg-primary px-6 font-medium text-primary-foreground transition-all",
              isLoading || !url.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90 active:scale-95"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
}
