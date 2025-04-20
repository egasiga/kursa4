import os
import sys
import time
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
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
    
    # Различные эффекты в зависимости от стиля - ЭКСТРЕМАЛЬНЫЕ ЭФФЕКТЫ В СТИЛЕ GOOGLE MAGENTA
    if style_id == '1':  # Звёздная ночь (Ван Гог)
        print("Применяю стиль 'Звёздная ночь (Ван Гог)'")
        
        # Шаг 1: Насыщенные цвета и контраст как у Ван Гога
        styled_img = ImageEnhance.Contrast(styled_img).enhance(3.5)
        styled_img = ImageEnhance.Color(styled_img).enhance(3.8)
        
        # Шаг 2: Имитация мазков кистью через размытие и шум
        styled_img = styled_img.filter(ImageFilter.GaussianBlur(radius=2))
        
        # Шаг 3: Выделение краев для создания "контуров" как на картине
        styled_img = styled_img.filter(ImageFilter.EDGE_ENHANCE_MORE)
        styled_img = styled_img.filter(ImageFilter.EDGE_ENHANCE_MORE)
        
        # Шаг 4: Инверсия цветовых каналов для создания характерного "звездного" неба
        r, g, b = styled_img.split()
        styled_img = Image.merge("RGB", (b, g, r))
        
        # Шаг 5: Добавление "завихрений" через изменение цветового баланса
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.3)
        
        # Шаг 6: Пост-обработка для создания более драматичного вида
        styled_img = ImageOps.posterize(styled_img, 5)
        
    elif style_id == '2':  # Крик (Мунк)
        print("Применяю стиль 'Крик (Мунк)'")
        
        # Шаг 1: Искажение цветов для драматического эффекта
        styled_img = ImageEnhance.Contrast(styled_img).enhance(3.2)
        
        # Шаг 2: Размытие для создания "плывущего" эффекта
        styled_img = styled_img.filter(ImageFilter.GaussianBlur(radius=4))
        
        # Шаг 3: Создание контуров и искаженных линий
        styled_img = styled_img.filter(ImageFilter.FIND_EDGES)
        styled_img = ImageEnhance.Brightness(styled_img).enhance(1.5)
        
        # Шаг 4: Изменение цветового баланса для создания тревожного настроения
        r, g, b = styled_img.split()
        styled_img = Image.merge("RGB", (r, b, g))
        
        # Шаг 5: Постеризация для создания упрощенных форм
        styled_img = ImageOps.posterize(styled_img, 3)
        
        # Шаг 6: Инверсия части изображения для драматического эффекта
        styled_img = ImageOps.solarize(styled_img, threshold=128)
        
    elif style_id == '3':  # Композиция (Кандинский)
        print("Применяю стиль 'Композиция (Кандинский)'")
        
        # Шаг 1: Увеличение яркости и контрастности для "живых" цветов
        styled_img = ImageEnhance.Brightness(styled_img).enhance(2.3)
        styled_img = ImageEnhance.Contrast(styled_img).enhance(3.5)
        
        # Шаг 2: Создание абстрактных форм через выделение краев
        styled_img = styled_img.filter(ImageFilter.FIND_EDGES)
        
        # Шаг 3: Добавление цвета обратно в контуры
        styled_img = ImageEnhance.Color(styled_img).enhance(4.0)
        
        # Шаг 4: Эффект геометрических форм через постеризацию
        styled_img = ImageOps.posterize(styled_img, 4)
        
        # Шаг 5: Смешение цветовых каналов для создания абстрактного эффекта
        r, g, b = styled_img.split()
        styled_img = Image.merge("RGB", (b, g, r))
        
        # Шаг 6: Инверсия части изображения для контраста
        styled_img = ImageOps.invert(styled_img)
        
    elif style_id == '4':  # Кубизм (Пикассо)
        print("Применяю стиль 'Кубизм (Пикассо)'") 
        
        # Шаг 1: Создание резких граней между областями
        styled_img = styled_img.filter(ImageFilter.FIND_EDGES)
        styled_img = ImageEnhance.Contrast(styled_img).enhance(3.8)
        
        # Шаг 2: Уменьшение цветовой палитры для кубистического эффекта
        styled_img = ImageOps.posterize(styled_img, 3)
        
        # Шаг 3: Смещение цветовых каналов для создания "разобранного" вида
        r, g, b = styled_img.split()
        styled_img = Image.merge("RGB", (g, r, b))
        
        # Шаг 4: Подчеркивание контуров для геометрических форм
        styled_img = styled_img.filter(ImageFilter.CONTOUR)
        styled_img = styled_img.filter(ImageFilter.EDGE_ENHANCE_MORE)
        
        # Шаг 5: Инверсия части изображения для создания раздробленного вида
        styled_img = ImageOps.solarize(styled_img, threshold=64)
        
        # Шаг 6: Финальная пост-обработка для усиления эффекта
        styled_img = ImageEnhance.Sharpness(styled_img).enhance(2.0)
        
    elif style_id == '5':  # Водяные лилии (Моне)
        print("Применяю стиль 'Водяные лилии (Моне)'")
        
        # Шаг 1: Мягкое размытие для имитации импрессионизма
        styled_img = styled_img.filter(ImageFilter.GaussianBlur(radius=4.0))
        
        # Шаг 2: Насыщение цветов как у Моне
        styled_img = ImageEnhance.Color(styled_img).enhance(3.5)
        styled_img = ImageEnhance.Brightness(styled_img).enhance(1.8)
        
        # Шаг 3: Смешение цветовых каналов для создания эффекта отражений на воде
        r, g, b = styled_img.split()
        styled_img = Image.merge("RGB", (g, b, r))
        
        # Шаг 4: Мягкая постеризация для создания "пятен" краски
        styled_img = ImageOps.posterize(styled_img, 6)
        
        # Шаг 5: Размытие краев для создания "плавающего" эффекта
        styled_img = styled_img.filter(ImageFilter.SMOOTH_MORE)
        styled_img = styled_img.filter(ImageFilter.SMOOTH_MORE)
        
        # Шаг 6: Увеличение яркости светлых участков для эффекта солнечного света
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.3)
    
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