#!/usr/bin/env python

import os
import numpy as np
from PIL import Image

# Директория для хранения стилевых изображений
STYLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'styles')

# Создаем директорию, если она не существует
if not os.path.exists(STYLE_DIR):
    os.makedirs(STYLE_DIR)

# Функция для создания изображения стиля
def create_style_image(style_name, save_path):
    """Создает тестовое изображение для указанного стиля"""
    
    # Создаем пустое изображение
    img = Image.new('RGB', (256, 256), color='white')
    
    # Преобразуем в массив NumPy для удобства работы
    arr = np.array(img)
    
    # В зависимости от стиля создаем разный паттерн
    if "масляная" in style_name.lower() or "oil" in style_name.lower():
        # Градиент для масляной живописи
        for i in range(256):
            for j in range(256):
                # Создаем волнистый узор для текстуры масляной краски
                wave = np.sin(i/10.0) * 20 + np.cos(j/8.0) * 15
                r = min(255, max(0, int(180 + wave + i * 0.2)))
                g = min(255, max(0, int(120 + wave - j * 0.1)))
                b = min(255, max(0, int(80 + wave * 0.5)))
                arr[i, j] = [r, g, b]
                
    elif "набросок" in style_name.lower() or "pencil" in style_name.lower():
        # Градиент для карандашного наброска
        for i in range(256):
            for j in range(256):
                # Создаем штриховку для имитации карандаша
                line = (i + j) % 15 < 3
                val = 200 if line else 240
                diagonal = (i - j) % 20 < 3
                val = min(val, 210 if diagonal else 240)
                arr[i, j] = [val, val, val]
                
    elif "акварель" in style_name.lower() or "water" in style_name.lower():
        # Градиент для акварели
        for i in range(256):
            for j in range(256):
                # Создаем мягкий размытый узор с переходами цветов
                r = min(255, max(0, int(100 + np.sin(i/30.0) * 50 + np.sin(j/20.0) * 30)))
                g = min(255, max(0, int(150 + np.sin((i+j)/40.0) * 40)))
                b = min(255, max(0, int(200 + np.cos(j/15.0) * 30)))
                arr[i, j] = [r, g, b]
                
    elif "пиксель" in style_name.lower() or "pixel" in style_name.lower():
        # Градиент для пиксель-арта
        for i in range(0, 256, 8):
            for j in range(0, 256, 8):
                # Создаем блоки однородных цветов
                r = (i * 256 // 256) % 256
                g = (j * 256 // 256) % 256
                b = ((i + j) // 2 * 256 // 256) % 256
                
                for di in range(8):
                    for dj in range(8):
                        if i+di < 256 and j+dj < 256:
                            arr[i+di, j+dj] = [r, g, b]
                        
    elif "аниме" in style_name.lower() or "anime" in style_name.lower():
        # Градиент для аниме
        for i in range(256):
            for j in range(256):
                # Создаем яркие чистые области цвета с резкими переходами
                area = (i // 50) + (j // 50)
                if area % 3 == 0:
                    r, g, b = 255, 200, 220  # Розовый
                elif area % 3 == 1:
                    r, g, b = 135, 206, 250  # Голубой
                else:
                    r, g, b = 255, 255, 200  # Светло-желтый
                
                # Добавляем границы между областями
                if i % 50 < 2 or j % 50 < 2:
                    r, g, b = 30, 30, 30  # Темные линии
                
                arr[i, j] = [r, g, b]
                
    elif "ван гог" in style_name.lower() or "van gogh" in style_name.lower():
        # Градиент для стиля Ван Гога
        for i in range(256):
            for j in range(256):
                # Имитация завихрений в стиле "Звездной ночи"
                angle = np.arctan2(i - 128, j - 128)
                distance = np.sqrt((i - 128)**2 + (j - 128)**2)
                wave = np.sin(distance/10.0 + angle*5) * 30
                
                r = min(255, max(0, int(50 + wave + distance * 0.5)))
                g = min(255, max(0, int(80 + wave * 0.7)))
                b = min(255, max(0, int(120 + wave * 0.5 + distance * 0.3)))
                arr[i, j] = [r, g, b]
                
    else:
        # Стандартный градиент для других стилей
        for i in range(256):
            for j in range(256):
                arr[i, j] = [
                    (i * 256 // 256) % 256,  # Красный
                    (j * 256 // 256) % 256,  # Зеленый
                    ((i + j) // 2 * 256 // 256) % 256  # Синий
                ]

    # Создаем изображение из массива и сохраняем
    img = Image.fromarray(arr.astype('uint8'))
    img.save(save_path)
    print(f"Создано стилевое изображение: {save_path}")

# Создаем стилевые изображения для разных стилей
styles = {
    "oil_painting.jpg": "Масляная живопись",
    "watercolor.jpg": "Акварель",
    "pencil_sketch.jpg": "Набросок карандашом",
    "line_drawing.jpg": "Контурный рисунок",
    "pixel_art.jpg": "Пиксель-арт",
    "anime.jpg": "Аниме",
    "comic.jpg": "Комикс",
    "neon.jpg": "Неон",
    "vintage.jpg": "Винтаж",
    "neural_art.jpg": "Нейронное искусство",
    "van_gogh.jpg": "Ван Гог"
}

# Создаем все стилевые изображения
for filename, style_name in styles.items():
    file_path = os.path.join(STYLE_DIR, filename)
    create_style_image(style_name, file_path)

print(f"Все стилевые изображения созданы в директории: {STYLE_DIR}")