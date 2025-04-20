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
    
    # Улучшенные художественные эффекты (в стиле Google Magenta)
    if style_id == '1':  # Звёздная ночь (Ван Гог)
        print("Применяю стиль 'Звёздная ночь (Ван Гог)'")
        
        # Сохраняем копию оригинального изображения для смешивания
        original_copy = styled_img.copy()
        
        # Шаг 1: Насыщение и контраст (более умеренные значения)
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.8)
        styled_img = ImageEnhance.Color(styled_img).enhance(1.7)
        
        # Шаг 2: Небольшое размытие для мазков кисти
        styled_img = styled_img.filter(ImageFilter.GaussianBlur(radius=1.5))
        
        # Шаг 3: Выделение краев (один раз, чтобы не пересушить изображение)
        styled_img = styled_img.filter(ImageFilter.EDGE_ENHANCE)
        
        # Шаг 4: Мягкое смещение цветовых каналов для звездного эффекта
        r, g, b = styled_img.split()
        shifted_img = Image.merge("RGB", (g, b, r))
        
        # Шаг 5: Смешиваем с оригиналом для сохранения деталей
        # Создаем новое изображение из оригинала и стилизованного
        r1, g1, b1 = original_copy.split()
        r2, g2, b2 = shifted_img.split()
        
        # Смешиваем каналы (70% оригинал + 30% стилизация)
        r = Image.blend(r1, r2, 0.5)
        g = Image.blend(g1, g2, 0.5)
        b = Image.blend(b1, b2, 0.5)
        
        styled_img = Image.merge("RGB", (r, g, b))
        
        # Шаг 6: Финальное усиление контраста для более яркого эффекта
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.4)
        
    elif style_id == '2':  # Крик (Мунк)
        print("Применяю стиль 'Крик (Мунк)'")
        
        # Сохраняем копию оригинала
        original_copy = styled_img.copy()
        
        # Шаг 1: Умеренное увеличение контраста
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.6)
        
        # Шаг 2: Легкое размытие
        styled_img = styled_img.filter(ImageFilter.GaussianBlur(radius=2))
        
        # Шаг 3: Выделение краев
        edges = styled_img.filter(ImageFilter.FIND_EDGES)
        edges = ImageEnhance.Brightness(edges).enhance(1.2)
        
        # Шаг 4: Инверсия цветов для тревожного эффекта, но сохраняя оригинальные цвета
        r, g, b = styled_img.split()
        inverted = Image.merge("RGB", (g, r, b))
        
        # Смешиваем, сохраняя большую часть оригинала
        r1, g1, b1 = original_copy.split()
        r2, g2, b2 = inverted.split()
        r = Image.blend(r1, r2, 0.6)
        g = Image.blend(g1, g2, 0.6)
        b = Image.blend(b1, b2, 0.6)
        
        styled_img = Image.merge("RGB", (r, g, b))
        
        # Шаг 5: Добавляем контуры из шага 3, но сохраняем прозрачность
        r1, g1, b1 = styled_img.split()
        r2, g2, b2 = edges.split()
        r = Image.blend(r1, r2, 0.3)
        g = Image.blend(g1, g2, 0.3)
        b = Image.blend(b1, b2, 0.3)
        
        styled_img = Image.merge("RGB", (r, g, b))
        
        # Шаг 6: Финальное улучшение контраста
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.3)
        
    elif style_id == '3':  # Композиция (Кандинский)
        print("Применяю стиль 'Композиция (Кандинский)'")
        
        # Сохраняем оригинал
        original_copy = styled_img.copy()
        
        # Шаг 1: Усиление яркости и контраста для живых цветов
        styled_img = ImageEnhance.Brightness(styled_img).enhance(1.4)
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.7)
        styled_img = ImageEnhance.Color(styled_img).enhance(1.8)
        
        # Шаг 2: Выделение краев для геометрических форм
        edges = styled_img.filter(ImageFilter.CONTOUR)
        edges = ImageEnhance.Contrast(edges).enhance(1.5)
        
        # Шаг 3: Создаем постеризованное изображение для цветовых блоков
        posterized = ImageOps.posterize(styled_img, 5)
        
        # Шаг 4: Смешиваем оригинал, постеризованный вариант и края
        r1, g1, b1 = original_copy.split()
        r2, g2, b2 = posterized.split()
        r3, g3, b3 = edges.split()
        
        # Смешиваем в пропорции 40% оригинал + 40% постеризация + 20% края
        r = Image.blend(Image.blend(r1, r2, 0.5), r3, 0.3)
        g = Image.blend(Image.blend(g1, g2, 0.5), g3, 0.3)
        b = Image.blend(Image.blend(b1, b2, 0.5), b3, 0.3)
        
        styled_img = Image.merge("RGB", (r, g, b))
        
        # Шаг 5: Финальное улучшение насыщенности цветов
        styled_img = ImageEnhance.Color(styled_img).enhance(1.4)
        
    elif style_id == '4':  # Кубизм (Пикассо)
        print("Применяю стиль 'Кубизм (Пикассо)'") 
        
        # Сохраняем оригинал
        original_copy = styled_img.copy()
        
        # Шаг 1: Выделение краев
        edges = styled_img.filter(ImageFilter.FIND_EDGES)
        edges = ImageEnhance.Contrast(edges).enhance(1.8)
        
        # Шаг 2: Создаем постеризованную версию для упрощенных форм
        posterized = ImageOps.posterize(styled_img, 4)
        
        # Шаг 3: Создаем контурную версию
        contours = styled_img.filter(ImageFilter.CONTOUR)
        
        # Шаг 4: Смешиваем все эффекты
        r1, g1, b1 = original_copy.split()
        r2, g2, b2 = edges.split()
        r3, g3, b3 = posterized.split()
        r4, g4, b4 = contours.split()
        
        # Смешиваем в пропорции 30% оригинал + 30% края + 20% постеризация + 20% контуры
        r = Image.blend(Image.blend(r1, r2, 0.5), Image.blend(r3, r4, 0.5), 0.5)
        g = Image.blend(Image.blend(g1, g2, 0.5), Image.blend(g3, g4, 0.5), 0.5)
        b = Image.blend(Image.blend(b1, b2, 0.5), Image.blend(b3, b4, 0.5), 0.5)
        
        styled_img = Image.merge("RGB", (r, g, b))
        
        # Шаг 5: Финальный контраст
        styled_img = ImageEnhance.Contrast(styled_img).enhance(1.4)
        
    elif style_id == '5':  # Водяные лилии (Моне)
        print("Применяю стиль 'Водяные лилии (Моне)'")
        
        # Сохраняем оригинал
        original_copy = styled_img.copy()
        
        # Шаг 1: Легкое размытие для импрессионизма
        blurred = styled_img.filter(ImageFilter.GaussianBlur(radius=2.0))
        
        # Шаг 2: Усиление цветов
        colored = ImageEnhance.Color(styled_img).enhance(1.6)
        colored = ImageEnhance.Brightness(colored).enhance(1.2)
        
        # Шаг 3: Смешиваем размытое и цветное изображения
        r1, g1, b1 = blurred.split()
        r2, g2, b2 = colored.split()
        
        r = Image.blend(r1, r2, 0.6)
        g = Image.blend(g1, g2, 0.6)
        b = Image.blend(b1, b2, 0.6)
        
        styled_img = Image.merge("RGB", (r, g, b))
        
        # Шаг 4: Легкий эффект постеризации для "мазков"
        posterized = ImageOps.posterize(styled_img, 7)
        
        # Шаг 5: Смешиваем с оригиналом для сохранения деталей
        r1, g1, b1 = original_copy.split()
        r2, g2, b2 = posterized.split()
        
        r = Image.blend(r1, r2, 0.5)
        g = Image.blend(g1, g2, 0.5)
        b = Image.blend(b1, b2, 0.5)
        
        styled_img = Image.merge("RGB", (r, g, b))
        
        # Шаг 6: Финальное усиление контраста
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