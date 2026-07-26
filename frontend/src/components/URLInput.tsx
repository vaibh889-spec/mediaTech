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
      <div className="relative flex w-full flex-col sm:flex-row items-center gap-3 sm:gap-0 sm:overflow-hidden sm:rounded-2xl sm:border sm:bg-background sm:shadow-sm sm:transition-shadow sm:focus-within:ring-2 sm:focus-within:ring-primary sm:focus-within:ring-offset-2 sm:hover:shadow-md">
        <div className="flex w-full items-center overflow-hidden rounded-2xl border bg-background shadow-sm sm:border-none sm:shadow-none sm:rounded-none">
          <div className="flex h-14 w-14 items-center justify-center text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste media URL here..."
            className="h-14 w-full bg-transparent px-2 text-sm sm:text-base outline-none placeholder:text-muted-foreground"
            disabled={isLoading}
            required
          />
        </div>
        <div className="w-full sm:w-auto sm:px-2">
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={cn(
              "flex h-12 sm:h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-primary px-6 font-medium text-primary-foreground transition-all",
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
