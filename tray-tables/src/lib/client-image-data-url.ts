const DEFAULT_MAX_IMAGE_EDGE_PX = 1600;
const DEFAULT_JPEG_QUALITY = 0.78;

export async function fileToOptimizedDataUrl(
  file: File,
  options?: { maxEdgePx?: number; jpegQuality?: number }
): Promise<string> {
  const MAX_IMAGE_EDGE_PX = options?.maxEdgePx ?? DEFAULT_MAX_IMAGE_EDGE_PX;
  const JPEG_QUALITY = options?.jpegQuality ?? DEFAULT_JPEG_QUALITY;

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  if (typeof document === "undefined") return rawDataUrl;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = rawDataUrl;
  });

  const { naturalWidth, naturalHeight } = image;
  if (!naturalWidth || !naturalHeight) return rawDataUrl;

  const scale = Math.min(1, MAX_IMAGE_EDGE_PX / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export async function fileToOptimizedJpegBlob(
  file: File,
  options?: { maxEdgePx?: number; jpegQuality?: number }
): Promise<Blob> {
  const dataUrl = await fileToOptimizedDataUrl(file, options);
  const res = await fetch(dataUrl);
  const raw = await res.blob();
  return new Blob([raw], { type: "image/jpeg" });
}
