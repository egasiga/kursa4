import numpy as np
from PIL import Image, ImageDraw

# Размер изображения
width, height = 256, 256

# Создаем новое изображение (фон в светло-бежевом цвете бумаги)
paper_color = (245, 241, 231)
img = Image.new('RGB', (width, height), paper_color)
draw = ImageDraw.Draw(img)

# Функция для рисования случайной неровной линии
def draw_sketchy_line(start_point, end_point, color=(80, 80, 80), width_range=(1, 3), jitter=2):
    # Основная линия
    num_segments = int(np.linalg.norm(np.array(end_point) - np.array(start_point)) / 5)
    num_segments = max(2, num_segments)
    
    x_points = np.linspace(start_point[0], end_point[0], num_segments)
    y_points = np.linspace(start_point[1], end_point[1], num_segments)
    
    # Добавляем случайные отклонения для эффекта наброска
    x_points += np.random.normal(0, jitter, num_segments)
    y_points += np.random.normal(0, jitter, num_segments)
    
    # Рисуем ломаную линию
    points = list(zip(x_points, y_points))
    
    # Сопоставляем интенсивность нажима (толщину линии) на разных участках
    for i in range(len(points) - 1):
        # Случайная толщина линии для имитации разного нажима
        width = np.random.uniform(width_range[0], width_range[1])
        # Случайная интенсивность цвета для большей реалистичности
        intensity = np.random.randint(50, 100)
        line_color = (intensity, intensity, intensity)
        draw.line([points[i], points[i+1]], fill=line_color, width=int(width))
    
    # Добавляем несколько дополнительных штрихов для эффекта карандаша
    for _ in range(num_segments // 3):
        i = np.random.randint(0, len(points) - 2)
        offset = np.random.normal(0, jitter/2, 2)
        p1 = (points[i][0] + offset[0], points[i][1] + offset[1])
        p2 = (points[i+1][0] + offset[0], points[i+1][1] + offset[1])
        width = np.random.uniform(width_range[0]/2, width_range[1]/2)
        intensity = np.random.randint(30, 80)
        line_color = (intensity, intensity, intensity)
        draw.line([p1, p2], fill=line_color, width=int(width))

# Функция для создания эффекта штриховки
def draw_hatching(bbox, angle=45, spacing=5, color=(100, 100, 100), width=1, jitter=1):
    left, top, right, bottom = bbox
    width_box = right - left
    height_box = bottom - top
    
    # Переводим угол в радианы
    angle_rad = np.radians(angle)
    
    # Вычисляем длину линии, которая пересечет весь прямоугольник
    diagonal = np.sqrt(width_box**2 + height_box**2)
    
    # Вычисляем количество линий для заполнения прямоугольника
    num_lines = int(diagonal / spacing * 1.5)
    
    # Центр прямоугольника
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    
    # Рисуем параллельные линии через прямоугольник
    for i in range(-num_lines//2, num_lines//2 + 1):
        # Начальная и конечная точки линии
        offset = i * spacing
        
        # Точки на расстоянии offset от центра
        x_offset = offset * np.cos(angle_rad + np.pi/2)
        y_offset = offset * np.sin(angle_rad + np.pi/2)
        
        # Точки вдоль линии
        dx = diagonal/2 * np.cos(angle_rad)
        dy = diagonal/2 * np.sin(angle_rad)
        
        start_x = center_x + x_offset - dx
        start_y = center_y + y_offset - dy
        end_x = center_x + x_offset + dx
        end_y = center_y + y_offset + dy
        
        # Проверяем, пересекает ли линия прямоугольник
        # (Это упрощенная проверка, можно использовать более точные алгоритмы)
        if (min(start_x, end_x) < right and max(start_x, end_x) > left and
            min(start_y, end_y) < bottom and max(start_y, end_y) > top):
            
            # Добавляем случайные отклонения для эффекта наброска
            if np.random.random() < 0.9:  # Некоторые линии пропускаем для естественности
                intensity = np.random.randint(70, 130)
                line_color = (intensity, intensity, intensity)
                draw_sketchy_line((start_x, start_y), (end_x, end_y), 
                                  color=line_color, 
                                  width_range=(width*0.5, width*1.5), 
                                  jitter=jitter)

# Рисуем основные геометрические формы в стиле карандашного наброска

# 1. Нарисуем куб в перспективе
cube_points = [
    (100, 80),  # верхний левый передний
    (170, 80),  # верхний правый передний
    (170, 150), # нижний правый передний
    (100, 150), # нижний левый передний
    (70, 50),   # верхний левый задний
    (140, 50),  # верхний правый задний
    (140, 120), # нижний правый задний
    (70, 120)   # нижний левый задний
]

# Рисуем передние грани куба
draw_sketchy_line(cube_points[0], cube_points[1], width_range=(2, 4))
draw_sketchy_line(cube_points[1], cube_points[2], width_range=(2, 4))
draw_sketchy_line(cube_points[2], cube_points[3], width_range=(2, 4))
draw_sketchy_line(cube_points[3], cube_points[0], width_range=(2, 4))

# Рисуем задние грани куба (штриховыми линиями)
for i in range(4, 8):
    j = i % 4 + 4
    if i < 7:
        draw_sketchy_line(cube_points[i], cube_points[j], width_range=(1, 2))

# Соединяем передние и задние грани
for i in range(4):
    draw_sketchy_line(cube_points[i], cube_points[i+4], width_range=(1, 3))

# Добавляем штриховку на одну из граней куба
draw_hatching((100, 80, 170, 150), angle=45, spacing=4, width=1)

# 2. Нарисуем сферу с тенями
sphere_center = (180, 190)
sphere_radius = 40

# Рисуем основной контур сферы
num_points = 40
for i in range(num_points):
    angle1 = 2 * np.pi * i / num_points
    angle2 = 2 * np.pi * ((i + 1) % num_points) / num_points
    x1 = sphere_center[0] + sphere_radius * np.cos(angle1)
    y1 = sphere_center[1] + sphere_radius * np.sin(angle1)
    x2 = sphere_center[0] + sphere_radius * np.cos(angle2)
    y2 = sphere_center[1] + sphere_radius * np.sin(angle2)
    
    # Делаем линии тоньше в зависимости от положения (эффект освещения)
    width_factor = 1.0 + 0.5 * (1 + np.cos(angle1 + np.pi/4))
    draw_sketchy_line((x1, y1), (x2, y2), width_range=(width_factor, width_factor+1))

# Добавляем эффект тени внутри сферы
# Создаем дуги разной интенсивности
for i in range(5):
    radius_factor = 0.8 - i * 0.15
    intensity = 80 + i * 20
    line_color = (intensity, intensity, intensity)
    
    # Рисуем дугу
    start_angle = np.pi / 4
    end_angle = np.pi * 7 / 4
    
    num_arc_points = 20
    for j in range(num_arc_points):
        angle1 = start_angle + (end_angle - start_angle) * j / num_arc_points
        angle2 = start_angle + (end_angle - start_angle) * (j + 1) / num_arc_points
        x1 = sphere_center[0] + sphere_radius * radius_factor * np.cos(angle1)
        y1 = sphere_center[1] + sphere_radius * radius_factor * np.sin(angle1)
        x2 = sphere_center[0] + sphere_radius * radius_factor * np.cos(angle2)
        y2 = sphere_center[1] + sphere_radius * radius_factor * np.sin(angle2)
        
        draw_sketchy_line((x1, y1), (x2, y2), color=line_color, 
                          width_range=(1, 2), jitter=1)

# 3. Нарисуем простой цилиндр
cylinder_center = (70, 200)
cylinder_width = 40
cylinder_height = 60

# Основание цилиндра (эллипс)
num_points = 30
for i in range(num_points):
    angle1 = 2 * np.pi * i / num_points
    angle2 = 2 * np.pi * ((i + 1) % num_points) / num_points
    x1 = cylinder_center[0] + cylinder_width/2 * np.cos(angle1)
    y1 = cylinder_center[1] + cylinder_width/4 * np.sin(angle1)
    x2 = cylinder_center[0] + cylinder_width/2 * np.cos(angle2)
    y2 = cylinder_center[1] + cylinder_width/4 * np.sin(angle2)
    
    draw_sketchy_line((x1, y1), (x2, y2), width_range=(1, 2))

# Верхняя часть цилиндра (эллипс)
top_center = (cylinder_center[0], cylinder_center[1] - cylinder_height)
for i in range(num_points):
    angle1 = 2 * np.pi * i / num_points
    angle2 = 2 * np.pi * ((i + 1) % num_points) / num_points
    x1 = top_center[0] + cylinder_width/2 * np.cos(angle1)
    y1 = top_center[1] + cylinder_width/4 * np.sin(angle1)
    x2 = top_center[0] + cylinder_width/2 * np.cos(angle2)
    y2 = top_center[1] + cylinder_width/4 * np.sin(angle2)
    
    draw_sketchy_line((x1, y1), (x2, y2), width_range=(1, 2))

# Боковые линии цилиндра
for i in range(0, num_points, num_points // 8):
    angle = 2 * np.pi * i / num_points
    x1 = cylinder_center[0] + cylinder_width/2 * np.cos(angle)
    y1 = cylinder_center[1] + cylinder_width/4 * np.sin(angle)
    x2 = top_center[0] + cylinder_width/2 * np.cos(angle)
    y2 = top_center[1] + cylinder_width/4 * np.sin(angle)
    
    if np.sin(angle) > 0:  # Линии на передней части цилиндра
        draw_sketchy_line((x1, y1), (x2, y2), width_range=(1, 3))
    else:  # Линии на задней части цилиндра (штриховая линия)
        draw_sketchy_line((x1, y1), (x2, y2), width_range=(0.5, 1), jitter=1)

# Добавляем несколько линий штриховки на поверхности цилиндра
left_side = cylinder_center[0] - cylinder_width/2
right_side = cylinder_center[0] + cylinder_width/2
draw_hatching((left_side, top_center[1], right_side, cylinder_center[1]), 
              angle=75, spacing=5, width=1, jitter=1)

# Применяем текстуру бумаги (добавляем шум)
img_array = np.array(img)
noise = np.random.randint(0, 10, (height, width, 3), dtype=np.uint8)
img_array = np.clip(img_array.astype(np.int32) + noise - 5, 0, 255).astype(np.uint8)

# Преобразуем обратно в изображение
img = Image.fromarray(img_array)

# Сохраняем изображение
img.save("server/styles/pencil_sketch.jpg")

print("Изображение карандашного наброска создано: server/styles/pencil_sketch.jpg")