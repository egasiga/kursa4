/**
 * Реализация стилизации изображений с использованием официальной библиотеки Google Magenta
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

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
const MAX_IMAGE_SIZE = 1024; // Ограничение по размеру изображения для эффективной обработки

// Функция для загрузки и предобработки изображения
async function loadAndProcessImage(imagePath) {
  try {
    console.log(`Загружаем изображение из ${imagePath}`);
    
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
    console.error(`Ошибка при загрузке изображения: ${error.message}`);
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
    
    // Загружаем изображения
    const contentImage = await loadAndProcessImage(contentImagePath);
    const styleImage = await loadAndProcessImage(styleImagePath);
    
    // Создаем объект стилизатора Magenta
    const styleTransfer = new magentaImage.ArbitraryStyleTransferNetwork();
    
    // Загружаем предобученную модель (это происходит автоматически)
    console.log('Загружаем модель стилизации Magenta...');
    await styleTransfer.initialize();
    
    // Конвертируем изображения в формат, понятный для Magenta
    const content = styleTransfer.prepareContentImage(contentImage.bitmap);
    const style = styleTransfer.prepareStyleImage(styleImage.bitmap);
    
    // Применяем стилизацию
    console.log('Применяем стилизацию...');
    const stylizedImage = await styleTransfer.stylize(content, style, styleStrength);
    
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
      
      // Создаем объект простого стилизатора Magenta
      const simpleStyleTransfer = new magentaImage.ArbitraryStyleTransferNetwork({
        modelUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/style/arbitrary/model.json',
        backend: 'webgl'
      });
      
      await simpleStyleTransfer.initialize();
      
      // Загружаем изображения напрямую
      const contentBuffer = fs.readFileSync(contentImagePath);
      const styleBuffer = fs.readFileSync(styleImagePath);
      
      // Применяем стилизацию с уменьшенными настройками качества
      const result = await simpleStyleTransfer.stylize(
        contentBuffer, 
        styleBuffer,
        styleStrength
      );
      
      // Сохраняем полученное изображение
      fs.writeFileSync(outputPath, result);
      
      console.log('Альтернативная стилизация Magenta успешно применена');
      return true;
    } catch (fallbackError) {
      console.error(`Ошибка запасного варианта Magenta: ${fallbackError.message}`);
      return false;
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