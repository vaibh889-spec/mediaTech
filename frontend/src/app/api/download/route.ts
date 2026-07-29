import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const maxDuration = 300;

function getYtDlpBinary(): string {
  const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  const execBin = path.join(process.cwd(), "node_modules", "yt-dlp-exec", "bin", binaryName);
  if (fs.existsSync(execBin)) return execBin;
  return "yt-dlp";
}

function getFfmpegPath(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegPath = require("ffmpeg-static") as string;
    if (ffmpegPath && fs.existsSync(ffmpegPath)) return ffmpegPath;
  } catch {
    // ffmpeg-static not available
  }
  return null;
}

function getCookiesArgs(): string[] {
  const cookiesPath = path.join(process.cwd(), "cookies.txt");
  if (fs.existsSync(cookiesPath)) {
    return ["--cookies", cookiesPath];
  }
  return [];
}

export async function GET(request: NextRequest) {
  const mediaUrl = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") || "media-download.mp4";

  if (!mediaUrl) {
    return NextResponse.json({ success: false, message: "Missing media URL" }, { status: 400 });
  }

  try {
    new URL(mediaUrl);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid URL" }, { status: 400 });
  }

  const ytDlpBin = getYtDlpBinary();
  const cookiesArgs = getCookiesArgs();
  const ffmpegPath = getFfmpegPath();
  const ext = path.extname(filename).replace(".", "") || "mp4";
  const isAudio = ["mp3", "m4a", "ogg", "flac", "wav", "opus"].includes(ext);

  const args: string[] = [...cookiesArgs, "--no-warnings", "--no-playlist", "-o", "-"];

  if (ffmpegPath) {
    args.push("--ffmpeg-location", path.dirname(ffmpegPath));
  }

  if (isAudio) {
    if (ffmpegPath) {
      args.push("-f", "bestaudio", "-x", "--audio-format", "mp3");
    } else {
      args.push("-f", "bestaudio[ext=m4a]/bestaudio[ext=aac]/bestaudio/best");
    }
  } else if (ffmpegPath) {
    args.push(
      "-f",
      "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
      "--merge-output-format",
      "mp4"
    );
  } else {
    args.push("-f", "best[ext=mp4]/best[vcodec!=none][acodec!=none]/best");
  }

  args.push(mediaUrl);

  const safeFilename = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").trim() || "media-download.mp4";
  const contentType = isAudio ? "audio/mpeg" : "video/mp4";

  return new Promise<NextResponse>((resolve) => {
    const proc = spawn(ytDlpBin, args, { stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    let stderr = "";

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    proc.on("close", (code) => {
      if (code !== 0 || chunks.length === 0) {
        const isAuthError =
          stderr.includes("login") ||
          stderr.includes("cookie") ||
          stderr.includes("authentication") ||
          stderr.includes("Sign in") ||
          stderr.includes("log in") ||
          stderr.includes("private") ||
          stderr.includes("age-restricted");

        resolve(
          NextResponse.json(
            {
              success: false,
              message: isAuthError
                ? "This content requires authentication. Export your browser cookies as cookies.txt and place it in the project root folder."
                : "Failed to download media. Make sure the URL is public and accessible.",
            },
            { status: 502 }
          )
        );
        return;
      }

      resolve(
        new NextResponse(Buffer.concat(chunks), {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${safeFilename}"`,
            "Cache-Control": "no-store",
          },
        })
      );
    });

    proc.on("error", (err) => {
      console.error("Failed to spawn yt-dlp:", err);
      resolve(
        NextResponse.json(
          { success: false, message: "Failed to start download process." },
          { status: 500 }
        )
      );
    });
  });
}
