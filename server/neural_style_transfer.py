"""
Реализация Neural Style Transfer с использованием TensorFlow и предобученной модели VGG19
"""

import os
import sys
import time
import numpy as np
from PIL import Image
import tensorflow as tf

# Создаем директории для временного хранения изображений
os.makedirs('./temp', exist_ok=True)
os.makedirs('./styles', exist_ok=True)

# Эти константы используются для нормализации изображений
MEAN_VALUES = np.array([123.68, 116.779, 103.939]).reshape((1, 1, 1, 3))

# Веса для функции потерь
STYLE_WEIGHT = 1.0
CONTENT_WEIGHT = 0.025
TOTAL_VARIATION_WEIGHT = 1.0

# Количество итераций оптимизации
NUM_ITERATIONS = 10

def load_img(img_path):
    """Загружает изображение с помощью PIL и преобразует его в формат TensorFlow"""
    print(f"Loading image from {img_path}")
    try:
        img = Image.open(img_path)
        
        # Изменяем размер изображения, сохраняя пропорции
        target_size = (224, 224)
        if img.size[0] > img.size[1]:
            ratio = float(target_size[0]) / img.size[0]
            new_height = int(img.size[1] * ratio)
            img = img.resize((target_size[0], new_height), Image.LANCZOS)
        else:
            ratio = float(target_size[1]) / img.size[1]
            new_width = int(img.size[0] * ratio)
            img = img.resize((new_width, target_size[1]), Image.LANCZOS)
        
        # Преобразуем в массив numpy
        img_array = np.array(img)
        
        # Проверяем и корректируем каналы (должно быть RGB)
        if len(img_array.shape) == 2:
            # Черно-белое изображение - преобразуем в RGB
            img_array = np.stack([img_array, img_array, img_array], axis=-1)
        elif img_array.shape[2] == 4:
            # Изображение с альфа-каналом - убираем альфа
            img_array = img_array[:, :, :3]
        
        # Приводим формат к [batch, height, width, channels]
        img_array = np.expand_dims(img_array, axis=0)
        
        # Предобработка для VGG19 (RGB -> BGR и вычитание средних значений)
        img_array = img_array[:, :, :, ::-1] - MEAN_VALUES
        
        return img_array, img.size
    except Exception as e:
        print(f"Error loading image: {e}")
        return None, None

def save_image(img_array, original_size, path):
    """Сохраняет результат обработки как изображение"""
    try:
        # Из формата TensorFlow обратно в PIL
        img_array = img_array + MEAN_VALUES
        img_array = img_array[:, :, :, ::-1]  # BGR -> RGB
        img_array = np.clip(img_array[0], 0, 255).astype(np.uint8)
        
        # Создаем изображение и изменяем его размер до оригинального
        img = Image.fromarray(img_array)
        img = img.resize(original_size, Image.LANCZOS)
        
        # Сохраняем с высоким качеством
        img.save(path, format='JPEG', quality=95, optimize=True)
        print(f"Image saved to {path}")
        return True
    except Exception as e:
        print(f"Error saving image: {e}")
        return False

def gram_matrix(feature_maps):
    """Вычисляет матрицу Грама для представления стиля"""
    # Получаем размеры карт признаков
    _, height, width, channels = feature_maps.shape
    
    # Reshape feature maps
    features = tf.reshape(feature_maps, (height * width, channels))
    
    # Вычисляем матрицу Грама (корреляция между признаками)
    gram = tf.matmul(tf.transpose(features), features)
    
    # Нормализуем матрицу Грама
    return gram / tf.cast(height * width * channels, tf.float32)

def style_content_loss(content_features, style_features, generated_features):
    """Вычисляет функцию потерь для стиля и содержания"""
    # Потеря содержания - MSE между признаками контента и сгенерированными
    content_layer = 'block4_conv2'
    content_loss = tf.reduce_mean(
        tf.square(generated_features[content_layer] - content_features[content_layer])
    )
    
    # Потеря стиля - сумма MSE между матрицами Грама стиля и сгенерированного изображения
    style_layers = [
        'block1_conv1',
        'block2_conv1',
        'block3_conv1',
        'block4_conv1',
        'block5_conv1'
    ]
    
    style_loss = 0
    num_style_layers = len(style_layers)
    
    for layer in style_layers:
        # Вычисляем матрицы Грама для стиля и генерируемого изображения
        style_gram = gram_matrix(style_features[layer])
        generated_gram = gram_matrix(generated_features[layer])
        
        # Вычисляем MSE между матрицами Грама
        layer_style_loss = tf.reduce_mean(tf.square(style_gram - generated_gram))
        
        # Добавляем к общей потере стиля с нормализацией
        style_loss += layer_style_loss / num_style_layers
    
    # Вычисляем общую потерю как взвешенную сумму потерь стиля и содержания
    total_loss = CONTENT_WEIGHT * content_loss + STYLE_WEIGHT * style_loss
    
    return total_loss, content_loss, style_loss

def total_variation_loss(image):
    """Вычисляет потерю полной вариации для сглаживания изображения"""
    # Вычисляем разности соседних пикселей
    x_var = tf.reduce_sum(tf.square(image[:, 1:, :, :] - image[:, :-1, :, :]))
    y_var = tf.reduce_sum(tf.square(image[:, :, 1:, :] - image[:, :, :-1, :]))
    
    return (x_var + y_var)

def extract_features(model, images):
    """Извлекает признаки изображения из слоев модели VGG19"""
    # Выбираем слои для извлечения признаков
    layers = [
        'block1_conv1',
        'block2_conv1',
        'block3_conv1',
        'block4_conv1',
        'block4_conv2',
        'block5_conv1'
    ]
    
    features = {}
    
    # Проходим по всем слоям и извлекаем признаки
    for layer in layers:
        features[layer] = model.get_layer(layer).output
    
    # Создаем модель для извлечения признаков
    feature_model = tf.keras.Model(inputs=model.input, outputs=features)
    
    # Используем модель для извлечения признаков из изображений
    return feature_model(images)

def apply_neural_style_transfer(content_img_path, style_img_path, output_path):
    """Применяет перенос стиля к изображению и сохраняет результат"""
    print(f"Starting neural style transfer...")
    print(f"Content image: {content_img_path}")
    print(f"Style image: {style_img_path}")
    print(f"Output path: {output_path}")
    
    try:
        # Загружаем изображения
        content_image, content_size = load_img(content_img_path)
        style_image, _ = load_img(style_img_path)
        
        if content_image is None or style_image is None:
            raise Exception("Failed to load images")
        
        # Загружаем предобученную модель VGG19
        print("Loading VGG19 model...")
        vgg = tf.keras.applications.VGG19(include_top=False, weights='imagenet')
        vgg.trainable = False
        
        # Извлекаем признаки из изображений контента и стиля
        print("Extracting features...")
        content_features = extract_features(vgg, content_image)
        style_features = extract_features(vgg, style_image)
        
        # Создаем переменную для генерируемого изображения и инициализируем ее содержанием
        generated_image = tf.Variable(content_image)
        
        # Создаем оптимизатор
        optimizer = tf.optimizers.Adam(learning_rate=0.01)
        
        # Выполняем оптимизацию
        print(f"Starting optimization ({NUM_ITERATIONS} iterations)...")
        for i in range(NUM_ITERATIONS):
            with tf.GradientTape() as tape:
                # Извлекаем признаки из генерируемого изображения
                generated_features = extract_features(vgg, generated_image)
                
                # Вычисляем потери
                loss, content_loss, style_loss = style_content_loss(
                    content_features, style_features, generated_features
                )
                
                # Добавляем потерю вариации
                tv_loss = TOTAL_VARIATION_WEIGHT * total_variation_loss(generated_image)
                total_loss = loss + tv_loss
            
            # Вычисляем градиенты
            gradients = tape.gradient(total_loss, generated_image)
            
            # Применяем градиенты для обновления генерируемого изображения
            optimizer.apply_gradients([(gradients, generated_image)])
            
            # Выводим прогресс
            if (i + 1) % 5 == 0 or i == 0:
                print(f"Iteration {i+1}/{NUM_ITERATIONS}, "
                      f"Loss: {total_loss.numpy():.2f}, "
                      f"Content Loss: {content_loss.numpy():.2f}, "
                      f"Style Loss: {style_loss.numpy():.2f}, "
                      f"TV Loss: {tv_loss.numpy():.2f}")
        
        # Конвертируем финальное изображение обратно в PIL и сохраняем
        generated_array = generated_image.numpy()
        success = save_image(generated_array, content_size, output_path)
        
        if success:
            print("Neural style transfer completed successfully!")
            return True
        else:
            print("Failed to save the output image.")
            return False
    
    except Exception as e:
        print(f"Error during neural style transfer: {str(e)}")
        return False

if __name__ == "__main__":
    # Проверяем, переданы ли все необходимые аргументы
    if len(sys.argv) != 4:
        print("Usage: python neural_style_transfer.py <content_image_path> <style_image_path> <output_path>")
        sys.exit(1)
    
    content_path = sys.argv[1]
    style_path = sys.argv[2]
    output_path = sys.argv[3]
    
    start_time = time.time()
    success = apply_neural_style_transfer(content_path, style_path, output_path)
    end_time = time.time()
    
    print(f"Processing time: {end_time - start_time:.2f} seconds")
    
    if success:
        print("Style transfer completed successfully!")
        sys.exit(0)
    else:
        print("Style transfer failed!")
        sys.exit(1)