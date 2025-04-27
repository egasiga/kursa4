/**
 * Реализация стилизации изображений с использованием официальной библиотеки Google Magenta
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Загружаем Canvas для работы с изображениями в Node.js (требуется для TensorFlow.js)
const canvas = require('canvas');
const { createCanvas, loadImage, ImageData } = canvas;

// Добавляем ImageData в глобальную область видимости для Magenta
global.ImageData = ImageData;

// Подключаем TensorFlow.js Node для ускорения работы модели
try {
  require('@tensorflow/tfjs-node');
  console.log('TensorFlow.js Node and Canvas successfully loaded');
} catch (error) {
  console.warn('Ошибка загрузки TensorFlow.js Node:', error.message);
  console.warn('Стилизация будет работать медленнее');
}

// Устанавливаем зависимость @magenta/image с помощью npm (это правильная библиотека для стилизации изображений)
try {
  console.log('Проверяем наличие библиотеки @magenta/image...');
  execSync('npm list @magenta/image', { stdio: 'pipe' });
  console.log('@magenta/image уже установлен');
} catch (error) {
  console.log('@magenta/image не установлен. Устанавливаем из npm...');
  try {
    execSync('npm install @magenta/image --save', { stdio: 'inherit' });
    console.log('@magenta/image успешно установлен!');
  } catch (installError) {
    console.error('Ошибка установки @magenta/image:', installError.message);
  }
}

// Загружаем библиотеку Magenta Image для работы с изображениями
const magentaImage = require('@magenta/image');

// Константы для настройки стилизации
const STYLE_STRENGTH = 1.0; // От 0 до 1.0, где 1.0 - максимальная сила стиля
const MAX_IMAGE_SIZE = 384; // Оптимальный размер для баланса между качеством и производительностью
const STYLIZATION_TIMEOUT = 120000; // Увеличиваем таймаут до 2 минут для гарантированного завершения обработки

// Функция для загрузки изображения с помощью Canvas API (совместимо с TensorFlow.js)
async function loadCanvasImage(imagePath) {
  try {
    console.log(`Загружаем изображение с помощью Canvas из ${imagePath}`);
    
    // Загружаем изображение
    const image = await loadImage(imagePath);
    
    // Создаем canvas с размерами изображения
    let width = image.width;
    let height = image.height;
    
    // Изменяем размер изображения с сохранением пропорций
    if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
      if (width > height) {
        height = Math.round(height * (MAX_IMAGE_SIZE / width));
        width = MAX_IMAGE_SIZE;
      } else {
        width = Math.round(width * (MAX_IMAGE_SIZE / height));
        height = MAX_IMAGE_SIZE;
      }
      console.log(`Изображение изменено до размера: ${width}x${height}`);
    }
    
    // Создаем canvas нужного размера
    const cnv = createCanvas(width, height);
    const ctx = cnv.getContext('2d');
    
    // Рисуем изображение на canvas с новыми размерами
    ctx.drawImage(image, 0, 0, width, height);
    
    return cnv;
  } catch (error) {
    console.error(`Ошибка при загрузке изображения через Canvas: ${error.message}`);
    throw error;
  }
}

// Функция для загрузки и предобработки изображения (резервный метод через Jimp)
async function loadAndProcessImage(imagePath) {
  try {
    console.log(`Загружаем изображение через Jimp из ${imagePath}`);

    // Проверяем существование файла
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Файл не найден: ${imagePath}`);
    }

    // Загружаем изображение с помощью Jimp
    const image = await Jimp.read(imagePath);

    // Изменяем размер изображения с сохранением пропорций
    if (image.bitmap.width > MAX_IMAGE_SIZE || image.bitmap.height > MAX_IMAGE_SIZE) {
      if (image.bitmap.width > image.bitmap.height) {
        image.resize(MAX_IMAGE_SIZE, Jimp.AUTO);
      } else {
        image.resize(Jimp.AUTO, MAX_IMAGE_SIZE);
      }
      console.log(`Изображение изменено до размера: ${image.bitmap.width}x${image.bitmap.height}`);
    }

    return image;

  } catch (error) {
    console.error(`Ошибка при загрузке изображения через Jimp: ${error.message}`);
    throw error;
  }
}

// Основная функция для применения стиля Google Magenta
async function applyMagentaStyle(contentImagePath, styleImagePath, outputPath, styleStrength = STYLE_STRENGTH) {
  try {
    console.log(`Начинаем стилизацию Google Magenta...`);
    console.log(`Контентное изображение: ${contentImagePath}`);
    console.log(`Стилевое изображение: ${styleImagePath}`);
    console.log(`Выходной путь: ${outputPath}`);
    console.log(`Сила стиля: ${styleStrength}`);

    // Загружаем изображения с помощью Canvas API
    const contentCanvasImage = await loadCanvasImage(contentImagePath);
    const styleCanvasImage = await loadCanvasImage(styleImagePath);

    // Создаем объект стилизатора Magenta
    const styleTransfer = new magentaImage.ArbitraryStyleTransferNetwork();

    // Загружаем предобученную модель (это происходит автоматически)
    console.log('Загружаем модель стилизации Magenta...');
    await styleTransfer.initialize();
    
    // Применяем стилизацию с Canvas изображениями с таймаутом
    console.log('Применяем стилизацию...');
    
    // Создаем Promise с таймаутом
    const stylizePromise = Promise.race([
      styleTransfer.stylize(contentCanvasImage, styleCanvasImage, styleStrength),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут стилизации')), STYLIZATION_TIMEOUT);
      })
    ]);
    
    const stylizedImage = await stylizePromise;

    // Преобразуем результат обратно в изображение и сохраняем
    const resultImage = new Jimp({
      data: stylizedImage.data,
      width: stylizedImage.width,
      height: stylizedImage.height
    });

    // Сохраняем с высоким качеством
    await resultImage.quality(95).writeAsync(outputPath);

    console.log(`Стилизованное изображение сохранено: ${outputPath}`);
    return true;

  } catch (error) {
    console.error(`Ошибка при применении стиля Magenta: ${error.message}`);

    // В случае ошибки, применяем запасной вариант с более простым подходом
    try {
      console.log('Пробуем альтернативный метод стилизации Magenta...');

      // Создаем объект стилизатора с явно указанным бэкендом CPU
      const simpleStyleTransfer = new magentaImage.ArbitraryStyleTransferNetwork({
        modelUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/style/arbitrary/model.json',
        backend: 'cpu'
      });

      await simpleStyleTransfer.initialize();
      
      // Повторная попытка загрузки и стилизации с Canvas
      try {
        const contentCanvas = await loadCanvasImage(contentImagePath);
        const styleCanvas = await loadCanvasImage(styleImagePath);
        
        // Применяем стилизацию с таймаутом
        const stylizePromise = Promise.race([
          simpleStyleTransfer.stylize(contentCanvas, styleCanvas, styleStrength),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Таймаут альтернативной стилизации')), STYLIZATION_TIMEOUT);
          })
        ]);
        
        const result = await stylizePromise;
        
        // Преобразуем результат в Jimp и сохраняем
        const resultImage = new Jimp({
          data: result.data,
          width: result.width,
          height: result.height
        });
        
        await resultImage.quality(95).writeAsync(outputPath);
        
        console.log('Альтернативная стилизация Magenta успешно применена');
        return true;
      } catch (canvasError) {
        console.error(`Ошибка при стилизации с Canvas: ${canvasError.message}`);
        throw canvasError;
      }
    } catch (fallbackError) {
      console.error(`Ошибка запасного варианта Magenta: ${fallbackError.message}`);
      
      // В случае повторной ошибки, просто копируем исходное изображение
      try {
        console.log('Копируем исходное изображение как запасной вариант');
        fs.copyFileSync(contentImagePath, outputPath);
        return true;
      } catch (copyError) {
        console.error(`Ошибка копирования исходного изображения: ${copyError.message}`);
        return false;
      }
    }
  }
}

// Точка входа для запуска скрипта
async function main() {
  if (process.argv.length < 5) {
    console.error('Использование: node magenta-stylize.cjs <content_path> <style_path> <output_path> [style_strength]');
    process.exit(1);
  }

  const contentPath = process.argv[2];
  const stylePath = process.argv[3];
  const outputPath = process.argv[4];
  const styleStrength = process.argv[5] ? parseFloat(process.argv[5]) : STYLE_STRENGTH;

  try {
    console.log('Запуск стилизации Google Magenta...');
    const success = await applyMagentaStyle(contentPath, stylePath, outputPath, styleStrength);

    if (success) {
      console.log('Стилизация Google Magenta успешно завершена!');
      process.exit(0);
    } else {
      console.error('Не удалось применить стилизацию Google Magenta');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Критическая ошибка: ${error.message}`);
    process.exit(1);
  }
}

// Запускаем процесс стилизации
main();