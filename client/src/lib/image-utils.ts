/**
 * Utility functions for image manipulation
 */

/**
 * Applies specified filters to an image on a canvas
 * @param ctx Canvas rendering context
 * @param img Image to apply filters to
 * @param filters Object containing filter values
 * @param width Optional target width
 * @param height Optional target height
 */
export function applyFiltersToImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  filters: { brightness: number; contrast: number; saturation: number },
  width?: number,
  height?: number
) {
  // Calculate dimensions if not provided
  const targetWidth = width || img.width;
  const targetHeight = height || img.height;
  
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Apply filters using CSS filter
  ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
  
  // Draw the image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  
  // Reset filter for subsequent operations
  ctx.filter = "none";
}

/**
 * Loads an image from a URL and returns it as a Promise
 * @param url URL of the image to load
 * @returns Promise that resolves with the loaded image
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Converts a base64 data URL to a Blob
 * @param dataUrl The data URL to convert
 * @returns Promise that resolves with a Blob
 */
export function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then(res => res.blob());
}

/**
 * Resizes an image while maintaining aspect ratio
 * @param img Image element to resize
 * @param maxWidth Maximum width constraint
 * @param maxHeight Maximum height constraint
 * @returns Object with new width and height
 */
export function calculateAspectRatioFit(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  return {
    width: img.width * ratio,
    height: img.height * ratio
  };
}

/**
 * Draws text with outline on canvas
 * @param ctx Canvas rendering context
 * @param text Text to draw
 * @param x X position
 * @param y Y position
 * @param style Object containing text style properties
 */
export function drawTextWithOutline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: {
    fontFamily: string;
    fontSize: number;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    align: string;
  }
) {
  ctx.font = `${style.fontSize}px ${style.fontFamily}`;
  ctx.textAlign = style.align as CanvasTextAlign;
  
  // Draw text stroke
  ctx.lineWidth = style.strokeWidth;
  ctx.strokeStyle = style.strokeColor;
  ctx.strokeText(text, x, y);
  
  // Draw text fill
  ctx.fillStyle = style.color;
  ctx.fillText(text, x, y);
}
