import { toCanvas } from "html-to-image";

export interface ImageDiagnosticResult {
  blobType: string;
  fileType: string;
  filename: string;
  sizeBytes: number;
  sizeMB: string;
  width: number;
  height: number;
  aspectRatio: string;
  magicBytesHex: string;
  detectedFormat: "JPEG" | "PNG" | "UNKNOWN";
  isMagicBytesValid: boolean;
  canShareFiles: boolean;
  decodable: boolean;
  error?: string;
}

export const EXPORT_WIDTH = 3840;
export const EXPORT_HEIGHT = 4800;

/**
 * Reads first 4 bytes of a blob to check image magic bytes
 */
export async function detectMagicBytes(blob: Blob): Promise<{ hex: string; format: "JPEG" | "PNG" | "UNKNOWN" }> {
  try {
    const buffer = await blob.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");

    let format: "JPEG" | "PNG" | "UNKNOWN" = "UNKNOWN";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      format = "JPEG";
    } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      format = "PNG";
    }

    return { hex, format };
  } catch (err) {
    return { hex: "READ_ERROR", format: "UNKNOWN" };
  }
}

/**
 * Diagnostic validation for exported files (checks magic bytes, actual pixel dimensions, decodability, canShare)
 */
export async function diagnoseExportFile(
  file: File,
  expectedWidth: number = EXPORT_WIDTH,
  expectedHeight: number = EXPORT_HEIGHT
): Promise<ImageDiagnosticResult> {
  const magic = await detectMagicBytes(file);
  const isMagicBytesValid =
    (file.type === "image/jpeg" && magic.format === "JPEG") ||
    (file.type === "image/png" && magic.format === "PNG");

  let width = 0;
  let height = 0;
  let decodable = false;
  let errorMsg: string | undefined;

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = new Image();
    img.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image element failed to load blob URL."));
    });

    width = img.naturalWidth;
    height = img.naturalHeight;

    if ("decode" in img) {
      await img.decode();
    }
    decodable = true;
  } catch (e: any) {
    decodable = false;
    errorMsg = e.message || String(e);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  let canShareFiles = false;
  if (typeof navigator !== "undefined" && navigator.canShare) {
    try {
      canShareFiles = navigator.canShare({ files: [file] });
    } catch (_) {
      canShareFiles = false;
    }
  }

  const aspectRatio = height > 0 ? (width / height).toFixed(2) : "0";

  const result: ImageDiagnosticResult = {
    blobType: file.type,
    fileType: file.type,
    filename: file.name,
    sizeBytes: file.size,
    sizeMB: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    width,
    height,
    aspectRatio,
    magicBytesHex: magic.hex,
    detectedFormat: magic.format,
    isMagicBytesValid,
    canShareFiles,
    decodable,
    error: errorMsg,
  };

  console.log("==========================================");
  console.log("[ONEDAY EXPORT DIAGNOSTICS]", result);
  console.log("==========================================");

  return result;
}

/**
 * Generates a high-resolution 3840 x 4800 canvas and Blob directly from a DOM node.
 * Uses html-to-image toCanvas with pixelRatio 4 on unscaled 960x1200 node,
 * then invokes native canvas.toBlob() to output binary Blob without base64 overhead.
 */
export async function renderHighResCardBlob(
  node: HTMLElement,
  format: "image/png" | "image/jpeg",
  quality: number = 0.95
): Promise<Blob> {
  // 1. Await font loading
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn("Fonts ready check warning:", e);
    }
  }

  // Small delay for DOM and fonts to settle in offscreen container
  await new Promise((r) => setTimeout(r, 100));

  // 2. Render to HTML5 Canvas at 3840x4800 (pixelRatio: 4 on 960x1200)
  const canvas = await toCanvas(node, {
    pixelRatio: 4,
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    cacheBust: true,
    style: {
      transform: "none",
      margin: "0",
    },
  });

  // Ensure canvas dimensions are exactly 3840 x 4800
  let targetCanvas = canvas;
  if (canvas.width !== EXPORT_WIDTH || canvas.height !== EXPORT_HEIGHT) {
    console.warn(`Adjusting canvas dimensions: ${canvas.width}x${canvas.height} -> ${EXPORT_WIDTH}x${EXPORT_HEIGHT}`);
    const rescaledCanvas = document.createElement("canvas");
    rescaledCanvas.width = EXPORT_WIDTH;
    rescaledCanvas.height = EXPORT_HEIGHT;
    const ctx = rescaledCanvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(canvas, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
      targetCanvas = rescaledCanvas;
    }
  }

  // 3. Convert HTML5 Canvas directly to Blob using native browser canvas.toBlob
  return new Promise<Blob>((resolve, reject) => {
    targetCanvas.toBlob(
      (b) => {
        if (b && b.size > 0) {
          resolve(b);
        } else {
          reject(new Error("Canvas toBlob returned an empty blob."));
        }
      },
      format,
      quality
    );
  });
}
