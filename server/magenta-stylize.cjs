/**
 * Реализация стилизации изображений с использованием официальной библиотеки Google Magenta
 */

// Подключаем TensorFlow Node и инициализируем его ПЕРЕД загрузкой других библиотек
// Это критично, так как TensorFlow.js требует явной инициализации
// Устанавливаем его глобально и регистрируем как бэкенд
const tf = require('@tensorflow/tfjs-node');
// Явно сообщаем, что мы используем бэкенд tensorflow-node
console.log('TensorFlow.js version:', tf.version);
console.log('TensorFlow.js backend:', tf.getBackend());

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Загружаем Canvas для работы с изображениями в Node.js (требуется для TensorFlow.js)
const canvas = require('canvas');
const { createCanvas, loadImage, ImageData } = canvas;

// Добавляем ImageData в глобальную область видимости для Magenta
global.ImageData = ImageData;

// Сообщаем, что TensorFlow.js Node уже загружен в начале файла
console.log('TensorFlow.js Node and Canvas successfully loaded');

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

// Создаем класс-обертку для Google Magenta, чтобы упростить использование
class MagentaStyler {
  constructor(options = {}) {
    // Проблема в том, что параметры не корректно передаются в библиотеку
    // Создаем объект стилизатора Magenta без дополнительных опций
    this.styleTransfer = new magentaImage.ArbitraryStyleTransferNetwork();
    this.initialized = false;
    
    // Сохраняем URL модели для использования в процессе инициализации
    this.modelUrl = options.modelUrl || 'https://storage.googleapis.com/magentadata/js/checkpoints/style/arbitrary/model.json';
    console.log('Используем URL модели:', this.modelUrl);
  }

  // Инициализация модели
  async initialize() {
    if (!this.initialized) {
      console.log('Инициализация Google Magenta стилизатора...');
      // Убеждаемся, что TensorFlow.js корректно настроен перед инициализацией
      console.log('Текущий бэкенд TensorFlow:', tf.getBackend());
      
      try {
        // Здесь ключевое изменение - мы загружаем модель самостоятельно через TensorFlow.js
        // и инициализируем стилизатор напрямую, без использования modelUrl опции
        
        // 1. Увеличим размер изображения для лучшего качества
        const MAX_IMAGE_SIZE = 256; // Меньший размер для ускорения
        
        // 2. Уменьшим время таймаута до 60 секунд для более быстрого отклика
        this.styleTransfer.initialize();
        
        // 3. Метод initialize() сам загрузит модель по URL по умолчанию
        this.initialized = true;
        console.log('Google Magenta стилизатор инициализирован!');
      } catch (error) {
        console.error('Ошибка инициализации стилизатора:', error.message);
        throw error;
      }
    }
  }

  // Стилизация изображения
  async stylize(contentImage, styleImage, styleStrength = 1.0) {
    // Проверяем, что модель инициализирована
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('Применяем стилизацию Google Magenta...');
    return await this.styleTransfer.stylize(contentImage, styleImage, styleStrength);
  }
}

// Создаем глобальный экземпляр класса
const magentaStyler = new MagentaStyler();

// Константы для настройки стилизации
const STYLE_STRENGTH = 1.0; // От 0 до 1.0, где 1.0 - максимальная сила стиля
const MAX_IMAGE_SIZE = 256; // Сильно уменьшаем размер для максимального ускорения стилизации
const STYLIZATION_TIMEOUT = 90000; // Уменьшаем таймаут до 90 секунд для более быстрого отклика

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

// Основная функция для применения стиля Google Magenta с использованием нашего класса-обертки
async function applyMagentaStyle(contentImagePath, styleImagePath, outputPath, styleStrength = STYLE_STRENGTH) {
  try {
    console.log(`Начинаем стилизацию Google Magenta...`);
    console.log(`Контентное изображение: ${contentImagePath}`);
    console.log(`Стилевое изображение: ${styleImagePath}`);
    console.log(`Выходной путь: ${outputPath}`);
    console.log(`Сила стиля: ${styleStrength}`);

    // Инициализируем Google Magenta стилизатор
    await magentaStyler.initialize();

    // Загружаем изображения с помощью Canvas API (с уменьшенным размером)
    const contentCanvasImage = await loadCanvasImage(contentImagePath);
    const styleCanvasImage = await loadCanvasImage(styleImagePath);
    
    // Применяем стилизацию с таймаутом
    console.log('Применяем стилизацию...');
    
    // Создаем Promise с таймаутом
    const stylizePromise = Promise.race([
      magentaStyler.stylize(contentCanvasImage, styleCanvasImage, styleStrength),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Стилизация превысила таймаут ' + STYLIZATION_TIMEOUT + 'ms, завершаем процесс')), STYLIZATION_TIMEOUT);
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

    // В случае ошибки, применяем запасной вариант с прямым указанием URL моделей
    try {
      console.log('Пробуем альтернативный метод стилизации Magenta с указанием URL...');

      // Создаем объект стилизатора с явным указанием URL моделей и backend
      const backupStyler = new MagentaStyler({
        modelUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/style/arbitrary/model.json'
      });
      
      // Инициализируем запасной стилизатор
      await backupStyler.styleTransfer.initialize();
      
      // Загружаем уменьшенные изображения
      const contentCanvas = await loadCanvasImage(contentImagePath);
      const styleCanvas = await loadCanvasImage(styleImagePath);
      
      // Применяем стилизацию с таймаутом
      const stylizePromise = Promise.race([
        backupStyler.styleTransfer.stylize(contentCanvas, styleCanvas, styleStrength),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Запасная стилизация превысила таймаут')), STYLIZATION_TIMEOUT);
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
    } catch (fallbackError) {
      console.error(`Ошибка запасного варианта Magenta: ${fallbackError.message}`);
      
      // В случае повторной ошибки, выводим предупреждение, что копируем исходное изображение
      try {
        console.log('Не удалось применить стилизацию. Копируем исходное изображение как запасной вариант.');
        fs.copyFileSync(contentImagePath, outputPath);
        return false; // Возвращаем false, чтобы показать, что стилизация не удалась
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