import numpy as np
from PIL import Image
import math

# Размер изображения
width, height = 256, 256

# Создаем новое изображение
image = np.zeros((height, width, 3), dtype=np.uint8)

# Цвета в стиле Ван Гога
colors = [
    [0, 10, 97],     # темно-синий
    [42, 40, 150],   # синий
    [105, 113, 208], # голубой
    [242, 234, 157], # светло-желтый
    [247, 215, 75],  # желтый
    [241, 190, 45],  # темно-желтый
    [198, 144, 29],  # горчичный
    [157, 93, 22],   # коричневый
    [91, 67, 24],    # темно-коричневый
]

# Создаем фон в стиле "Звездная ночь" - градиент синего с желтыми вкраплениями
for y in range(height):
    for x in range(width):
        # Градиент от темно-синего к более светлому
        blue_value = 50 + int(x / width * 100)
        blue_color = [10, 20, blue_value]
        
        # Случайные вариации для текстуры
        variation = np.random.randint(-20, 20)
        blue_color = [max(0, min(255, c + variation)) for c in blue_color]
        
        image[y, x] = blue_color

# Функция для создания завихрения в стиле Ван Гога
def draw_swirl(center_x, center_y, radius, color):
    for angle in range(0, 1440, 5):  # 4 полных оборота (360 * 4 = 1440)
        rad = math.radians(angle)
        # Увеличиваем радиус с углом для эффекта спирали
        r = radius * (1 + angle / 1440)
        x = int(center_x + r * math.cos(rad))
        y = int(center_y + r * math.sin(rad))
        
        if 0 <= x < width and 0 <= y < height:
            # Добавляем толщину линии
            for dx in range(-2, 3):
                for dy in range(-2, 3):
                    if 0 <= x + dx < width and 0 <= y + dy < height:
                        # Добавляем вариации цвета для более естественного вида
                        color_var = [max(0, min(255, c + np.random.randint(-15, 15))) for c in color]
                        image[y + dy, x + dx] = color_var

# Рисуем крупное завихрение - "звезду"
draw_swirl(width // 4, height // 4, 20, colors[4])  # Желтая звезда

# Рисуем другую "звезду"
draw_swirl(width * 3 // 4, height // 3, 15, colors[3])  # Светло-желтая звезда

# Рисуем несколько меньших завихрений
for _ in range(10):
    center_x = np.random.randint(20, width-20)
    center_y = np.random.randint(20, height-20)
    radius = np.random.randint(3, 10)
    color_idx = np.random.randint(0, len(colors))
    draw_swirl(center_x, center_y, radius, colors[color_idx])

# Создаем волнистые линии, имитирующие мазки
for i in range(20):
    y_base = np.random.randint(0, height)
    amplitude = np.random.randint(5, 20)
    period = np.random.randint(50, 150)
    thickness = np.random.randint(1, 4)
    color_idx = np.random.randint(0, len(colors))
    
    for x in range(0, width):
        y = y_base + int(amplitude * math.sin(x * 2 * math.pi / period))
        if 0 <= y < height:
            for t in range(-thickness, thickness+1):
                if 0 <= y + t < height:
                    # Вариации цвета для имитации мазков кисти
                    color_var = [max(0, min(255, c + np.random.randint(-10, 10))) for c in colors[color_idx]]
                    image[y + t, x] = color_var

# Сохраняем изображение
img = Image.fromarray(image)
img.save("server/styles/van_gogh.jpg")

print("Изображение в стиле Ван Гога создано: server/styles/van_gogh.jpg")