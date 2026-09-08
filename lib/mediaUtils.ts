import { Memory } from '@/types';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube';

/**
 * Checks if a given URL points to a video file.
 */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split('?')[0];
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.includes('/videos/')
  );
}

export interface MediaDisplayInfo {
  /** The playback/display URL (embed URL for YouTube, image URL for photos, direct video URL for videos) */
  url: string;
  /** The actual image thumbnail URL to render in cards/lists */
  thumbnailUrl: string;
  /** Whether the URL is an image format suitable for Next.js <Image /> */
  isImage: boolean;
  /** Whether the media itself is a video */
  isVideo: boolean;
  /** Whether this is a YouTube-embedded video (use <iframe> instead of <video>) */
  isYouTube: boolean;
  /** YouTube Video ID — only set when isYouTube is true */
  youtubeVideoId?: string;
  /** Optional poster cover image URL for video files */
  poster?: string;
}

/**
 * Determines the safest display URL and type for a Memory item.
 *
 * Priority:
 * 1. If youtube_video_id exists → YouTube embed (iframe) + YouTube thumbnail
 * 2. If media_type === 'video' (Supabase-stored legacy video) → use storage_path
 * 3. Otherwise → image from thumbnail_path or storage_path (Cloudinary or Supabase)
 */
export function getMediaDisplayInfo(
  memory: Partial<Memory> | { thumbnail_path?: string | null; storage_path?: string | null; media_type?: string | null; youtube_video_id?: string | null }
): MediaDisplayInfo {
  const storageUrl = memory.storage_path || '';
  const thumbUrl = memory.thumbnail_path || '';

  // Extract YouTube ID if set or embedded in any path
  const detectedYouTubeId =
    memory.youtube_video_id ||
    (typeof storageUrl === 'string' && storageUrl.includes('youtu') ? extractYouTubeId(storageUrl) : null) ||
    (typeof thumbUrl === 'string' && thumbUrl.includes('youtu') ? extractYouTubeId(thumbUrl) : null);

  const isVideoMedia = memory.media_type === 'video' || isVideoUrl(storageUrl) || !!detectedYouTubeId;

  // ── YouTube-embedded video (Zero-Lag Facade Pattern) ───────────────────────
  if (detectedYouTubeId) {
    const videoId = detectedYouTubeId;
    // Guaranteed to exist for 100% of YouTube videos (unlike maxresdefault which 404s on 480p/shorts)
    const validThumb =
      (thumbUrl && !thumbUrl.includes('youtube.com/embed') && !isVideoUrl(thumbUrl) ? thumbUrl : null) ||
      getYouTubeThumbnail(videoId, 'hq');

    return {
      url: getYouTubeEmbedUrl(videoId),
      thumbnailUrl: validThumb,
      isImage: false,
      isVideo: true,
      isYouTube: true,
      youtubeVideoId: videoId,
      poster: validThumb,
    };
  }

  // ── Supabase-stored legacy video (backward compat) ──────────────────────────
  if (isVideoMedia) {
    const videoUrl = isVideoUrl(storageUrl) ? storageUrl : (isVideoUrl(thumbUrl) ? thumbUrl : (storageUrl || thumbUrl));
    const posterUrl = thumbUrl && !isVideoUrl(thumbUrl) ? thumbUrl : undefined;

    return {
      url: videoUrl,
      thumbnailUrl: posterUrl || '',
      isImage: false,
      isVideo: true,
      isYouTube: false,
      poster: posterUrl,
    };
  }

  // ── Image (Cloudflare R2, Cloudinary, or Supabase) ──────────────────────────
  const imgUrl = thumbUrl || storageUrl || '';
  return {
    url: imgUrl,
    thumbnailUrl: imgUrl,
    isImage: true,
    isVideo: false,
    isYouTube: false,
  };
}


/**
 * Returns a Pinterest-style Tailwind aspect ratio class for staggered masonry layout.
 */
export function getMasonryAspectClass(index: number = 0, memory?: Partial<Memory>): string {
  if (memory?.width && memory?.height && memory.width > 0 && memory.height > 0) {
    const ratio = memory.width / memory.height;
    if (ratio < 0.65) return 'aspect-[9/16]';
    if (ratio < 0.85) return 'aspect-[3/4]';
    if (ratio < 1.15) return 'aspect-square';
    if (ratio < 1.4) return 'aspect-[4/3]';
    return 'aspect-[16/9]';
  }

  // Staggered pattern for Pinterest look
  const aspectPatterns = [
    'aspect-[3/4]',
    'aspect-[4/5]',
    'aspect-square',
    'aspect-[2/3]',
    'aspect-[9/16]',
    'aspect-[4/3]',
    'aspect-[3/4]',
    'aspect-square',
  ];

  return aspectPatterns[index % aspectPatterns.length];
}
