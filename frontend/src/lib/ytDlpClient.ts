import path from "path";
import ytDlpExec from "yt-dlp-exec";

const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const binaryPath = path.join(process.cwd(), "node_modules", "yt-dlp-exec", "bin", binaryName);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ytDlp = (ytDlpExec as any).create(binaryPath);

export default ytDlp;
