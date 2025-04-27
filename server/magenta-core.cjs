
/**
 * Базовая реализация стилизации изображений с использованием Google Magenta
 */

// Подключаем TensorFlow.js + Node (для ускорения)
const tf = require('@tensorflow/tfjs-node');

// Импортируем основные библиотеки
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const magenta = require('@magenta/image');

// Переопределяем методы поиска URL для модели
// Это необходимо, чтобы исправить проблему с URL формированием
global.fetch = require('node-fetch');

// Патчим библиотеку TensorFlow.js, чтобы она правильно разрешала URL
const originalHTTPRequest = tf.io.http;
if (originalHTTPRequest && originalHTTPRequest.getLoadHandlers) {
  const originalGetLoadHandlers = originalHTTPRequest.getLoadHandlers;
  originalHTTPRequest.getLoadHandlers = function(...args) {
    console.log('Перехват запроса на загрузку модели:', ...args);
    return originalGetLoadHandlers.apply(this, args);
  };
}

/**
 * Класс для работы с Google Magenta стилизацией
 */
class MagentaStyleTransfer {
  constructor() {
    // Максимальный размер обрабатываемого изображения (меньше = быстрее)
    this.maxSize = 256;
    // Модель Google Magenta
    this.model = null;
    // Флаг инициализации
    this.initialized = false;
  }

  /**
   * Инициализация модели
   */
  async initialize() {
    if (this.initialized) return;

    console.log('Инициализация модели Google Magenta...');
    
    try {
      // Создаем модель с явным указанием базового URL модели
      // Важно: в Node.js необходимо передать полный URL как строку
      const MODEL_URL = 'https://storage.googleapis.com/magentadata/js/checkpoints/style/arbitrary';
      
      // Необходимо создать модель с определенными опциями
      this.model = new magenta.ArbitraryStyleTransferNetwork({
        // Явно определяем URL модели
        modelUrl: MODEL_URL + '/model.json',
        // Устанавливаем обработчик для загрузки весов
        onProgress: (progress) => {
          console.log(`Загрузка модели: ${Math.round(progress * 100)}%`);
        }
      });
      
      console.log(`Загрузка модели из: ${MODEL_URL}/model.json`);
      
      // Создаем собственную функцию загрузки модели
      // Вместо стандартной initialize() используем наш подход
      if (typeof this.model.initialize === 'function') {
        console.log('Используем стандартный метод инициализации модели');
        await this.model.initialize();
      } else {
        console.log('Используем альтернативный метод инициализации модели');
        // Если initialize отсутствует, загружаем модель вручную
        if (typeof this.model.load === 'function') {
          await this.model.load();
        }
      }
      
      this.initialized = true;
      console.log('Модель Google Magenta инициализирована успешно!');
    } catch (err) {
      console.error('Ошибка инициализации модели Google Magenta:', err);
      throw err;
    }
  }

  /**
   * Загрузка и изменение размера изображения
   */
  async loadAndResizeImage(imagePath) {
    console.log(`Загрузка изображения из ${imagePath}`);
    
    try {
      // Загружаем изображение
      const img = await loadImage(imagePath);
      
      // Вычисляем новые размеры с сохранением пропорций
      let width = img.width;
      let height = img.height;
      
      if (width > this.maxSize || height > this.maxSize) {
        if (width > height) {
          height = Math.round(height * (this.maxSize / width));
          width = this.maxSize;
        } else {
          width = Math.round(width * (this.maxSize / height));
          height = this.maxSize;
        }
      }
      
      console.log(`Изображение изменено до размера ${width}x${height}`);
      
      // Создаем canvas и рисуем изображение
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      return canvas;
    } catch (err) {
      console.error(`Ошибка при загрузке изображения ${imagePath}:`, err);
      throw err;
    }
  }

  /**
   * Применение стиля к изображению
   */
  async stylize(contentPath, stylePath, outputPath, styleStrength = 1.0) {
    try {
      // Убедимся, что модель инициализирована
      if (!this.initialized) {
        await this.initialize();
      }
      
      console.log(`Применение стиля к изображению...
      Контент: ${contentPath}
      Стиль: ${stylePath} 
      Выход: ${outputPath}
      Сила стиля: ${styleStrength}`);
      
      // Загружаем изображения
      const contentCanvas = await this.loadAndResizeImage(contentPath);
      const styleCanvas = await this.loadAndResizeImage(stylePath);
      
      // Применяем стилизацию
      console.log('Выполняется стилизация Google Magenta...');
      const stylized = await this.model.stylize(contentCanvas, styleCanvas, styleStrength);
      
      // Сохраняем результат
      const buffer = Buffer.from(stylized.data);
      
      // Записываем изображение с библиотекой Canvas
      const outputCanvas = createCanvas(stylized.width, stylized.height);
      const ctx = outputCanvas.getContext('2d');
      const imageData = ctx.createImageData(stylized.width, stylized.height);
      
      // Копируем данные пикселей
      for (let i = 0; i < buffer.length; i++) {
        imageData.data[i] = buffer[i];
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Сохраняем в файл
      const outStream = fs.createWriteStream(outputPath);
      const stream = outputCanvas.createJPEGStream({ quality: 0.95 });
      stream.pipe(outStream);
      
      return new Promise((resolve, reject) => {
        outStream.on('finish', () => {
          console.log('Стилизованное изображение сохранено успешно!');
          resolve(true);
        });
        
        outStream.on('error', (err) => {
          console.error('Ошибка при сохранении стилизованного изображения:', err);
          reject(err);
        });
      });
    } catch (err) {
      console.error('Ошибка при выполнении стилизации:', err);
      throw err;
    }
  }
}

// Создаем и экспортируем экземпляр для использования в других модулях
const styler = new MagentaStyleTransfer();
module.exports = styler;
