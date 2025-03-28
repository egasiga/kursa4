import numpy as np
from PIL import Image

# Размер изображения
width, height = 256, 256
pixel_size = 8  # Размер пикселя для пиксель-арта

# Создаем новое изображение
image = np.zeros((height, width, 3), dtype=np.uint8)

# Генерируем пиксель-арт с ограниченной цветовой палитрой
colors = [
    [255, 0, 0],     # красный
    [0, 255, 0],     # зеленый
    [0, 0, 255],     # синий
    [255, 255, 0],   # желтый
    [255, 0, 255],   # пурпурный
    [0, 255, 255],   # голубой
    [255, 128, 0],   # оранжевый
    [128, 0, 255],   # фиолетовый
    [0, 128, 0],     # темно-зеленый
    [128, 128, 255], # светло-синий
    [255, 255, 255], # белый
    [0, 0, 0],       # черный
]

# Заполняем изображение пикселями
for y in range(0, height, pixel_size):
    for x in range(0, width, pixel_size):
        color = colors[np.random.randint(0, len(colors))]
        image[y:y+pixel_size, x:x+pixel_size] = color

# Создаем более интересный паттерн в центре (например, что-то похожее на инвадера из Space Invaders)
center_y = height // 2 - pixel_size * 3
center_x = width // 2 - pixel_size * 3

# Создаем инвадера (простая структура 8x8 пикселей)
invader_pattern = [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 1, 0, 1, 0],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [0, 1, 0, 0, 0, 0, 1, 0]
]

invader_color = [0, 255, 0]  # Зеленый цвет для инвадера
background_color = [0, 0, 0]  # Черный фон для инвадера

# Рисуем инвадера в центре
for i in range(8):
    for j in range(8):
        if invader_pattern[i][j] == 1:
            image[center_y + i*pixel_size:center_y + (i+1)*pixel_size, 
                  center_x + j*pixel_size:center_x + (j+1)*pixel_size] = invader_color
        else:
            image[center_y + i*pixel_size:center_y + (i+1)*pixel_size, 
                  center_x + j*pixel_size:center_x + (j+1)*pixel_size] = background_color

# Создаем мини-инвадеров по углам
mini_invader_pattern = [
    [0, 1, 0],
    [1, 1, 1],
    [1, 0, 1]
]

mini_size = pixel_size // 2
corner_positions = [
    (pixel_size*2, pixel_size*2),
    (width - pixel_size*5, pixel_size*2),
    (pixel_size*2, height - pixel_size*5),
    (width - pixel_size*5, height - pixel_size*5)
]

# Размещаем мини-инвадеров по углам
for corner_x, corner_y in corner_positions:
    for i in range(3):
        for j in range(3):
            if mini_invader_pattern[i][j] == 1:
                image[corner_y + i*mini_size:corner_y + (i+1)*mini_size, 
                      corner_x + j*mini_size:corner_x + (j+1)*mini_size] = colors[np.random.randint(0, len(colors)-2)]

# Сохраняем изображение
img = Image.fromarray(image)
img.save("server/styles/pixel_art.jpg")

print("Изображение пиксель-арта создано: server/styles/pixel_art.jpg")