/**
 * Client-side image downscale: longest edge 1600px, WebP, at most 1 MB (the bucket refuses more).
 * Runs in the browser before upload so slow campus Wi-Fi never carries a 12 MB phone photo.
 */
export async function downscaleImage(file: File, maxEdge = 1600, maxBytes = 1_000_000): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.86, 0.76, 0.66, 0.56, 0.46]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (blob && blob.size <= maxBytes) return blob;
  }
  throw new Error("image too large even after resizing");
}
