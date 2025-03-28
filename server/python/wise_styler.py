#!/usr/bin/env python3
"""
Модуль для применения художественных эффектов к изображениям с использованием библиотеки WISE
"""

import os
import sys
import logging
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
import numpy as np
import random
try:
    import torch
    import torchvision.transforms as transforms
    from torchvision.transforms.functional import adjust_contrast, adjust_brightness, adjust_saturation
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    
# Импорты эффектов из WISE библиотеки
try:
    from wise.effects.up_or_down_sampling import UpSamplingEffect, DownSamplingEffect
    from wise.effects.xdog import XDoGEffect
    from wise.effects.oilpaint_compose import OilpaintComposeEffect
    from wise.effects.color_adjustment_toon import ColorAdjustmentToonEffect
    HAS_WISE = True
except ImportError:
    HAS_WISE = False

def apply_effect(image_path, output_path, style_name, intensity=1.0):
    """
    Применяет выбранный художественный эффект к изображению
    
    Args:
        image_path: путь к входному изображению
        output_path: путь для сохранения результата
        style_name: название стиля (xdog, pixel_art, oil_painting и т.д.)
        intensity: интенсивность эффекта (от 0.0 до 2.0)
    
    Returns:
        True в случае успеха, False в случае ошибки
    """
    try:
        # Открываем изображение
        img = Image.open(image_path)
        
        # Если WISE библиотека не найдена, используем базовые методы PIL
        if not HAS_WISE:
            logging.warning("WISE library not found, using basic PIL effects instead")
            result = apply_fallback_effects(img, style_name, intensity)
            result.save(output_path)
            return True
        
        # Применяем эффект в зависимости от выбранного стиля
        if style_name == 'pencil_sketch':
            result = apply_pencil_sketch(img, intensity)
        elif style_name == 'pixel_art':
            result = apply_pixel_art(img, intensity)
        elif style_name == 'oil_painting':
            result = apply_oil_painting(img, intensity)
        elif style_name == 'van_gogh':
            result = apply_van_gogh(img, intensity)
        elif style_name == 'anime':
            result = apply_anime(img, intensity)
        else:
            # По умолчанию используем карандашный набросок
            result = apply_pencil_sketch(img, intensity)
        
        # Сохраняем результат
        result.save(output_path)
        return True
        
    except Exception as e:
        logging.error(f"Error applying {style_name} effect: {str(e)}")
        # Просто копируем оригинальное изображение, если произошла ошибка
        try:
            Image.open(image_path).save(output_path)
        except:
            pass
        return False

def apply_pencil_sketch(img, intensity):
    """
    Применяет эффект карандашного наброска с использованием XDoG
    """
    # Конвертируем в режим RGB, если это не так
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    if HAS_WISE:
        try:
            # Параметры XDoG настроены для получения эффекта карандашного наброска
            xdog_effect = XDoGEffect(
                gamma=0.95, 
                phi=0.1 * intensity, 
                epsilon=0.05 * intensity, 
                k=2.5 * intensity,
                sigma=0.5
            )
            
            # Преобразуем в numpy array
            img_array = np.array(img)
            
            # Применяем эффект
            processed_array = xdog_effect.process(img_array)
            
            # Инвертируем цвета для получения черных линий на белом фоне
            processed_array = 255 - processed_array
            
            # Возвращаем как изображение PIL
            result = Image.fromarray(processed_array.astype('uint8'))
            return result
        except Exception as e:
            logging.error(f"Error in WISE XDoG: {str(e)}")
            # Fallback на метод PIL, если WISE не сработал
            return apply_fallback_pencil_sketch(img, intensity)
    else:
        return apply_fallback_pencil_sketch(img, intensity)

def apply_pixel_art(img, intensity):
    """
    Применяет эффект пиксель-арта с помощью даунсэмплинга и апсэмплинга
    """
    if HAS_WISE:
        try:
            # Определяем размер пикселей в зависимости от интенсивности
            pixel_size = max(2, int(16 * intensity))
            
            # Масштабируем изображение вниз (даунсэмплинг)
            w, h = img.size
            downsampling_scale = 1 / pixel_size
            
            downsampling = DownSamplingEffect(
                scale_factor=downsampling_scale,
                mode='nearest'  # Использование nearest для резких пикселей
            )
            
            # Применяем даунсэмплинг
            img_array = np.array(img)
            downsampled_array = downsampling.process(img_array)
            
            # Масштабируем обратно к исходному размеру (апсэмплинг)
            upsampling = UpSamplingEffect(
                scale_factor=pixel_size,
                mode='nearest'  # Сохраняем четкие границы пикселей
            )
            
            # Применяем апсэмплинг
            upsampled_array = upsampling.process(downsampled_array)
            
            # Создаем финальное изображение
            result = Image.fromarray(upsampled_array.astype('uint8'))
            
            # Применяем цветовую коррекцию для более насыщенных цветов
            if HAS_TORCH:
                result = adjust_saturation(result, 1.3 * intensity)
                result = adjust_contrast(result, 1.2 * intensity)
            else:
                enhancer = ImageEnhance.Color(result)
                result = enhancer.enhance(1.3 * intensity)
                enhancer = ImageEnhance.Contrast(result)
                result = enhancer.enhance(1.2 * intensity)
            
            return result
        except Exception as e:
            logging.error(f"Error in WISE pixel art effect: {str(e)}")
            return apply_fallback_pixel_art(img, intensity)
    else:
        return apply_fallback_pixel_art(img, intensity)

def apply_oil_painting(img, intensity):
    """
    Имитирует эффект масляной живописи
    """
    if HAS_WISE:
        try:
            # Применяем эффект масляной живописи из WISE
            oil_effect = OilpaintComposeEffect(
                radius=int(4 * intensity),
                intensity=intensity
            )
            
            # Преобразуем в numpy array
            img_array = np.array(img)
            
            # Применяем эффект
            processed_array = oil_effect.process(img_array)
            
            # Возвращаем как изображение PIL
            result = Image.fromarray(processed_array.astype('uint8'))
            
            # Дополнительная коррекция цвета для усиления эффекта
            if HAS_TORCH:
                result = adjust_saturation(result, 1.2 * intensity)
                result = adjust_contrast(result, 1.1 * intensity)
            else:
                enhancer = ImageEnhance.Color(result)
                result = enhancer.enhance(1.2 * intensity)
                enhancer = ImageEnhance.Contrast(result)
                result = enhancer.enhance(1.1 * intensity)
            
            return result
        except Exception as e:
            logging.error(f"Error in WISE oil painting effect: {str(e)}")
            return apply_fallback_oil_painting(img, intensity)
    else:
        return apply_fallback_oil_painting(img, intensity)

def apply_van_gogh(img, intensity):
    """
    Применяет стилизацию под Ван Гога
    """
    if HAS_WISE:
        try:
            # Комбинация эффектов для получения стиля Ван Гога
            
            # Шаг 1: Применяем базовый эффект масляной живописи
            oil_effect = OilpaintComposeEffect(
                radius=int(6 * intensity),
                intensity=intensity * 1.5  # Усиленная интенсивность для более выраженных мазков
            )
            
            # Преобразуем в numpy array
            img_array = np.array(img)
            
            # Применяем масляный эффект
            processed_array = oil_effect.process(img_array)
            
            # Шаг 2: Добавляем характерные для Ван Гога контрастные цвета и "завихрения"
            # Применяем ColorAdjustmentToonEffect для более насыщенных контрастных цветов
            color_effect = ColorAdjustmentToonEffect(
                quantize_colors=8,  # Небольшое количество цветов как у Ван Гога
                saturation_factor=1.4 * intensity
            )
            
            # Применяем цветовой эффект
            processed_array = color_effect.process(processed_array)
            
            # Возвращаем как изображение PIL
            result = Image.fromarray(processed_array.astype('uint8'))
            
            # Дополнительная обработка с помощью PIL для усиления эффекта
            # Добавляем синие и желтые оттенки, характерные для "Звездной ночи"
            if intensity > 1.0:
                # Смещаем цветовой баланс в сторону синих и желтых тонов
                r, g, b = result.split()
                r = ImageEnhance.Brightness(r).enhance(1.1)  # Усиливаем красный (для желтого)
                b = ImageEnhance.Brightness(b).enhance(1.2)  # Усиливаем синий
                result = Image.merge("RGB", (r, g, b))
            
            return result
        except Exception as e:
            logging.error(f"Error in WISE Van Gogh effect: {str(e)}")
            return apply_fallback_van_gogh(img, intensity)
    else:
        return apply_fallback_van_gogh(img, intensity)

def apply_anime(img, intensity):
    """
    Применяет стилизацию под аниме
    """
    if HAS_WISE:
        try:
            # Комбинация эффектов для получения аниме-стиля
            
            # Шаг 1: Применяем эффект контуров для создания линий аниме
            xdog_effect = XDoGEffect(
                gamma=0.85, 
                phi=0.2 * intensity, 
                epsilon=0.05, 
                k=1.5,
                sigma=0.4
            )
            
            # Преобразуем в numpy array
            img_array = np.array(img)
            
            # Получаем контуры (линии)
            lines_array = xdog_effect.process(img_array)
            
            # Шаг 2: Создаем цветную версию с упрощенными цветами
            color_effect = ColorAdjustmentToonEffect(
                quantize_colors=8,  # Небольшое количество цветов для аниме-стиля
                saturation_factor=1.3 * intensity
            )
            
            # Применяем цветовой эффект
            colored_array = color_effect.process(img_array)
            
            # Шаг 3: Комбинируем линии и цвета
            # Инвертируем контуры (темные линии)
            lines_array = 255 - lines_array
            
            # Маска для контуров (только самые сильные линии)
            threshold = 100
            mask = lines_array < threshold
            
            # Накладываем линии на цветное изображение
            result_array = colored_array.copy()
            result_array[mask] = 0  # Черные линии
            
            # Возвращаем как изображение PIL
            result = Image.fromarray(result_array.astype('uint8'))
            
            return result
        except Exception as e:
            logging.error(f"Error in WISE anime effect: {str(e)}")
            return apply_fallback_anime(img, intensity)
    else:
        return apply_fallback_anime(img, intensity)

# Fallback функции на случай, если WISE не доступен или не сработал
def apply_fallback_effects(img, style_name, intensity):
    """
    Применяет базовые эффекты PIL в зависимости от выбранного стиля
    """
    if style_name == 'pencil_sketch':
        return apply_fallback_pencil_sketch(img, intensity)
    elif style_name == 'pixel_art':
        return apply_fallback_pixel_art(img, intensity)
    elif style_name == 'oil_painting':
        return apply_fallback_oil_painting(img, intensity)
    elif style_name == 'van_gogh':
        return apply_fallback_van_gogh(img, intensity)
    elif style_name == 'anime':
        return apply_fallback_anime(img, intensity)
    else:
        # По умолчанию карандашный набросок
        return apply_fallback_pencil_sketch(img, intensity)

def apply_fallback_pencil_sketch(img, intensity):
    """
    Простой эффект карандашного наброска с использованием PIL
    """
    # Конвертируем в оттенки серого
    img_gray = img.convert('L')
    
    # Инвертируем
    img_invert = ImageOps.invert(img_gray)
    
    # Размываем для создания эффекта карандаша
    blur_radius = max(1, int(intensity * 3))
    img_blur = img_invert.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    
    # Смешиваем для получения скетча
    result = ImageOps.invert(Image.blend(img_gray, img_blur, 0.8 * intensity))
    
    return result

def apply_fallback_pixel_art(img, intensity):
    """
    Простой эффект пиксель-арта с использованием PIL
    """
    # Уменьшаем размер
    w, h = img.size
    pixel_size = max(2, int(16 * intensity))
    img_small = img.resize(
        (w // pixel_size, h // pixel_size), 
        resample=Image.NEAREST
    )
    
    # Увеличиваем обратно с сохранением пиксельной структуры
    result = img_small.resize((w, h), resample=Image.NEAREST)
    
    # Усиливаем контраст и насыщенность
    enhancer = ImageEnhance.Contrast(result)
    result = enhancer.enhance(1.2 * intensity)
    
    enhancer = ImageEnhance.Color(result)
    result = enhancer.enhance(1.3 * intensity)
    
    return result

def apply_fallback_oil_painting(img, intensity):
    """
    Простой эффект масляной живописи с использованием PIL
    """
    # Применяем фильтр медианного сглаживания для имитации мазков кисти
    radius = max(1, int(intensity * 5))
    result = img.filter(ImageFilter.MedianFilter(size=radius))
    
    # Усиливаем контраст и насыщенность
    enhancer = ImageEnhance.Contrast(result)
    result = enhancer.enhance(1.1 * intensity)
    
    enhancer = ImageEnhance.Color(result)
    result = enhancer.enhance(1.2 * intensity)
    
    # Добавляем резкость для имитации текстуры холста
    result = result.filter(ImageFilter.SHARPEN)
    
    return result

def apply_fallback_van_gogh(img, intensity):
    """
    Простой эффект стиля Ван Гога с использованием PIL
    """
    # Начинаем с эффекта масляной живописи
    result = apply_fallback_oil_painting(img, intensity * 1.5)
    
    # Усиливаем синие и желтые цвета, характерные для Ван Гога
    r, g, b = result.split()
    
    # Усиливаем красный (для желтого цвета)
    enhancer = ImageEnhance.Brightness(r)
    r = enhancer.enhance(1.1)
    
    # Усиливаем синий
    enhancer = ImageEnhance.Brightness(b)
    b = enhancer.enhance(1.2)
    
    result = Image.merge("RGB", (r, g, b))
    
    # Добавляем вихревую текстуру
    result = result.filter(ImageFilter.CONTOUR)
    
    return result

def apply_fallback_anime(img, intensity):
    """
    Простой эффект аниме-стиля с использованием PIL
    """
    # Усиливаем цвета
    enhancer = ImageEnhance.Color(img)
    result = enhancer.enhance(1.4 * intensity)
    
    # Повышаем яркость
    enhancer = ImageEnhance.Brightness(result)
    result = enhancer.enhance(1.1 * intensity)
    
    # Добавляем контуры
    edges = img.filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.invert(edges)
    
    # Комбинируем с основным изображением
    result = Image.blend(result, edges, 0.3 * intensity)
    
    return result

def main():
    """
    Основная функция для запуска из командной строки
    """
    if len(sys.argv) < 3:
        print("Usage: python wise_styler.py input_image output_image [style] [intensity]")
        sys.exit(1)
    
    input_image = sys.argv[1]
    output_image = sys.argv[2]
    style = sys.argv[3] if len(sys.argv) > 3 else "pencil_sketch"
    intensity = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    
    success = apply_effect(input_image, output_image, style, intensity)
    
    if success:
        print(f"Successfully applied {style} effect to {input_image} and saved to {output_image}")
    else:
        print(f"Failed to apply {style} effect")
        sys.exit(1)

if __name__ == "__main__":
    main()