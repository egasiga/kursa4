#!/usr/bin/env node

/**
 * Командная строка для стилизации изображений с Google Magenta
 */

const styler = require('./magenta-core');
const fs = require('fs');

// Функция с таймаутом для предотвращения зависания
async function stylizeWithTimeout(contentPath, stylePath, outputPath, strength, timeout) {
  return Promise.race([
    styler.stylize(contentPath, stylePath, outputPath, strength),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Стилизация не завершилась за ${timeout}ms`)), timeout);
    })
  ]);
}

// Основная функция
async function main() {
  // Проверяем аргументы
  if (process.argv.length < 5) {
    console.error('Использование: node cli-stylize.js <content-path> <style-path> <output-path> [style-strength]');
    process.exit(1);
  }
  
  // Извлекаем аргументы
  const contentPath = process.argv[2];
  const stylePath = process.argv[3];
  const outputPath = process.argv[4];
  const styleStrength = process.argv[5] ? parseFloat(process.argv[5]) : 1.0;
  
  // Проверяем существование входных файлов
  if (!fs.existsSync(contentPath)) {
    console.error(`Ошибка: Файл исходного изображения не найден: ${contentPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(stylePath)) {
    console.error(`Ошибка: Файл стиля не найден: ${stylePath}`);
    process.exit(1);
  }
  
  try {
    // Выполняем стилизацию с таймаутом 2 минуты
    console.log('Запуск Google Magenta стилизации...');
    await stylizeWithTimeout(contentPath, stylePath, outputPath, styleStrength, 120000);
    
    console.log('Стилизация успешно завершена!');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка выполнения стилизации:', err.message);
    
    // В случае таймаута, пробуем сохранить исходное изображение
    if (err.message.includes('не завершилась')) {
      console.log('Копирование исходного изображения из-за таймаута...');
      try {
        fs.copyFileSync(contentPath, outputPath);
        console.log('Исходное изображение скопировано.');
        process.exit(1);
      } catch (copyErr) {
        console.error('Ошибка при копировании исходного изображения:', copyErr);
        process.exit(2);
      }
    } else {
      process.exit(1);
    }
  }
}

// Запускаем основную функцию
main();