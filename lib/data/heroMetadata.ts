import fs from 'fs';
import path from 'path';

export interface HeroMetadataItem {
  url: string;
  caption: string;
  alt: string;
  isPublished: boolean;
  order: number;
}

const METADATA_PATH = path.join(process.cwd(), 'public', 'uploads', 'hero-section-metadata.json');

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
  try {
    if (fs.existsSync(METADATA_PATH)) {
      const content = fs.readFileSync(METADATA_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed reading hero metadata:', err);
  }
  return {};
}

export function saveStoredHeroMetadata(metadata: Record<string, HeroMetadataItem>): void {
  try {
    const dir = path.dirname(METADATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving hero metadata:', err);
  }
}

export function formatHeroCaption(urlOrFilename: string, fallbackCaption?: string): string {
  if (fallbackCaption && !/^\d{10,}/.test(fallbackCaption) && !/^[a-f0-9]{20,}/i.test(fallbackCaption)) {
    return fallbackCaption;
  }
  const filename = path.basename(urlOrFilename);
  return cleanCaptionName(filename);
}
