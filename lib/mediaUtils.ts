import { Memory } from '@/types';

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
  /** The URL to render */
  url: string;
  /** Whether the URL is an image format suitable for Next.js <Image /> */
  isImage: boolean;
  /** Whether the media itself is a video */
  isVideo: boolean;
  /** Optional poster cover image URL for video files */
  poster?: string;
}

/**
 * Determines the safest display URL and type for a Memory item.
 */
export function getMediaDisplayInfo(
  memory: Partial<Memory> | { thumbnail_path?: string | null; storage_path?: string | null; media_type?: string | null }
): MediaDisplayInfo {
  const storageUrl = memory.storage_path || '';
  const thumbUrl = memory.thumbnail_path || '';
  const isVideoMedia = memory.media_type === 'video' || isVideoUrl(storageUrl);

  if (isVideoMedia) {
    const videoUrl = isVideoUrl(storageUrl) ? storageUrl : (isVideoUrl(thumbUrl) ? thumbUrl : (storageUrl || thumbUrl));
    const posterUrl = thumbUrl && !isVideoUrl(thumbUrl) ? thumbUrl : undefined;

    return {
      url: videoUrl,
      isImage: false,
      isVideo: true,
      poster: posterUrl,
    };
  }

  return {
    url: thumbUrl || storageUrl || '',
    isImage: true,
    isVideo: false,
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
