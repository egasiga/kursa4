import os
import sys
import time
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
from PIL import Image
import io

# Создаем директории для временного хранения изображений
os.makedirs('./temp', exist_ok=True)
os.makedirs('./public/styles', exist_ok=True)

def load_img(img_path):
    """Загружает и преобразует изображение в тензор"""
    img = tf.io.read_file(img_path)
    img = tf.image.decode_image(img, channels=3)
    img = tf.image.convert_image_dtype(img, tf.float32)
    
    # Ограничение размера изображения для ускорения обработки
    max_dim = 512
    shape = tf.cast(tf.shape(img)[:-1], tf.float32)
    long_dim = max(shape)
    scale = max_dim / long_dim
    
    new_shape = tf.cast(shape * scale, tf.int32)
    img = tf.image.resize(img, new_shape)
    img = img[tf.newaxis, :]
    return img

def save_image_from_tensor(tensor, path):
    """Сохраняет тензор как изображение"""
    tensor = tensor[0]  # Убираем размерность пакета
    tensor = tf.clip_by_value(tensor, 0.0, 1.0)
    tensor = tf.image.convert_image_dtype(tensor, tf.uint8)
    img_array = tensor.numpy()
    img = Image.fromarray(img_array)
    img.save(path)
    return path

def stylize_image(content_img_path, style_img_path, output_path):
    """Применяет стиль к изображению и сохраняет результат"""
    print(f"Loading content image from {content_img_path}")
    print(f"Loading style image from {style_img_path}")
    
    try:
        # Загружаем модель для стилизации изображений из TensorFlow Hub
        print("Loading TensorFlow Hub model...")
        model = hub.load('https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2')
        
        # Загружаем изображения
        content_img = load_img(content_img_path)
        style_img = load_img(style_img_path)
        
        print("Applying style transfer...")
        # Применяем стилизацию
        stylized_image = model(tf.constant(content_img), tf.constant(style_img))[0]
        
        # Сохраняем стилизованное изображение
        save_image_from_tensor(stylized_image, output_path)
        print(f"Stylized image saved to {output_path}")
        
        return True
    except Exception as e:
        print(f"Error during style transfer: {str(e)}")
        return False

if __name__ == "__main__":
    # Проверяем, переданы ли все необходимые аргументы
    if len(sys.argv) != 4:
        print("Usage: python stylization.py <content_image_path> <style_image_path> <output_path>")
        sys.exit(1)
    
    content_path = sys.argv[1]
    style_path = sys.argv[2]
    output_path = sys.argv[3]
    
    success = stylize_image(content_path, style_path, output_path)
    
    if success:
        print("Style transfer completed successfully!")
        sys.exit(0)
    else:
        print("Style transfer failed!")
        sys.exit(1)