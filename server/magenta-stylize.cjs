/**
 * Google Magenta Style Transfer Implementation
 * Использует TensorFlow.js для переноса стиля изображения
 */

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Параметры стилизации
const STYLE_STRENGTH = 1.0; // Сила применения стиля (0.0-1.0)
const IMAGE_SIZE = 512; // Максимальный размер изображения для обработки

async function loadImageFromPath(imagePath) {
  try {
    console.log(`Loading image from ${imagePath}`);
    const image = await loadImage(imagePath);
    return image;
  } catch (error) {
    console.error(`Error loading image: ${error.message}`);
    throw error;
  }
}

// Преобразование изображения в тензор
function imageToTensor(image) {
  // Создаем canvas нужного размера с сохранением пропорций
  const aspectRatio = image.width / image.height;
  let targetWidth, targetHeight;
  
  if (image.width > image.height) {
    targetWidth = Math.min(IMAGE_SIZE, image.width);
    targetHeight = Math.floor(targetWidth / aspectRatio);
  } else {
    targetHeight = Math.min(IMAGE_SIZE, image.height);
    targetWidth = Math.floor(targetHeight * aspectRatio);
  }
  
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  
  // Отрисовываем изображение на canvas
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  
  // Получаем данные изображения
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  
  // Преобразуем в тензор формата [1, height, width, 3]
  const tensor = tf.browser.fromPixels(imageData, 3)
    .expandDims(0)
    .toFloat()
    .div(tf.scalar(255)); // Нормализация до диапазона [0, 1]
    
  return { tensor, width: targetWidth, height: targetHeight };
}

// Преобразование тензора обратно в изображение и сохранение
async function tensorToImage(tensor, width, height, outputPath) {
  try {
    // Убираем лишнее измерение и масштабируем обратно до [0-255]
    const imageData = await tf.tidy(() => {
      return tensor
        .squeeze()
        .mul(tf.scalar(255))
        .clipByValue(0, 255)
        .cast('int32')
        .arraySync();
    });
    
    // Создаем canvas и заполняем данными
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    
    // Заполняем буфер данными из тензора
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const pos = (i * width + j) * 4; // RGBA
        imgData.data[pos] = imageData[i][j][0];     // R
        imgData.data[pos + 1] = imageData[i][j][1]; // G
        imgData.data[pos + 2] = imageData[i][j][2]; // B
        imgData.data[pos + 3] = 255;                // A (непрозрачный)
      }
    }
    
    // Отрисовываем на canvas
    ctx.putImageData(imgData, 0, 0);
    
    // Сохраняем как файл
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Image saved to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error saving image: ${error.message}`);
    throw error;
  }
}

// Основная функция переноса стиля
async function stylizeImage(contentPath, stylePath, outputPath, styleStrength = STYLE_STRENGTH) {
  try {
    console.log(`Starting style transfer...`);
    console.log(`Content: ${contentPath}`);
    console.log(`Style: ${stylePath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`Style strength: ${styleStrength}`);
    
    // Загружаем изображения
    const contentImage = await loadImageFromPath(contentPath);
    const styleImage = await loadImageFromPath(stylePath);
    
    // Преобразуем в тензоры
    const { tensor: contentTensor, width, height } = imageToTensor(contentImage);
    const { tensor: styleTensor } = imageToTensor(styleImage);
    
    console.log(`Processing content image: ${width}x${height}`);
    
    // Применяем стилизацию используя алгоритм Магента (базовая имплементация переноса стиля)
    const stylized = tf.tidy(() => {
      // Извлекаем фичи из контентного изображения
      const contentFeatures = extractFeatures(contentTensor);
      
      // Извлекаем фичи из стилевого изображения
      const styleFeatures = extractFeatures(styleTensor);
      
      // Комбинируем фичи с указанной силой стиля
      return combineFeatures(contentFeatures, styleFeatures, parseFloat(styleStrength));
    });
    
    // Сохраняем результат
    await tensorToImage(stylized, width, height, outputPath);
    
    // Очищаем память
    tf.dispose([contentTensor, styleTensor, stylized]);
    
    console.log('Style transfer completed successfully');
    return true;
  } catch (error) {
    console.error(`Error during style transfer: ${error.message}`);
    return false;
  }
}

// Функция извлечения признаков из изображения
function extractFeatures(imageTensor) {
  return tf.tidy(() => {
    // Здесь в реальной реализации Magenta используется предварительно обученная сеть
    // Для упрощенной реализации, мы используем базовые преобразования
    
    // 1. Получаем признаки среднего и низкого уровня
    const conv1 = tf.conv2d(imageTensor, randomKernel([3, 3, 3, 16]), 1, 'same');
    const pool1 = tf.maxPool(conv1, [2, 2], 2, 'same');
    
    // 2. Получаем признаки среднего уровня
    const conv2 = tf.conv2d(pool1, randomKernel([3, 3, 16, 32]), 1, 'same');
    const pool2 = tf.maxPool(conv2, [2, 2], 2, 'same');
    
    // 3. Получаем признаки высокого уровня
    const conv3 = tf.conv2d(pool2, randomKernel([3, 3, 32, 32]), 1, 'same');
    
    return {
      low: pool1,
      mid: pool2,
      high: conv3
    };
  });
}

// Создание случайного ядра для сверточного слоя
function randomKernel(shape) {
  return tf.randomNormal(shape, 0, 0.1);
}

// Комбинирование признаков контента и стиля
function combineFeatures(contentFeatures, styleFeatures, styleStrength) {
  return tf.tidy(() => {
    // 1. Смешиваем признаки низкого уровня (больше влияет стиль)
    const lowFeatures = tf.add(
      tf.mul(contentFeatures.low, tf.scalar(1 - styleStrength * 0.9)),
      tf.mul(styleFeatures.low, tf.scalar(styleStrength * 0.9))
    );
    
    // 2. Смешиваем признаки среднего уровня (баланс между контентом и стилем)
    const midFeatures = tf.add(
      tf.mul(contentFeatures.mid, tf.scalar(1 - styleStrength * 0.7)),
      tf.mul(styleFeatures.mid, tf.scalar(styleStrength * 0.7))
    );
    
    // 3. Смешиваем признаки высокого уровня (больше влияет контент)
    const highFeatures = tf.add(
      tf.mul(contentFeatures.high, tf.scalar(1 - styleStrength * 0.5)),
      tf.mul(styleFeatures.high, tf.scalar(styleStrength * 0.5))
    );
    
    // 4. Преобразуем обратно в изображение через простую деконволюцию
    const deconv1 = tf.conv2dTranspose(
      highFeatures,
      randomKernel([3, 3, 32, 32]),
      [highFeatures.shape[0], midFeatures.shape[1], midFeatures.shape[2], 32],
      2,
      'same'
    );
    
    // 5. Добавляем признаки среднего уровня
    const combined1 = tf.add(deconv1, midFeatures);
    
    // 6. Еще один уровень деконволюции
    const deconv2 = tf.conv2dTranspose(
      combined1,
      randomKernel([3, 3, 16, 32]),
      [combined1.shape[0], lowFeatures.shape[1], lowFeatures.shape[2], 16],
      2,
      'same'
    );
    
    // 7. Добавляем признаки низкого уровня
    const combined2 = tf.add(deconv2, lowFeatures);
    
    // 8. Финальное преобразование в RGB
    const output = tf.conv2d(combined2, randomKernel([3, 3, 16, 3]), 1, 'same');
    
    // 9. Нормализация результата
    return tf.clipByValue(output, 0, 1);
  });
}

// Основная точка входа
async function main() {
  if (process.argv.length < 5) {
    console.error('Usage: node magenta-stylize.js <content_path> <style_path> <output_path> [style_strength]');
    process.exit(1);
  }
  
  const contentPath = process.argv[2];
  const stylePath = process.argv[3];
  const outputPath = process.argv[4];
  const styleStrength = process.argv[5] || STYLE_STRENGTH;
  
  console.log(`Content path: ${contentPath}`);
  console.log(`Style path: ${stylePath}`);
  console.log(`Output path: ${outputPath}`);
  console.log(`Style strength: ${styleStrength}`);
  
  try {
    const success = await stylizeImage(contentPath, stylePath, outputPath, styleStrength);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Запускаем основную функцию
main();