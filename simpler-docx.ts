import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import * as fs from 'fs';

// Пример создания DOCX файла
async function createSimpleDocx(outputPath: string): Promise<void> {
  // Создаем новый документ
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: "ПОЯСНИТЕЛЬНАЯ ЗАПИСКА",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "к проекту «Редактор изображений с применением AI-стилизации»",
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Выполнил: Студент",
              font: "Times New Roman",
              size: 28,
            }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Проверил: Преподаватель",
              font: "Times New Roman",
              size: 28,
            }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
        
        // Новая страница
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),
        
        // Содержание
        new Paragraph({
          text: "СОДЕРЖАНИЕ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "ВВЕДЕНИЕ",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "1 ОПИСАНИЕ ПРОЕКТА",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "   1.1 Техническое задание",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "   1.2 Функциональность системы",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "2 ОПИСАНИЕ ИНСТРУМЕНТАРИЯ И ЕГО ОБОСНОВАНИЕ",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "   2.1 Выбор языка программирования",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "   2.2 Выбор среды разработки",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "   2.3 Выбор библиотек и фреймворков",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "3 ОПИСАНИЕ РЕАЛИЗАЦИИ",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "   3.1 Архитектура приложения",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "   3.2 Описание пользовательского интерфейса",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "ЗАКЛЮЧЕНИЕ",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Новая страница
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),
        
        // Введение
        new Paragraph({
          text: "ВВЕДЕНИЕ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "В современную эпоху цифровых технологий обработка и стилизация изображений становится всё более востребованной задачей. Пользователи социальных сетей, дизайнеры, маркетологи и обычные люди стремятся делать свои изображения более привлекательными и художественными. Однако профессиональные навыки обработки изображений требуют значительного времени для освоения, а коммерческие программы для редактирования фото часто сложны в использовании и имеют высокую стоимость.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Проект «Редактор изображений с применением AI-стилизации» призван решить эту проблему, предоставляя пользователям простой и интуитивно понятный инструмент для художественной стилизации изображений с использованием технологий искусственного интеллекта. Искусственный интеллект берет на себя сложную работу по анализу и трансформации изображений, позволяя пользователям без специальных навыков получать высококачественные стилизованные результаты.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Данный проект представляет собой кроссплатформенное веб-приложение, которое позволяет загружать изображения, применять к ним различные художественные стили, и сохранять или делиться результатами. Интерфейс приложения разработан с учетом современных стандартов UX/UI дизайна, обеспечивая максимальное удобство для пользователей с разным уровнем подготовки.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Новая страница
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),
        
        // Глава 1
        new Paragraph({
          text: "1 ОПИСАНИЕ ПРОЕКТА",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        
        // Глава 1.1
        new Paragraph({
          text: "1.1 Техническое задание",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Целью данного проекта является разработка веб-приложения для стилизации изображений с использованием технологий искусственного интеллекта, обладающего следующими характеристиками:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Интуитивно понятный пользовательский интерфейс, доступный для пользователей без специальных навыков в области дизайна и обработки изображений;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Возможность загрузки изображений в различных форматах (JPEG, PNG, GIF, WEBP);",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Набор готовых художественных стилей, вдохновленных работами известных художников (Ван Гог, Пикассо, Кандинский и др.);",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Глава 1.2
        new Paragraph({
          text: "1.2 Функциональность системы",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Разрабатываемое приложение для редактирования изображений предоставляет следующую функциональность:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "1. Управление изображениями:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Загрузка изображений с локального устройства через интерфейс drag-and-drop или стандартный диалог выбора файла;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Просмотр и предварительная обработка изображений перед применением стилей;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Новая страница
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),
        
        // Глава 2
        new Paragraph({
          text: "2 ОПИСАНИЕ ИНСТРУМЕНТАРИЯ И ЕГО ОБОСНОВАНИЕ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        
        // Глава 2.1
        new Paragraph({
          text: "2.1 Выбор языка программирования",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Для разработки веб-приложения «Редактор изображений с применением AI-стилизации» был выбран язык программирования TypeScript для фронтенда, JavaScript (Node.js) для бэкенда и Python для реализации алгоритмов стилизации изображений с использованием искусственного интеллекта.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Глава 3
        new Paragraph({
          text: "3 ОПИСАНИЕ РЕАЛИЗАЦИИ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        
        // Заключение
        new Paragraph({
          text: "ЗАКЛЮЧЕНИЕ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "В результате выполнения проекта было разработано веб-приложение «Редактор изображений с применением AI-стилизации», которое позволяет пользователям без специальной подготовки создавать художественно стилизованные изображения с использованием технологий искусственного интеллекта.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Список литературы
        new Paragraph({
          text: "СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "1. Goodfellow I., Bengio Y., Courville A. Deep Learning. — MIT Press, 2016. — 800 p.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "2. Gatys L. A., Ecker A. S., Bethge M. Image Style Transfer Using Convolutional Neural Networks // Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition. — 2016. — P. 2414-2423.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "3. React Documentation [Электронный ресурс]. — URL: https://reactjs.org/docs/getting-started.html (дата обращения: 30.03.2025).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
      ]
    }]
  });

  // Сохраняем документ
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Документ успешно создан: ${outputPath}`);
}

// Выполнение
async function runExample() {
  const outputPath = './fixed-project-description.docx';
  
  // Создаем документ
  await createSimpleDocx(outputPath);
}

runExample().catch(console.error);