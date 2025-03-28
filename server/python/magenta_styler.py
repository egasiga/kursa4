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
    # Проверяем аргументы командной строки
    if len(sys.argv) < 4:
        print("Использование: python magenta_styler.py content_image style_image output_image [style_intensity]")
        sys.exit(1)
    
    content_image_path = sys.argv[1]
    style_image_path = sys.argv[2]
    output_image_path = sys.argv[3]
    
    # Получаем параметр интенсивности стиля, если он предоставлен
    # По умолчанию 0.4 (40% оригинала, 60% стиля)
    style_intensity = 0.4
    if len(sys.argv) >= 5:
        try:
            intensity_param = float(sys.argv[4])
            # Преобразуем параметр интенсивности из UI (0.0-2.0) в параметр смешивания (0.6-0.1)
            # Чем выше значение из UI, тем меньше должно быть значение blend_factor
            # для получения более сильного эффекта
            style_intensity = max(0.1, min(0.7, 0.7 - (intensity_param / 5.0)))
            print(f"Установлена интенсивность стиля: {intensity_param} (blend_factor: {style_intensity})")
        except ValueError:
            print(f"Ошибка при парсинге параметра интенсивности: {sys.argv[4]}. Используем значение по умолчанию.")
    
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
    
    # Вычисляем стилизованное изображение
    outputs = hub_module(tf.constant(content_image), tf.constant(style_image))
    stylized_image = outputs[0]
    
    # Проверяем и корректируем размеры изображений перед смешиванием
    content_shape = tf.shape(content_image)
    stylized_shape = tf.shape(stylized_image)
    
    print(f"Размер контентного изображения: {content_shape}")
    print(f"Размер стилизованного изображения: {stylized_shape}")
    
    # Изменяем размер стилизованного изображения, чтобы он совпадал с оригиналом
    if not tf.reduce_all(tf.equal(content_shape, stylized_shape)):
        print("Изменение размера стилизованного изображения для соответствия оригиналу")
        stylized_image = tf.image.resize(
            stylized_image,
            [content_shape[1], content_shape[2]],
            method=tf.image.ResizeMethod.LANCZOS3
        )
        print(f"Новый размер стилизованного изображения: {tf.shape(stylized_image)}")
    
    # Используем рассчитанное ранее значение интенсивности стиля для смешивания
    # style_intensity - это сколько оригинала сохраняем (0.1 - мало, 0.7 - много)
    blend_factor = style_intensity
    
    # Линейная интерполяция между оригинальным и стилизованным изображением
    # content_image * blend_factor + stylized_image * (1 - blend_factor)
    blended_image = blend_factor * content_image + (1 - blend_factor) * stylized_image
    
    elapsed_time = time.time() - start_time
    print(f"Стилизация выполнена за {elapsed_time:.2f} секунд")
    
    save_image(blended_image, output_image_path)
    
    # Очистка временных файлов
    try:
        os.remove(style_image_path + ".resized.jpg")
    except:
        pass
    
    print("Готово!")

if __name__ == "__main__":
    main()