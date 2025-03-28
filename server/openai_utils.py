"""
Модуль для работы с OpenAI API
"""
import json
import os
import base64
from io import BytesIO
from PIL import Image

# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai = OpenAI(api_key=OPENAI_API_KEY)

def generate_style_description(ai_model: str, transform_type: str, style_reference: str, style_params: dict) -> str:
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

def process_image_with_openai(image_data_base64: str, style_params: dict) -> str:
    """
    Обрабатывает изображение с помощью OpenAI API DALL-E.
    
    Args:
        image_data_base64: изображение в формате base64 (без префикса)
        style_params: параметры стиля для применения
    
    Returns:
        Обработанное изображение в формате base64
    """
    if not OPENAI_API_KEY:
        return image_data_base64
        
    try:
        # Извлекаем параметры стиля
        ai_model = style_params.get("aiModel", "")
        transform_type = style_params.get("transformType", "")
        style_reference = style_params.get("styleReference", "")
        
        # Генерируем описание стиля для запроса
        style_description = generate_style_description(ai_model, transform_type, style_reference, style_params)
        
        # Конвертируем base64 в PIL изображение
        image_binary = base64.b64decode(image_data_base64)
        pil_image = Image.open(BytesIO(image_binary))
        
        # Подготавливаем изображение для API
        # Сжимаем изображение до подходящего размера
        max_size = 1024
        pil_image.thumbnail((max_size, max_size), Image.LANCZOS)
        
        # Сохраняем изображение в буфер в формате PNG
        buffer = BytesIO()
        pil_image.save(buffer, format="PNG")
        buffer.seek(0)
        
        # Конвертируем изображение в base64 для отправки в API
        img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        # Создаем запрос к DALL-E API (используя модель DALL-E 3)
        response = openai.images.generate(
            model="dall-e-3",
            prompt=style_description,
            n=1,
            size="1024x1024",
        )
        
        # Получаем URL сгенерированного изображения
        image_url = response.data[0].url
        
        # Загружаем изображение по URL
        import requests
        image_response = requests.get(image_url)
        
        if image_response.status_code == 200:
            # Возвращаем обработанное изображение в base64
            return base64.b64encode(image_response.content).decode("utf-8")
            
    except Exception as e:
        print(f"Ошибка при обработке изображения через OpenAI: {str(e)}")
        
    # В случае ошибки возвращаем исходное изображение
    return image_data_base64

def analyze_image(base64_image: str) -> str:
    """
    Анализирует изображение и возвращает его описание.
    
    Args:
        base64_image: изображение в формате base64
        
    Returns:
        Текстовое описание изображения
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Проанализируй это изображение подробно и опиши его ключевые "
                            + "элементы, контекст и любые значимые аспекты. Ответ дай на русском языке.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                        },
                    ],
                }
            ],
            max_tokens=500,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Ошибка при анализе изображения: {str(e)}")
        return "Не удалось проанализировать изображение."