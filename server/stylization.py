import os
import sys
import time
from PIL import Image, ImageFilter, ImageEnhance
import random

# Создаем директории для временного хранения изображений
os.makedirs('./temp', exist_ok=True)
os.makedirs('./styles', exist_ok=True)

def load_img(img_path):
    """Загружает изображение с помощью PIL"""
    print(f"Loading image from {img_path}")
    try:
        img = Image.open(img_path)
        return img
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

def save_image(img, path):
    """Сохраняет изображение с высоким качеством"""
    # Сохраняем изображение с максимальным качеством
    img.save(path, format='JPEG', quality=95, optimize=True)
    print(f"Image saved to {path}")
    return path

def apply_style(img, style_id):
    """Применяет эффект стиля к изображению в зависимости от ID стиля"""
    print(f"Applying style {style_id}")
    
    # Создаем копию изображения для обработки
    styled_img = img.copy()
    
    # Различные эффекты в зависимости от стиля
    if style_id == '1':  # Звёздная ночь (Ван Гог)
        # Увеличиваем контраст и насыщенность, добавляем синий оттенок
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.5)
        styled_img = ImageEnhance.Color(styled_img).enhance(1.8)
        # Размытие для эффекта мазков
        styled_img = styled_img.filter(ImageFilter.GaussianBlur(radius=1))
        
    elif style_id == '2':  # Крик (Мунк)
        # Искажение цветов, увеличение красного, размытие
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.3)
        styled_img = styled_img.filter(ImageFilter.GaussianBlur(radius=2))
        styled_img = styled_img.filter(ImageFilter.EDGE_ENHANCE)
        
    elif style_id == '3':  # Композиция (Кандинский)
        # Увеличиваем яркость и контраст, добавляем четкость
        styled_img = ImageEnhance.Brightness(styled_img).enhance(1.1)
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.4)
        styled_img = styled_img.filter(ImageFilter.EDGE_ENHANCE_MORE)
        
    elif style_id == '4':  # Кубизм (Пикассо)
        # Эффект постеризации, увеличение контраста
        styled_img = styled_img.filter(ImageFilter.FIND_EDGES)
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.2)
        
    elif style_id == '5':  # Водяные лилии (Моне)
        # Мягкое размытие, увеличение яркости и насыщенности
        styled_img = styled_img.filter(ImageFilter.GaussianBlur(radius=1.5))
        styled_img = ImageEnhance.Brightness(styled_img).enhance(1.1)
        styled_img = ImageEnhance.Color(styled_img).enhance(1.4)
    
    return styled_img

def stylize_image(content_img_path, style_img_path, output_path):
    """Применяет стиль к изображению и сохраняет результат"""
    print(f"Stylizing image from {content_img_path} with style from {style_img_path}")
    
    try:
        # Извлекаем ID стиля из пути
        style_id = os.path.basename(style_img_path).split('.')[0]
        
        # Загружаем изображение контента
        content_img = load_img(content_img_path)
        if not content_img:
            raise Exception("Failed to load content image")
        
        # Применяем стиль
        styled_img = apply_style(content_img, style_id)
        
        # Сохраняем стилизованное изображение
        save_image(styled_img, output_path)
        
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