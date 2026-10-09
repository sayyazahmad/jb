// Shrink a receipt photo before upload: WhatsApp images are often 2–4 MB; a 1600px JPEG at 0.75 quality
// is ~150–300 KB and still easily readable.
const MAX_SIDE = 1600;
const QUALITY = 0.75;

export const compressImage = async (file: File): Promise<Blob> => {
  // imageOrientation applies the EXIF rotation, so phone photos aren't saved sideways
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process the image');
  ctx.fillStyle = '#ffffff'; // transparent PNG screenshots would otherwise turn black as JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not process the image'))), 'image/jpeg', QUALITY)
  );
};
