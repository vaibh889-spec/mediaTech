export function sanitizeFilename(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").trim().slice(0, 120);
}

export function buildDownloadFilename(title: string, extension: string): string {
  const safeTitle = sanitizeFilename(title) || "media";
  const safeExtension = extension.replace(/^\./, "") || "mp4";
  return `${safeTitle}.${safeExtension}`;
}
