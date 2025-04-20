// Использование Google Magenta для переноса стилей
const tf = require('@tensorflow/tfjs');
const magenta = require('@magenta/image');
const fs = require('fs');
const path = require('path');

// Подключаем Tensorflow.js для работы с нейронной сетью
require('@tensorflow/tfjs-node');

// Модель для стилизации изображений
let styleTransferModel;

// Инициализация модели
async function initializeModel() {
  try {
    console.log('Инициализация модели Google Magenta...');
    styleTransferModel = new magenta.ArbitraryStyleTransfer();
    await styleTransferModel.initialize();
    console.log('Модель успешно инициализирована!');
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации модели:', error);
    return false;
  }
}

// Функция для загрузки изображения и конвертации в тензор
async function loadImage(imagePath) {
  try {
    console.log(`Загрузка изображения из ${imagePath}`);
    const imageBuffer = fs.readFileSync(imagePath);
    const imageTensor = tf.node.decodeImage(imageBuffer);
    return imageTensor;
  } catch (error) {
    console.error(`Ошибка загрузки изображения из ${imagePath}:`, error);
    return null;
  }
}

// Функция для сохранения тензора как изображения
async function saveTensorAsImage(tensor, outputPath) {
  try {
    console.log(`Сохранение изображения в ${outputPath}`);
    // Преобразуем тензор обратно в изображение и сохраняем
    const uint8Array = tf.node.encodePng(tensor);
    fs.writeFileSync(outputPath, uint8Array);
    console.log(`Изображение успешно сохранено в ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Ошибка сохранения изображения в ${outputPath}:`, error);
    return false;
  }
}

// Основная функция для стилизации изображения
async function stylizeImage(contentImagePath, styleImagePath, outputImagePath, styleStrength = 1.0) {
  try {
    console.log('Начало стилизации изображения с помощью Google Magenta');
    
    // Проверяем, инициализирована ли модель
    if (!styleTransferModel) {
      const initialized = await initializeModel();
      if (!initialized) {
        throw new Error('Не удалось инициализировать модель');
      }
    }
    
    // Загружаем изображения
    const contentImage = await loadImage(contentImagePath);
    const styleImage = await loadImage(styleImagePath);
    
    if (!contentImage || !styleImage) {
      throw new Error('Не удалось загрузить изображения');
    }
    
    console.log('Применение стиля...');
    // Применяем стилизацию
    const stylizedImage = await styleTransferModel.stylize(
      contentImage,
      styleImage,
      styleStrength
    );
    
    // Сохраняем результат
    await saveTensorAsImage(stylizedImage, outputImagePath);
    
    // Освобождаем память
    tf.dispose([contentImage, styleImage, stylizedImage]);
    
    console.log('Стилизация успешно завершена!');
    return true;
  } catch (error) {
    console.error('Ошибка в процессе стилизации:', error);
    return false;
  }
}

// Обработка аргументов командной строки
async function main() {
  if (process.argv.length < 5) {
    console.error('Использование: node magenta-stylize.js <путь_к_контенту> <путь_к_стилю> <путь_для_вывода> [сила_стиля]');
    process.exit(1);
  }
  
  const contentPath = process.argv[2];
  const stylePath = process.argv[3];
  const outputPath = process.argv[4];
  const styleStrength = process.argv[5] ? parseFloat(process.argv[5]) : 1.0;
  
  console.log(`Параметры:
    Контент: ${contentPath}
    Стиль: ${stylePath}
    Вывод: ${outputPath}
    Сила стиля: ${styleStrength}
  `);
  
  const success = await stylizeImage(contentPath, stylePath, outputPath, styleStrength);
  
  if (success) {
    console.log('Процесс успешно завершен!');
    process.exit(0);
  } else {
    console.error('Произошла ошибка при стилизации');
    process.exit(1);
  }
}

// Если файл запущен напрямую, а не подключен как модуль
if (require.main === module) {
  main();
} else {
  // Экспортируем функции для использования в других модулях
  module.exports = {
    initializeModel,
    stylizeImage
  };
}