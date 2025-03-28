#!/usr/bin/env python

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
    print(f"Загрузка изображения: {image_path}")
    img = Image.open(image_path)
    # Преобразуем в RGB если это необходимо
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Преобразуем в тензор
    img = np.array(img, dtype=np.float32) / 255.0
    img = img[tf.newaxis, ...]
    return img

def save_image(image, output_path):
    """Сохраняет тензор как изображение"""
    print(f"Сохранение результата в: {output_path}")
    image = tf.squeeze(image, axis=0)
    image = tf.clip_by_value(image, 0.0, 1.0)
    image = tf.image.convert_image_dtype(image, tf.uint8)
    
    # Преобразуем тензор в PIL Image и сохраняем
    image_array = image.numpy()
    image_pil = Image.fromarray(image_array)
    image_pil.save(output_path)

def main():
    if len(sys.argv) != 4:
        print("Использование: python magenta_styler.py content_image style_image output_image")
        sys.exit(1)
    
    content_image_path = sys.argv[1]
    style_image_path = sys.argv[2]
    output_image_path = sys.argv[3]
    
    print(f"Загрузка модели из TensorFlow Hub...")
    start_time = time.time()
    hub_module = hub.load('https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2')
    print(f"Модель загружена за {time.time() - start_time:.2f} секунд")
    
    print(f"Обработка контентного изображения: {content_image_path}")
    content_image = load_image(content_image_path)
    
    print(f"Обработка стилевого изображения: {style_image_path}")
    # Стилевое изображение должно быть 256x256 для наилучших результатов
    style_img = Image.open(style_image_path)
    if style_img.mode != 'RGB':
        style_img = style_img.convert('RGB')
    style_img = style_img.resize((256, 256), Image.LANCZOS)
    style_img.save(style_image_path + ".resized.jpg")
    
    # Загружаем стилевое изображение в правильном формате
    style_image = np.array(style_img, dtype=np.float32) / 255.0
    style_image = style_image[tf.newaxis, ...]
    
    print("Применение стиля...")
    start_time = time.time()
    outputs = hub_module(tf.constant(content_image), tf.constant(style_image))
    stylized_image = outputs[0]
    elapsed_time = time.time() - start_time
    print(f"Стилизация выполнена за {elapsed_time:.2f} секунд")
    
    save_image(stylized_image, output_image_path)
    
    # Очистка временных файлов
    try:
        os.remove(style_image_path + ".resized.jpg")
    except:
        pass
    
    print("Готово!")

if __name__ == "__main__":
    main()