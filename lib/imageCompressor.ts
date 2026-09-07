/**
 * High-definition in-browser WebP image optimization for Hero Section background slides.
 * Maintains razor-sharp 1080p Full HD resolution (1920px width) while compressing file sizes.
 */
export async function compressImageUnder50KB(file: File): Promise<{
  compressedFile: File;
  originalSizeKB: number;
  compressedSizeKB: number;
  wasCompressed: boolean;
}> {
  const MAX_HERO_SIZE_BYTES = 200 * 1024; // 200 KB limit for HD clarity
  const originalSizeKB = file.size / 1024;

  // If already optimized under 200 KB or not an image file, return as is
  if (file.size <= MAX_HERO_SIZE_BYTES || !file.type.startsWith('image/')) {
    return {
      compressedFile: file,
      originalSizeKB,
      compressedSizeKB: originalSizeKB,
      wasCompressed: false,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = async () => {
      URL.revokeObjectURL(url);

      let width = img.width;
      let height = img.height;

      // Retain Full HD 1920px width for razor-sharp desktop background rendering
      const MAX_INIT_WIDTH = 1920;
      if (width > MAX_INIT_WIDTH) {
        height = Math.round((height * MAX_INIT_WIDTH) / width);
        width = MAX_INIT_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          compressedFile: file,
          originalSizeKB,
          compressedSizeKB: originalSizeKB,
          wasCompressed: false,
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to high-clarity WebP at 0.85 quality
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), 'image/webp', 0.85)
      );

      if (blob) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
        const compressedFile = new File([blob], cleanName, { type: 'image/webp' });
        resolve({
          compressedFile,
          originalSizeKB,
          compressedSizeKB: blob.size / 1024,
          wasCompressed: true,
        });
      } else {
        resolve({
          compressedFile: file,
          originalSizeKB,
          compressedSizeKB: originalSizeKB,
          wasCompressed: false,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        compressedFile: file,
        originalSizeKB,
        compressedSizeKB: originalSizeKB,
        wasCompressed: false,
      });
    };
  });
}
