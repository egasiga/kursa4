/**
 * Модуль для стилизации изображений с использованием Google Magenta (TensorFlow Hub)
 * 
 * Этот модуль использует модель arbitrary-image-stylization-v1-256 из TensorFlow Hub
 * для применения произвольного художественного стиля к изображениям.
 * Модель полностью бесплатна и работает без API ключа.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { AiStyle } from '@shared/schema';

// Директория для временных файлов
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Применяет стилизацию к изображению с помощью Google Magenta
 * @param imageBase64 Исходное изображение в формате base64 (с префиксом data:image)
 * @param styleParams Параметры стиля
 * @returns Стилизованное изображение в формате base64
 */
export async function magentaStyleImage(imageBase64: string, styleParams: any): Promise<string> {
  try {
    console.log("Применение стиля через Google Magenta:", styleParams.aiModel);
    
    // Получаем данные изображения без префикса
    const contentBase64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const contentBuffer = Buffer.from(contentBase64Data, 'base64');
    
    // Временные файлы для содержимого и стиля
    const timestamp = Date.now();
    const contentImagePath = path.join(TEMP_DIR, `content_${timestamp}.jpg`);
    const styleImagePath = path.join(TEMP_DIR, `style_${timestamp}.jpg`);
    const outputImagePath = path.join(TEMP_DIR, `output_${timestamp}.jpg`);
    
    // Сохраняем контентное изображение
    fs.writeFileSync(contentImagePath, contentBuffer);
    
    // Создаем или получаем изображение стиля
    let styleBuffer: Buffer;
    
    // Если есть стилевое изображение в параметрах, используем его
    if (styleParams.styleImage && styleParams.styleImage.startsWith('data:image')) {
      const styleBase64 = styleParams.styleImage.replace(/^data:image\/\w+;base64,/, "");
      styleBuffer = Buffer.from(styleBase64, 'base64');
    } else {
      // Иначе используем предустановленный стиль на основе выбранного aiModel
      styleBuffer = await getDefaultStyleImage(styleParams.aiModel);
    }
    
    // Сохраняем стилевое изображение
    fs.writeFileSync(styleImagePath, styleBuffer);
    
    // Запускаем Python-скрипт для применения стиля
    console.log("Запуск скрипта для применения стиля...");
    const result = await runStyleTransfer(contentImagePath, styleImagePath, outputImagePath);
    
    if (!result.success) {
      throw new Error(`Ошибка при применении стиля: ${result.error}`);
    }
    
    // Считываем результат и конвертируем в base64
    const outputBuffer = fs.readFileSync(outputImagePath);
    const outputBase64 = outputBuffer.toString('base64');
    
    // Очищаем временные файлы
    try {
      fs.unlinkSync(contentImagePath);
      fs.unlinkSync(styleImagePath);
      fs.unlinkSync(outputImagePath);
    } catch (e) {
      console.warn("Ошибка при удалении временных файлов:", e);
    }
    
    // Получаем MIME-тип из исходного изображения
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    return `data:${mime};base64,${outputBase64}`;
  } catch (error) {
    console.error("Ошибка при стилизации через Google Magenta:", error);
    throw error;
  }
}

/**
 * Запускает Python-скрипт для переноса стиля с использованием TensorFlow Hub
 */
async function runStyleTransfer(
  contentImagePath: string, 
  styleImagePath: string, 
  outputImagePath: string
): Promise<{ success: boolean, error?: string }> {
  
  return new Promise((resolve) => {
    // Определяем путь к Python скрипту для применения стиля
    const scriptPath = path.join(process.cwd(), 'server', 'python', 'magenta_styler.py');
    
    // Создаем директорию для скрипта, если она не существует
    const scriptDir = path.dirname(scriptPath);
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }
    
    // Создаем Python скрипт, если он не существует
    if (!fs.existsSync(scriptPath)) {
      createMagentaScript(scriptPath);
    }
    
    // Запускаем Python-процесс для применения стиля
    const pythonProcess = spawn('python', [
      scriptPath,
      contentImagePath,
      styleImagePath,
      outputImagePath
    ]);
    
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Выходные данные скрипта: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Ошибка скрипта: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Процесс завершился с кодом ${code}`);
        resolve({ success: false, error: errorOutput });
        return;
      }
      
      if (!fs.existsSync(outputImagePath)) {
        resolve({ 
          success: false, 
          error: 'Выходной файл не найден после обработки' 
        });
        return;
      }
      
      resolve({ success: true });
    });
  });
}

/**
 * Создает Python-скрипт для применения стиля с использованием TensorFlow Hub
 */
function createMagentaScript(scriptPath: string): void {
  const scriptContent = `
import os
import sys
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
from PIL import Image
import time

# Устанавливаем уровень логирования
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # 0=all, 1=I, 2=IW, 3=IWE

def load_image(image_path):
    """Загружает и предобрабатывает изображение для модели"""
    img = tf.io.read_file(image_path)
    img = tf.image.decode_image(img, channels=3)
    img = tf.image.convert_image_dtype(img, tf.float32)
    img = img[tf.newaxis, ...]
    return img

def save_image(image, output_path):
    """Сохраняет тензор как изображение"""
    image = tf.squeeze(image, axis=0)
    image = tf.clip_by_value(image, 0.0, 1.0)
    image = tf.image.convert_image_dtype(image, tf.uint8)
    
    image_data = tf.io.encode_jpeg(image)
    tf.io.write_file(output_path, image_data)

def main():
    if len(sys.argv) != 4:
        print("Использование: python magenta_styler.py content_image style_image output_image")
        sys.exit(1)
    
    content_image_path = sys.argv[1]
    style_image_path = sys.argv[2]
    output_image_path = sys.argv[3]
    
    print(f"Загрузка модели из TensorFlow Hub...")
    hub_module = hub.load('https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2')
    
    print(f"Обработка контентного изображения: {content_image_path}")
    content_image = load_image(content_image_path)
    
    print(f"Обработка стилевого изображения: {style_image_path}")
    # Стилевое изображение должно быть 256x256 для наилучших результатов
    style_image = Image.open(style_image_path)
    style_image = style_image.resize((256, 256), Image.LANCZOS)
    style_image_tensor = load_image(style_image_path)
    
    print("Применение стиля...")
    start_time = time.time()
    stylized_image = hub_module(tf.constant(content_image), tf.constant(style_image_tensor))[0]
    elapsed_time = time.time() - start_time
    print(f"Стилизация выполнена за {elapsed_time:.2f} секунд")
    
    print(f"Сохранение результата в: {output_image_path}")
    save_image(stylized_image, output_image_path)
    
    print("Готово!")

if __name__ == "__main__":
    main()
`;

  fs.writeFileSync(scriptPath, scriptContent);
  console.log(`Создан скрипт для стилизации: ${scriptPath}`);
}

/**
 * Получает изображение стиля по умолчанию на основе выбранного стиля
 * @param styleName Название стиля
 * @returns Buffer с изображением стиля
 */
async function getDefaultStyleImage(styleName: string): Promise<Buffer> {
  // Директория для хранения стандартных изображений стилей
  const styleDir = path.join(process.cwd(), 'server', 'styles');
  if (!fs.existsSync(styleDir)) {
    fs.mkdirSync(styleDir, { recursive: true });
  }
  
  // Маппинг стилей на файлы изображений (эти изображения нужно будет создать)
  const styleMap: Record<string, string> = {
    "Масляная живопись": "oil_painting.jpg",
    "Oil Painting": "oil_painting.jpg",
    "Акварель": "watercolor.jpg",
    "Watercolor": "watercolor.jpg",
    "Набросок карандашом": "pencil_sketch.jpg",
    "Pencil Sketch": "pencil_sketch.jpg",
    "Контурный рисунок": "line_drawing.jpg",
    "Line Drawing": "line_drawing.jpg",
    "Пиксель-арт": "pixel_art.jpg",
    "Pixel Art": "pixel_art.jpg",
    "Аниме": "anime.jpg",
    "Anime": "anime.jpg",
    "Комикс": "comic.jpg",
    "Comic": "comic.jpg",
    "Неон": "neon.jpg",
    "Neon": "neon.jpg",
    "Винтаж": "vintage.jpg",
    "Vintage": "vintage.jpg",
    "Нейронное искусство": "neural_art.jpg",
    "Neural Art": "neural_art.jpg",
    "Ван Гог": "van_gogh.jpg",
    "Van Gogh": "van_gogh.jpg"
  };
  
  // Получаем имя файла для выбранного стиля
  const styleFile = styleMap[styleName] || "neural_art.jpg";
  const stylePath = path.join(styleDir, styleFile);
  
  // Проверяем, существует ли файл, и если нет - создаем базовое изображение для стиля
  if (!fs.existsSync(stylePath)) {
    await createDefaultStyleImage(stylePath, styleName);
  }
  
  // Возвращаем буфер с изображением стиля
  return fs.readFileSync(stylePath);
}

/**
 * Создает изображение стиля по умолчанию, если оно не существует
 * Здесь можно было бы скачать изображения из интернета или использовать встроенные в приложение
 */
async function createDefaultStyleImage(stylePath: string, styleName: string): Promise<void> {
  // Для демонстрации просто создаем базовое изображение цветного градиента
  // В реальном приложении здесь будут предустановленные изображения стилей
  
  // В дальнейшем здесь можно добавить скачивание примеров стилей или встроить их в код
  
  // Для теста создаем пустое изображение 256x256
  const blankImagePath = path.join(TEMP_DIR, 'blank_style.jpg');
  const pythonScript = `
import numpy as np
from PIL import Image

# Создаем градиент в зависимости от стиля
style = """${styleName}"""

if "Масляная" in style or "Oil" in style:
    # Градиент для масляной живописи
    arr = np.zeros((256, 256, 3), dtype=np.uint8)
    for i in range(256):
        for j in range(256):
            arr[i, j, 0] = i  # Красный
            arr[i, j, 1] = j  # Зеленый
            arr[i, j, 2] = (i + j) // 2  # Синий
            
elif "Набросок" in style or "Pencil" in style:
    # Градиент для карандашного наброска
    arr = np.zeros((256, 256, 3), dtype=np.uint8)
    for i in range(256):
        for j in range(256):
            val = (i + j) // 2
            arr[i, j, 0] = val  # Красный
            arr[i, j, 1] = val  # Зеленый
            arr[i, j, 2] = val  # Синий
            
elif "Акварель" in style or "Water" in style:
    # Градиент для акварели
    arr = np.zeros((256, 256, 3), dtype=np.uint8)
    for i in range(256):
        for j in range(256):
            arr[i, j, 0] = 100  # Красный
            arr[i, j, 1] = i  # Зеленый
            arr[i, j, 2] = j  # Синий
            
elif "Пиксель" in style or "Pixel" in style:
    # Градиент для пиксель-арта
    arr = np.zeros((256, 256, 3), dtype=np.uint8)
    for i in range(0, 256, 8):
        for j in range(0, 256, 8):
            val = (i + j) % 256
            for di in range(8):
                for dj in range(8):
                    if i+di < 256 and j+dj < 256:
                        arr[i+di, j+dj, 0] = val
                        arr[i+di, j+dj, 1] = 128
                        arr[i+di, j+dj, 2] = 255 - val
                        
elif "Аниме" in style or "Anime" in style:
    # Градиент для аниме
    arr = np.zeros((256, 256, 3), dtype=np.uint8)
    for i in range(256):
        for j in range(256):
            arr[i, j, 0] = 255 - i  # Красный
            arr[i, j, 1] = j // 2  # Зеленый
            arr[i, j, 2] = i // 2  # Синий
            
elif "Ван Гог" in style or "Van Gogh" in style:
    # Градиент для стиля Ван Гога
    arr = np.zeros((256, 256, 3), dtype=np.uint8)
    for i in range(256):
        for j in range(256):
            arr[i, j, 0] = 255 - j // 2  # Красный
            arr[i, j, 1] = 200 - i // 4  # Зеленый
            arr[i, j, 2] = i // 3  # Синий
            
else:
    # Стандартный градиент для других стилей
    arr = np.zeros((256, 256, 3), dtype=np.uint8)
    for i in range(256):
        for j in range(256):
            arr[i, j, 0] = i  # Красный
            arr[i, j, 1] = 255 - i  # Зеленый
            arr[i, j, 2] = j  # Синий

# Сохраняем изображение
img = Image.fromarray(arr)
img.save('${blankImagePath}')
`;

  // Создаем временный Python-скрипт для генерации тестового изображения
  const tempScriptPath = path.join(TEMP_DIR, 'create_style.py');
  fs.writeFileSync(tempScriptPath, pythonScript);
  
  // Выполняем скрипт для создания тестового изображения
  await new Promise<void>((resolve, reject) => {
    const pythonProcess = spawn('python', [tempScriptPath]);
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Ошибка при создании тестового изображения: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        // Копируем созданное изображение в целевую директорию
        try {
          fs.copyFileSync(blankImagePath, stylePath);
          // Удаляем временные файлы
          fs.unlinkSync(tempScriptPath);
          fs.unlinkSync(blankImagePath);
          resolve();
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`Процесс завершился с кодом ${code}`));
      }
    });
  });
}

/**
 * Получает список доступных AI стилей с описаниями
 * @returns Список AI стилей
 */
export function getAvailableAiStyles(): AiStyle[] {
  return [
    {
      id: 1,
      name: "Масляная живопись",
      description: "Преобразуйте изображение в стиле масляной живописи с выразительными мазками и насыщенными цветами",
      previewUrl: null,
      apiParams: {
        aiModel: "Масляная живопись",
        styleIntensity: 1.0,
        transformType: "magenta",
        styleReference: "Преобразуйте изображение в стиле масляной живописи с выразительными мазками и насыщенными цветами"
      }
    },
    {
      id: 2,
      name: "Акварель",
      description: "Преобразуйте изображение в нежный акварельный стиль с прозрачными красками и мягкими переходами",
      previewUrl: null,
      apiParams: {
        aiModel: "Акварель",
        styleIntensity: 1.0,
        transformType: "magenta",
        styleReference: "Преобразуйте изображение в нежный акварельный стиль с прозрачными красками и мягкими переходами"
      }
    },
    {
      id: 3,
      name: "Набросок карандашом",
      description: "Преобразуйте изображение в детализированный карандашный набросок с тонкими линиями и тенями",
      previewUrl: null,
      apiParams: {
        aiModel: "Набросок карандашом",
        styleIntensity: 1.0,
        transformType: "magenta",
        styleReference: "Преобразуйте изображение в детализированный карандашный набросок с тонкими линиями и тенями"
      }
    },
    {
      id: 4,
      name: "Пиксель-арт",
      description: "Преобразуйте изображение в стиль пиксельной графики с ограниченной цветовой палитрой",
      previewUrl: null,
      apiParams: {
        aiModel: "Пиксель-арт",
        styleIntensity: 1.0,
        transformType: "magenta",
        styleReference: "Преобразуйте изображение в стиль пиксельной графики с ограниченной цветовой палитрой"
      }
    },
    {
      id: 5,
      name: "Аниме",
      description: "Преобразуйте изображение в аниме-стиль с характерными чертами японской анимации",
      previewUrl: null,
      apiParams: {
        aiModel: "Аниме",
        styleIntensity: 1.0,
        transformType: "magenta",
        styleReference: "Преобразуйте изображение в аниме-стиль с характерными чертами японской анимации"
      }
    },
    {
      id: 6,
      name: "Ван Гог",
      description: "Преобразуйте изображение в стиле художника Винсента Ван Гога с характерными завихрениями и яркими цветами",
      previewUrl: null,
      apiParams: {
        aiModel: "Ван Гог",
        styleIntensity: 1.0,
        transformType: "magenta",
        styleReference: "Преобразуйте изображение в стиле художника Винсента Ван Гога с характерными завихрениями и яркими цветами"
      }
    }
  ];
}