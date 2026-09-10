import path from 'path';

export interface HeroMetadataItem {
  url: string;
  caption: string;
  alt: string;
  isPublished: boolean;
  order: number;
}

// In-memory hero metadata registry
const inMemoryHeroMetadata: Record<string, HeroMetadataItem> = {};

function cleanCaptionName(rawName: string): string {
  // Strip extension
  let clean = rawName.replace(/\.[^/.]+$/, '');
  // Remove leading numbers/timestamps like "1788806795593_" or "1788806795593 "
  clean = clean.replace(/^\d+[\s_-]*/, '');
  // Remove hash strings if remaining string is purely hex/numeric hash
  if (/^[a-f0-9]{20,}$/i.test(clean) || clean.trim().length === 0) {
    return 'Hero Visual Slide';
  }
  clean = clean.replace(/[-_]/g, ' ').trim();
  return clean.length > 0 ? clean : 'Hero Visual Slide';
}

export function getStoredHeroMetadata(): Record<string, HeroMetadataItem> {
  return { ...inMemoryHeroMetadata };
}

export function saveStoredHeroMetadata(metadata: Record<string, HeroMetadataItem>): void {
  Object.assign(inMemoryHeroMetadata, metadata);
}

export function formatHeroCaption(urlOrFilename: string, fallbackCaption?: string): string {
  if (
    fallbackCaption &&
    !/^\d{10,}/.test(fallbackCaption) &&
    !/^[a-f0-9]{20,}/i.test(fallbackCaption)
  ) {
    return fallbackCaption;
  }
  const filename = path.basename(urlOrFilename);
  return cleanCaptionName(filename);
}
