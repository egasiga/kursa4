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
  
  // Для некоторых браузеров свойство filter может быть не поддержано
  // Проверяем поддержку и используем или CSS фильтры, или ручную обработку
  const canUseFilters = typeof ctx.filter !== 'undefined';
  
  if (canUseFilters) {
    try {
      // Apply filters using CSS filter
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
      
      // Draw the image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Reset filter for subsequent operations
      ctx.filter = "none";
      
      console.log('Применены CSS фильтры:', filters);
    } catch (error) {
      console.warn('Ошибка применения CSS фильтров, используем ручную обработку', error);
      applyFiltersManually(ctx, img, filters, targetWidth, targetHeight);
    }
  } else {
    console.log('CSS фильтры не поддерживаются, используем ручную обработку');
    applyFiltersManually(ctx, img, filters, targetWidth, targetHeight);
  }
}

/**
 * Применяет фильтры к изображению вручную, используя пиксельную обработку
 * Используется как запасной вариант, если CSS фильтры не работают
 */
function applyFiltersManually(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  filters: { brightness: number; contrast: number; saturation: number },
  width: number,
  height: number
) {
  // Отрисовываем изображение на канвас без фильтров
  ctx.drawImage(img, 0, 0, width, height);
  
  // Получаем данные изображения
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Нормализованные значения фильтров (от 0 до 2, где 1 = 100%)
  const brightness = filters.brightness / 100;
  const contrast = filters.contrast / 100;
  const saturation = filters.saturation / 100;
  
  // Применяем эффекты к каждому пикселю
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // Применяем яркость
    r *= brightness;
    g *= brightness;
    b *= brightness;
    
    // Применяем контраст
    const factor = (259 * (contrast + 1)) / (255 * (1 - contrast));
    r = factor * (r - 128) + 128;
    g = factor * (g - 128) + 128;
    b = factor * (b - 128) + 128;
    
    // Применяем насыщенность
    // Преобразуем в HSL и обратно
    const hsv = rgbToHsv(r, g, b);
    hsv[1] *= saturation; // Увеличиваем/уменьшаем насыщенность
    const rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
    
    // Обновляем пиксель с ограничением от 0 до 255
    data[i] = Math.max(0, Math.min(255, rgb[0]));
    data[i + 1] = Math.max(0, Math.min(255, rgb[1]));
    data[i + 2] = Math.max(0, Math.min(255, rgb[2]));
  }
  
  // Обновляем изображение на канвасе
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Конвертирует RGB в HSV
 * r, g, b значения от 0 до 255
 * Возвращает h, s, v значения от 0 до 1
 */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  
  return [h, s, v];
}

/**
 * Конвертирует HSV в RGB
 * h, s, v значения от 0 до 1
 * Возвращает r, g, b значения от 0 до 255
 */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0:
      r = v; g = t; b = p;
      break;
    case 1:
      r = q; g = v; b = p;
      break;
    case 2:
      r = p; g = v; b = t;
      break;
    case 3:
      r = p; g = q; b = v;
      break;
    case 4:
      r = t; g = p; b = v;
      break;
    case 5:
      r = v; g = p; b = q;
      break;
  }
  
  return [r * 255, g * 255, b * 255];
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
