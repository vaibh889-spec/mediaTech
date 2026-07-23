import ytDlp from 'yt-dlp-exec';

export const extractMetadata = async (url: string) => {
  try {
    // Run yt-dlp to get JSON dump
    const result = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    // Ensure we handle both string or object responses
    const info = typeof result === 'string' ? JSON.parse(result) : result;

    // Parse hashtags from description if available
    const description = info.description || info.title || '';
    const hashtags = description.match(/#[\w]+/g) || [];

    return {
      title: info.title || 'Unknown Title',
      creator: info.uploader || info.creator || info.channel || 'Unknown Creator',
      caption: info.description || '',
      hashtags: Array.from(new Set(hashtags)), // Unique hashtags
      thumbnail: info.thumbnail || '',
      downloadUrl: info.url || '', // We can provide the direct URL for download if available
    };
  } catch (error: any) {
    console.error('yt-dlp error:', error);
    throw new Error('Failed to retrieve media information. Please check if the URL is valid and publicly accessible.');
  }
};
