export interface ProcessedMediaVariants {
  originalFile: File;
  thumbnailBlob: Blob;
  cardBlob: Blob;
  fullBlob: Blob;
  aspectRatio: number;
  width: number;
  height: number;
}

/**
 * Enterprise Client-Side Multi-Variant Image Compressor
 * Generates 300px thumbnail, 800px card, and 1920px full WebP image variants in parallel.
 */
export async function processImageVariants(file: File): Promise<ProcessedMediaVariants> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const origWidth = img.width;
        const origHeight = img.height;
        const aspectRatio = origWidth / origHeight;

        const [thumbnailBlob, cardBlob, fullBlob] = await Promise.all([
          resizeImageToBlob(
            img,
            Math.min(300, origWidth),
            Math.min(300 / aspectRatio, origHeight),
            0.85
          ),
          resizeImageToBlob(
            img,
            Math.min(800, origWidth),
            Math.min(800 / aspectRatio, origHeight),
            0.88
          ),
          resizeImageToBlob(
            img,
            Math.min(1920, origWidth),
            Math.min(1920 / aspectRatio, origHeight),
            0.92
          ),
        ]);

        URL.revokeObjectURL(objectUrl);

        resolve({
          originalFile: file,
          thumbnailBlob,
          cardBlob,
          fullBlob,
          aspectRatio,
          width: origWidth,
          height: origHeight,
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for processing'));
    };

    img.src = objectUrl;
  });
}

function resizeImageToBlob(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(targetWidth);
    canvas.height = Math.round(targetHeight);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob generation failed'));
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Resumable Chunked Upload Controller (Simulated Enterprise Chunking)
 */
export async function uploadInChunks({
  file,
  uploadUrl,
  chunkSize = 1024 * 1024, // 1MB chunks
  onProgress,
}: {
  file: File | Blob;
  uploadUrl: string;
  chunkSize?: number;
  onProgress?: (progressPercent: number) => void;
}): Promise<boolean> {
  const totalSize = file.size;
  let offset = 0;

  while (offset < totalSize) {
    const chunk = file.slice(offset, offset + chunkSize);

    // Simulate chunk upload slice
    await new Promise((res) => setTimeout(res, 50));
    offset += chunk.size;

    const progress = Math.min(100, Math.round((offset / totalSize) * 100));
    if (onProgress) onProgress(progress);
  }

  return true;
}
