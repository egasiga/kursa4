#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import base64
import json
import sys
import io
from PIL import Image
import requests
from typing import Dict, Any

# Получаем API-ключ из переменных окружения
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Базовые URL для OpenAI API
OPENAI_API_URL = "https://api.openai.com/v1/images/generations"
OPENAI_API_EDIT_URL = "https://api.openai.com/v1/images/edits"

def generate_headers():
    """Создает заголовки для запросов к OpenAI API."""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }

def process_image_with_openai(image_path: str, style_params: Dict[Any, Any]) -> str:
    """
    Обрабатывает изображение с помощью OpenAI API.
    
    Args:
        image_path: путь к файлу с изображением в формате base64
        style_params: параметры стиля для применения
    
    Returns:
        Обработанное изображение в формате base64
    """
    try:
        # Извлекаем параметры стиля
        ai_model = style_params.get("aiModel", "")
        transform_type = style_params.get("transformType", "")
        style_reference = style_params.get("styleReference", "")
        
        # Загружаем изображение из файла
        with open(image_path, 'r') as f:
            image_data = f.read()
        
        # Декодируем изображение из base64
        image_binary = base64.b64decode(image_data)
        pil_image = Image.open(io.BytesIO(image_binary))
        
        # Генерируем описание стиля для запроса
        style_description = generate_style_description(ai_model, transform_type, style_reference, style_params)
        
        # Создаем запрос к OpenAI DALL-E
        response_data = call_openai_api(pil_image, style_description)
        
        if response_data and "data" in response_data and len(response_data["data"]) > 0:
            # Извлекаем URL изображения из ответа
            image_url = response_data["data"][0]["url"]
            
            # Загружаем изображение по URL
            image_response = requests.get(image_url)
            if image_response.status_code == 200:
                # Конвертируем изображение в base64
                result_image_data = base64.b64encode(image_response.content).decode("utf-8")
                return result_image_data
        
        # Если что-то пошло не так, возвращаем исходное изображение
        with open(image_path, 'r') as f:
            original_image_data = f.read()
        return original_image_data
        
    except Exception as e:
        print(f"Ошибка при обработке изображения: {str(e)}", file=sys.stderr)
        # В случае ошибки возвращаем исходное изображение
        with open(image_path, 'r') as f:
            original_image_data = f.read()
        return original_image_data

def generate_style_description(ai_model: str, transform_type: str, style_reference: str, style_params: Dict[Any, Any]) -> str:
    """
    Генерирует текстовое описание стиля для запроса к DALL-E.
    
    Args:
        ai_model: модель AI для применения
        transform_type: тип трансформации
        style_reference: референс стиля
        style_params: дополнительные параметры стиля
    
    Returns:
        Текстовое описание стиля
    """
    # Базовое описание
    description = "Transform this image"
    
    # Добавляем специфические параметры в зависимости от AI модели
    if ai_model == "neural-style":
        description += " using neural style transfer"
        
    elif ai_model == "anime-gan":
        description += " into anime style art"
        
    elif ai_model == "style-transfer":
        if style_reference == "impressionism":
            description += " into impressionist painting style like Monet or Renoir"
        elif style_reference == "cubism":
            description += " into cubist style like Picasso"
        elif style_reference == "pop-art":
            description += " into pop art style like Andy Warhol"
        elif style_reference == "noir":
            description += " into film noir style, high contrast black and white"
        else:
            description += f" into {style_reference} style"
            
    elif ai_model == "pixel-transformer":
        pixel_size = style_params.get("pixelSize", 8)
        description += f" into pixel art with {pixel_size}px resolution"
        
    elif ai_model == "cartoonizer":
        description += " into a cartoon style drawing"
        
    elif ai_model == "comic-transformer":
        description += " into comic book style with bold outlines and halftone patterns"
        
    elif ai_model == "future-vision":
        description += " into cyberpunk style with neon lights and futuristic elements"
    
    # Добавляем тип трансформации, если он указан
    if transform_type and transform_type not in ["default", "basic"]:
        description += f", emphasizing {transform_type} qualities"
    
    return description

def call_openai_api(image: Image.Image, prompt: str) -> Dict[Any, Any]:
    """
    Вызывает OpenAI API для генерации изображения на основе промпта.
    
    Args:
        image: исходное изображение
        prompt: текстовый промпт для генерации
    
    Returns:
        Словарь с ответом от API
    """
    try:
        # Модель DALL-E 3 не поддерживает прямое редактирование изображений,
        # поэтому мы используем model="dall-e-2" для функции edits
        
        # Сжимаем изображение до размера, принимаемого API
        max_size = 1024
        image.thumbnail((max_size, max_size), Image.LANCZOS)
        
        # Убеждаемся, что изображение в формате RGBA
        if image.mode != "RGBA":
            image = image.convert("RGBA")
        
        # Создаем белый фон (маску)
        mask = Image.new("RGBA", image.size, (255, 255, 255, 0))
        
        # Сохраняем изображение и маску во временные файлы
        image_buffer = io.BytesIO()
        mask_buffer = io.BytesIO()
        
        image.save(image_buffer, format="PNG")
        mask.save(mask_buffer, format="PNG")
        
        image_buffer.seek(0)
        mask_buffer.seek(0)
        
        # Для генерации с ограниченными правками используем модель DALL-E 2
        # с методом edits, который позволяет сохранить оригинальное изображение
        files = {
            "image": ("image.png", image_buffer, "image/png"),
            "mask": ("mask.png", mask_buffer, "image/png"),
        }
        
        payload = {
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024",
            "model": "dall-e-2"
        }
        
        response = requests.post(
            OPENAI_API_EDIT_URL,
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            files=files,
            data={"prompt": prompt, "n": 1, "size": "1024x1024"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Ошибка OpenAI API: {response.status_code}", file=sys.stderr)
            print(f"Ответ: {response.text}", file=sys.stderr)
            return {}
            
    except Exception as e:
        print(f"Ошибка при вызове OpenAI API: {str(e)}", file=sys.stderr)
        return {}

# Если скрипт запущен как основной, принимаем аргументы из командной строки
if __name__ == "__main__":
    # Ожидаем два аргумента: путь к файлу с base64 изображением и путь к файлу с JSON параметрами стиля
    if len(sys.argv) != 3:
        print("Использование: python ai_processor_file.py <image_file> <style_params_file>", file=sys.stderr)
        sys.exit(1)
        
    image_path = sys.argv[1]
    style_params_path = sys.argv[2]
    
    # Загружаем параметры стиля из файла
    with open(style_params_path, 'r') as f:
        style_params = json.load(f)
    
    # Обрабатываем изображение и выводим результат
    result = process_image_with_openai(image_path, style_params)
    print(result)