import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const router = Router();

function getYtDlpBinary(): string {
  const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  // On Render, yt-dlp-exec installs the binary here
  const execBin = path.join(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', binaryName);
  if (fs.existsSync(execBin)) return execBin;
  // Fallback: system yt-dlp
  return 'yt-dlp';
}

function getFfmpegPath(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegPath = require('ffmpeg-static') as string;
    if (ffmpegPath && fs.existsSync(ffmpegPath)) return ffmpegPath;
  } catch {
    // ffmpeg-static not available
  }
  return null;
}

function getCookiesArgs(): string[] {
  const cookiesPath = path.join(process.cwd(), 'cookies.txt');
  if (fs.existsSync(cookiesPath)) {
    return ['--cookies', cookiesPath];
  }
  return [];
}

router.get('/', (req: Request, res: Response) => {
  const mediaUrl = req.query.url as string | undefined;
  const filename = (req.query.filename as string | undefined) || 'media-download.mp4';

  if (!mediaUrl) {
    res.status(400).json({ success: false, message: 'Missing media URL' });
    return;
  }

  try {
    new URL(mediaUrl);
  } catch {
    res.status(400).json({ success: false, message: 'Invalid URL' });
    return;
  }

  const ytDlpBin = getYtDlpBinary();
  const cookiesArgs = getCookiesArgs();
  const ffmpegPath = getFfmpegPath();

  const ext = path.extname(filename).replace('.', '') || 'mp4';
  const isAudio = ['mp3', 'm4a', 'ogg', 'flac', 'wav', 'opus'].includes(ext);

  const args: string[] = [
    ...cookiesArgs,
    '--no-warnings',
    '--no-playlist',
    '-o', '-', // stdout
  ];

  if (ffmpegPath) {
    args.push('--ffmpeg-location', path.dirname(ffmpegPath));
  }

  if (isAudio) {
    if (ffmpegPath) {
      args.push('-f', 'bestaudio', '-x', '--audio-format', 'mp3');
    } else {
      args.push('-f', 'bestaudio[ext=m4a]/bestaudio[ext=aac]/bestaudio/best');
    }
  } else {
    if (ffmpegPath) {
      args.push(
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
        '--merge-output-format', 'mp4'
      );
    } else {
      args.push('-f', 'best[ext=mp4]/best[vcodec!=none][acodec!=none]/best');
    }
  }

  args.push(mediaUrl);

  const proc = spawn(ytDlpBin, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const safeFilename = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim() || 'media-download.mp4';
  const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.setHeader('Cache-Control', 'no-store');

  let stderr = '';
  let headersSent = false;

  proc.stderr.on('data', (data: Buffer) => {
    stderr += data.toString();
  });

  proc.stdout.on('data', (chunk: Buffer) => {
    if (!headersSent) {
      headersSent = true;
    }
    res.write(chunk);
  });

  proc.on('close', (code) => {
    if (code !== 0 && !headersSent) {
      const isAuthError =
        stderr.includes('login') ||
        stderr.includes('cookie') ||
        stderr.includes('authentication') ||
        stderr.includes('Sign in') ||
        stderr.includes('log in') ||
        stderr.includes('private') ||
        stderr.includes('age-restricted');

      res.status(502).json({
        success: false,
        message: isAuthError
          ? 'This content requires authentication. Export your browser cookies as cookies.txt and place it in the project root folder.'
          : 'Failed to download media. Make sure the URL is public and accessible.',
      });
      return;
    }
    res.end();
  });

  proc.on('error', (err) => {
    if (!headersSent) {
      console.error('Failed to spawn yt-dlp:', err);
      res.status(500).json({ success: false, message: 'Failed to start download process.' });
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    proc.kill();
  });
});

export default router;
