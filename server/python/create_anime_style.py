import numpy as np
from PIL import Image, ImageDraw

# Размер изображения
width, height = 256, 256

# Создаем новое изображение
img = Image.new('RGB', (width, height), (255, 255, 255))
draw = ImageDraw.Draw(img)

# Цвета для аниме
bg_color = (200, 230, 255)  # Светло-голубой фон
hair_color = (50, 50, 200)  # Синий цвет волос
eye_color = (100, 200, 255)  # Голубые глаза
outline_color = (0, 0, 0)    # Черный контур
skin_color = (255, 220, 200) # Цвет кожи
blush_color = (255, 150, 150) # Румянец

# Заполняем фон
draw.rectangle([(0, 0), (width, height)], fill=bg_color)

# Рисуем лицо (овал)
face_width = width // 2
face_height = int(face_width * 1.3)
face_left = (width - face_width) // 2
face_top = (height - face_height) // 2
face_right = face_left + face_width
face_bottom = face_top + face_height

draw.ellipse([(face_left, face_top), (face_right, face_bottom)], 
             fill=skin_color, outline=outline_color, width=2)

# Рисуем волосы (верхняя часть головы и по бокам)
hair_top = face_top - face_height // 5
hair_left = face_left - face_width // 8
hair_right = face_right + face_width // 8
hair_bottom = face_top + face_height // 2

# Верхняя часть волос
draw.ellipse([(hair_left, hair_top), (hair_right, face_top + face_height // 3)], 
             fill=hair_color, outline=outline_color, width=2)

# Боковые пряди волос
draw.ellipse([(hair_left - 20, face_top + face_height // 6), 
              (face_left - 5, face_bottom - face_height // 4)], 
             fill=hair_color, outline=outline_color, width=2)

draw.ellipse([(face_right + 5, face_top + face_height // 6), 
              (hair_right + 20, face_bottom - face_height // 4)], 
             fill=hair_color, outline=outline_color, width=2)

# Рисуем глаза
eye_width = face_width // 5
eye_height = eye_width // 2
eye_spacing = eye_width * 1.5

left_eye_center = (face_left + face_width // 3, face_top + face_height // 3)
right_eye_center = (face_right - face_width // 3, face_top + face_height // 3)

# Белки глаз
draw.ellipse([(left_eye_center[0] - eye_width // 2, left_eye_center[1] - eye_height // 2),
              (left_eye_center[0] + eye_width // 2, left_eye_center[1] + eye_height // 2)],
             fill=(255, 255, 255), outline=outline_color, width=1)

draw.ellipse([(right_eye_center[0] - eye_width // 2, right_eye_center[1] - eye_height // 2),
              (right_eye_center[0] + eye_width // 2, right_eye_center[1] + eye_height // 2)],
             fill=(255, 255, 255), outline=outline_color, width=1)

# Радужки
iris_size = eye_width // 3
draw.ellipse([(left_eye_center[0] - iris_size, left_eye_center[1] - iris_size),
              (left_eye_center[0] + iris_size, left_eye_center[1] + iris_size)],
             fill=eye_color, outline=outline_color, width=1)

draw.ellipse([(right_eye_center[0] - iris_size, right_eye_center[1] - iris_size),
              (right_eye_center[0] + iris_size, right_eye_center[1] + iris_size)],
             fill=eye_color, outline=outline_color, width=1)

# Зрачки
pupil_size = iris_size // 2
draw.ellipse([(left_eye_center[0] - pupil_size, left_eye_center[1] - pupil_size),
              (left_eye_center[0] + pupil_size, left_eye_center[1] + pupil_size)],
             fill=(0, 0, 0))

draw.ellipse([(right_eye_center[0] - pupil_size, right_eye_center[1] - pupil_size),
              (right_eye_center[0] + pupil_size, right_eye_center[1] + pupil_size)],
             fill=(0, 0, 0))

# Блики в глазах
highlight_size = pupil_size // 2
draw.ellipse([(left_eye_center[0] - highlight_size, left_eye_center[1] - highlight_size),
              (left_eye_center[0] + highlight_size // 2, left_eye_center[1] - highlight_size // 2)],
             fill=(255, 255, 255))

draw.ellipse([(right_eye_center[0] - highlight_size, right_eye_center[1] - highlight_size),
              (right_eye_center[0] + highlight_size // 2, right_eye_center[1] - highlight_size // 2)],
             fill=(255, 255, 255))

# Румянец на щеках
blush_radius = face_width // 8
left_blush_center = (face_left + face_width // 4, face_top + face_height // 2)
right_blush_center = (face_right - face_width // 4, face_top + face_height // 2)

draw.ellipse([(left_blush_center[0] - blush_radius, left_blush_center[1] - blush_radius // 2),
              (left_blush_center[0] + blush_radius, left_blush_center[1] + blush_radius // 2)],
             fill=blush_color)

draw.ellipse([(right_blush_center[0] - blush_radius, right_blush_center[1] - blush_radius // 2),
              (right_blush_center[0] + blush_radius, right_blush_center[1] + blush_radius // 2)],
             fill=blush_color)

# Рисуем рот (маленькая улыбка)
mouth_width = face_width // 4
mouth_height = mouth_width // 4
mouth_center = (face_left + face_width // 2, face_top + face_height * 2 // 3)

draw.arc([(mouth_center[0] - mouth_width // 2, mouth_center[1] - mouth_height),
          (mouth_center[0] + mouth_width // 2, mouth_center[1] + mouth_height)],
         start=0, end=180, fill=outline_color, width=2)

# Сохраняем изображение
img.save("server/styles/anime.jpg")

print("Изображение в стиле аниме создано: server/styles/anime.jpg")