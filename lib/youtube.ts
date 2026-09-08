/**
 * YouTube URL utilities for Lambodara Utsav Association website.
 *
 * Handles all common YouTube URL formats:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - https://youtube.com/shorts/VIDEO_ID
 *   - https://www.youtube.com/watch?v=VIDEO_ID&t=30s (with extra params)
 */

/**
 * Extracts the YouTube video ID from any standard YouTube URL.
 * Returns null if the URL is not a valid YouTube URL.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // youtu.be short link: https://youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

/**
 * Returns whether a string is a valid YouTube video URL.
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Returns the YouTube embed URL for an iframe.
 * Example: https://www.youtube.com/embed/dQw4w9WgXcQ
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Returns the best available thumbnail URL for a YouTube video.
 * hqdefault (480x360) is the safest — maxresdefault may not exist for all videos.
 */
export function getYouTubeThumbnail(videoId: string, quality: 'hq' | 'max' = 'hq'): string {
  if (quality === 'max') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Given any YouTube URL, returns the embed URL and thumbnail URL.
 * Returns null if the URL is not a valid YouTube URL.
 */
export function parseYouTubeUrl(url: string): {
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
} | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return {
    videoId,
    embedUrl: getYouTubeEmbedUrl(videoId),
    thumbnailUrl: getYouTubeThumbnail(videoId),
  };
}
