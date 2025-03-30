import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import * as fs from 'fs';

async function createProjectDescription(outputPath: string): Promise<void> {
  // Создаем новый документ
  const doc = new Document({
    sections: [{
      children: [
        // Титульный лист
        new Paragraph({
          text: "ПОЯСНИТЕЛЬНАЯ ЗАПИСКА",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 3000,
            after: 240,
          }
        }),
        new Paragraph({
          text: "к проекту «Редактор изображений с применением AI-стилизации»",
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 6000,
          }
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: {
            after: 240,
          },
          children: [
            new TextRun("Выполнил: Студент"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: {
            after: 240,
          },
          children: [
            new TextRun("Проверил: Преподаватель"),
          ]
        }),
        
        // Конец первой страницы
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
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("ВВЕДЕНИЕ"),
            new TextRun("................................................................................................................"),
            new TextRun("3"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("1 ОПИСАНИЕ ПРОЕКТА"),
            new TextRun("........................................................................................"),
            new TextRun("4"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("   1.1 Техническое задание"),
            new TextRun(".................................................................................."),
            new TextRun("4"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("   1.2 Функциональность системы"),
            new TextRun("......................................................................"),
            new TextRun("5"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("2 ОПИСАНИЕ ИНСТРУМЕНТАРИЯ И ЕГО ОБОСНОВАНИЕ"),
            new TextRun("................................"),
            new TextRun("7"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("   2.1 Выбор языка программирования"),
            new TextRun(".................................................................."),
            new TextRun("7"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("   2.2 Выбор среды разработки"),
            new TextRun("..........................................................................."),
            new TextRun("11"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("   2.3 Выбор библиотек и фреймворков"),
            new TextRun("................................................................"),
            new TextRun("12"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("3 ОПИСАНИЕ РЕАЛИЗАЦИИ"),
            new TextRun("................................................................................"),
            new TextRun("14"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("   3.1 Архитектура приложения"),
            new TextRun("............................................................................"),
            new TextRun("14"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("   3.2 Описание пользовательского интерфейса"),
            new TextRun("..................................................."),
            new TextRun("16"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("ЗАКЛЮЧЕНИЕ"),
            new TextRun("........................................................................................................."),
            new TextRun("20"),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun("СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ"),
            new TextRun("........................................................"),
            new TextRun("21"),
          ]
        }),
        
        // Конец страницы содержания
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
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "В современную эпоху цифровых технологий обработка и стилизация изображений становится всё более востребованной задачей. Пользователи социальных сетей, дизайнеры, маркетологи и обычные люди стремятся делать свои изображения более привлекательными и художественными. Однако профессиональные навыки обработки изображений требуют значительного времени для освоения, а коммерческие программы для редактирования фото часто сложны в использовании и имеют высокую стоимость.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Проект «Редактор изображений с применением AI-стилизации» призван решить эту проблему, предоставляя пользователям простой и интуитивно понятный инструмент для художественной стилизации изображений с использованием технологий искусственного интеллекта. Искусственный интеллект берет на себя сложную работу по анализу и трансформации изображений, позволяя пользователям без специальных навыков получать высококачественные стилизованные результаты.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Данный проект представляет собой кроссплатформенное веб-приложение, которое позволяет загружать изображения, применять к ним различные художественные стили, и сохранять или делиться результатами. Интерфейс приложения разработан с учетом современных стандартов UX/UI дизайна, обеспечивая максимальное удобство для пользователей с разным уровнем подготовки.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 0,
          },
          children: [
            new TextRun({
              text: "Актуальность проекта обусловлена растущим спросом на инструменты обработки изображений в условиях цифровизации коммуникаций и развития социальных сетей, где визуальный контент играет ключевую роль в привлечении внимания аудитории. Использование технологий AI позволяет существенно упростить процесс создания привлекательного визуального контента и сделать его доступным для широкой аудитории.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Конец страницы введения
        new Paragraph({
          text: "",
          pageBreakBefore: true,
        }),
        
        // Раздел 1
        new Paragraph({
          text: "1 ОПИСАНИЕ ПРОЕКТА",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        
        // Раздел 1.1
        new Paragraph({
          text: "1.1 Техническое задание",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Целью данного проекта является разработка веб-приложения для стилизации изображений с использованием технологий искусственного интеллекта, обладающего следующими характеристиками:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
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
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
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
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
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
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Возможность сохранения и экспорта обработанных изображений в различных форматах с сохранением высокого качества;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Возможность быстрого доступа к ранее обработанным изображениям;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Поддержка русского языка интерфейса;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Кроссплатформенность и адаптивный дизайн для корректного отображения на различных устройствах.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 0,
          },
          children: [
            new TextRun({
              text: "Технические требования к аппаратному и программному обеспечению:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Функционирование в современных браузерах (Chrome, Firefox, Safari, Edge);",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Серверная часть с достаточной производительностью для обработки изображений в реальном времени;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Оптимизация для работы на устройствах с различной производительностью;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Отказоустойчивость и защита от потери данных.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Раздел 1.2
        new Paragraph({
          text: "1.2 Функциональность системы",
          heading: HeadingLevel.HEADING_2,
          pageBreakBefore: true,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Разрабатываемое приложение для редактирования изображений предоставляет следующую функциональность:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
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
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
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
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
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
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Сохранение обработанных изображений в различных форматах с оптимизацией качества;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Возможность поделиться обработанными изображениями напрямую в социальных сетях.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "2. Применение AI-стилей:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Выбор из предустановленных художественных стилей, основанных на работах известных художников;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Предварительный просмотр эффекта применения стиля перед финальной обработкой;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Быстрое переключение между различными стилями для сравнения результатов;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Сохранение оригинального изображения с возможностью возврата к нему в любой момент.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "3. Дополнительные функции редактирования:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Добавление текста с различными шрифтами и стилями;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Базовая коррекция яркости, контрастности и насыщенности;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Создание простых коллажей из нескольких изображений;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Инструменты для кадрирования и изменения размера изображений.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "4. Управление проектами:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Автоматическое сохранение истории редактирования для возможности отмены действий;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Организация обработанных изображений в виде галереи проектов;",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Возможность возвращения к предыдущим проектам для продолжения работы.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Раздел 2
        new Paragraph({
          text: "2 ОПИСАНИЕ ИНСТРУМЕНТАРИЯ И ЕГО ОБОСНОВАНИЕ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        
        // Раздел 2.1
        new Paragraph({
          text: "2.1 Выбор языка программирования",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Для разработки веб-приложения «Редактор изображений с применением AI-стилизации» был выбран язык программирования TypeScript для фронтенда, JavaScript (Node.js) для бэкенда и Python для реализации алгоритмов стилизации изображений с использованием искусственного интеллекта.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "TypeScript (фронтенд):",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Статическая типизация. TypeScript добавляет строгую типизацию в JavaScript, что позволяет обнаруживать многие ошибки на этапе компиляции, а не во время выполнения. Это особенно важно для проекта с большим количеством данных и сложной логикой обработки изображений.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Поддержка современных возможностей JavaScript. TypeScript включает все возможности современного JavaScript, одновременно обеспечивая совместимость с более старыми браузерами после компиляции.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Улучшенная поддержка IDE и инструментов разработки. Благодаря статической типизации, IDE могут предоставлять более точное автодополнение и подсказки, что ускоряет процесс разработки и упрощает рефакторинг.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Высокая совместимость с популярными фреймворками для фронтенд-разработки, такими как React, которые используются в проекте.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "JavaScript/Node.js (бэкенд):",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Асинхронное программирование. Node.js отлично подходит для обработки многочисленных одновременных запросов, что идеально для веб-приложения с обработкой изображений, где несколько пользователей могут одновременно загружать и обрабатывать файлы.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Единый язык для фронтенд и бэкенд разработки. Использование JavaScript/TypeScript на обеих сторонах позволяет повторно использовать код и типы, упрощает коммуникацию между клиентской и серверной частями приложения.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Богатая экосистема пакетов NPM, включая библиотеки для обработки изображений, которые можно использовать для базовых операций редактирования.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Хорошая интеграция с другими языками и технологиями через дочерние процессы, что позволяет легко интегрировать Python для AI-стилизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Python (AI-обработка):",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Богатая экосистема библиотек для машинного обучения и обработки изображений. Python является стандартом для разработки AI-приложений благодаря таким библиотекам как TensorFlow, PyTorch и библиотекам компьютерного зрения, как OpenCV.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Простота интеграции с предварительно обученными моделями. Python позволяет легко интегрировать готовые модели для трансформации стиля изображений, такие как модели из TensorFlow Hub.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Высокая производительность для научных вычислений. Библиотеки для работы с массивами данных, такие как NumPy, оптимизированы для работы с изображениями и матричными операциями, необходимыми для AI-стилизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Поддержка модели Google Magenta для трансформации стиля изображений, которая является одной из наиболее эффективных для задач художественной стилизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Раздел 2.2
        new Paragraph({
          text: "2.2 Выбор среды разработки",
          heading: HeadingLevel.HEADING_2,
          pageBreakBefore: true,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Для разработки проекта были выбраны следующие среды разработки и инструменты:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Visual Studio Code:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Кросс-платформенность. VS Code доступен на всех основных операционных системах, что обеспечивает согласованность среды разработки для всех членов команды.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Поддержка TypeScript. Встроенная поддержка TypeScript с функциями автодополнения, проверки типов и подсветки синтаксиса.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Расширяемость. Богатая экосистема расширений для поддержки различных языков программирования, инструментов и фреймворков, используемых в проекте.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Встроенные средства отладки для Node.js и возможность установки расширений для отладки Python.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Интеграция с Git для контроля версий, что упрощает совместную работу над проектом.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "PyCharm (для разработки модуля AI-стилизации):",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Специализированная среда разработки для Python с расширенной поддержкой для научных вычислений и машинного обучения.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Интеграция с популярными библиотеками машинного обучения, включая TensorFlow и PyTorch.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Удобные инструменты для отладки и профилирования Python-кода, что критически важно для оптимизации производительности алгоритмов стилизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Поддержка виртуальных окружений Python для изоляции зависимостей проекта.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Раздел 2.3
        new Paragraph({
          text: "2.3 Выбор библиотек и фреймворков",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Для реализации проекта были выбраны следующие библиотеки и фреймворки:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Фронтенд:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "React - JavaScript-библиотека для создания пользовательских интерфейсов. Компонентный подход React позволяет создавать сложные интерфейсы из небольших изолированных частей кода.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "TailwindCSS - утилитарный CSS-фреймворк, который позволяет быстро создавать адаптивные и кастомизированные интерфейсы без написания большого количества CSS-кода.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "ShadcnUI - набор компонентов пользовательского интерфейса, основанный на Radix UI и стилизованный с помощью TailwindCSS, обеспечивающий доступные и легко настраиваемые UI-компоненты.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "React-Dropzone - библиотека для удобной загрузки файлов методом drag-and-drop.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "React-Hook-Form - библиотека для управления формами с поддержкой валидации и оптимизацией производительности.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "TanStack Query (React Query) - библиотека для управления серверным состоянием, кэширования данных и асинхронных запросов.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Бэкенд:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Express - минималистичный и гибкий веб-фреймворк для Node.js, предоставляющий надежную функциональность для веб-приложений.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Drizzle ORM - современная ORM-библиотека для TypeScript с поддержкой типизации и миграций баз данных.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Sharp - высокопроизводительная библиотека для обработки изображений в Node.js.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Zod - библиотека для валидации схем данных с поддержкой типизации TypeScript.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "AI-стилизация:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "TensorFlow - открытая программная библиотека для машинного обучения, разработанная Google, используемая для создания и обучения моделей глубокого обучения.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "TensorFlow Hub - библиотека для повторного использования предварительно обученных моделей. В проекте используется модель arbitrary-image-stylization-v1-256 из Google Magenta для трансформации стиля изображений.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "NumPy - библиотека для научных вычислений с Python, предоставляющая эффективные структуры данных для работы с многомерными массивами и матрицами.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Pillow (PIL) - библиотека для работы с изображениями в Python, используемая для загрузки, изменения размера и сохранения изображений с высоким качеством.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Раздел 3
        new Paragraph({
          text: "3 ОПИСАНИЕ РЕАЛИЗАЦИИ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        
        // Раздел 3.1
        new Paragraph({
          text: "3.1 Архитектура приложения",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Приложение «Редактор изображений с применением AI-стилизации» построено на основе клиент-серверной архитектуры с распределением ответственности между фронтендом, бэкендом и AI-модулем стилизации. Общая архитектура приложения представлена следующими компонентами:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Клиентская часть (фронтенд):",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Компоненты пользовательского интерфейса, построенные с использованием React и ShadcnUI.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Модуль загрузки изображений с использованием React-Dropzone для обработки пользовательских файлов.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Модуль предварительного просмотра и редактирования изображений с использованием Canvas API для манипуляций с изображениями на стороне клиента.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Модуль выбора и предварительного просмотра стилей с возможностью быстрого переключения между различными вариантами.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Сервисный слой для коммуникации с API бэкенда, реализованный с использованием TanStack Query для управления асинхронными запросами и кэширования данных.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Серверная часть (бэкенд):",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "API-сервер на базе Express.js для обработки запросов от клиента и маршрутизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Модуль управления файлами для временного хранения загруженных и обработанных изображений.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Слой хранения данных с использованием Drizzle ORM для управления информацией о шаблонах, стилях и сохраненных пользовательских проектах.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Модуль интеграции с Python-скриптами для AI-стилизации изображений, реализованный через межпроцессное взаимодействие.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Модуль AI-стилизации (Python):",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Скрипт загрузки и обработки изображений с использованием библиотеки PIL/Pillow для базовых манипуляций с изображениями.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Интеграция с TensorFlow и TensorFlow Hub для загрузки предварительно обученной модели для трансформации стиля.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Модуль применения стиля с использованием модели Google Magenta для переноса стиля с одного изображения на другое.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Модуль оптимизации качества изображения для сохранения высокого разрешения при стилизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Раздел 3.2
        new Paragraph({
          text: "3.2 Описание пользовательского интерфейса",
          heading: HeadingLevel.HEADING_2,
          pageBreakBefore: true,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Пользовательский интерфейс приложения «Редактор изображений с применением AI-стилизации» разработан с учетом принципов UX/UI дизайна и направлен на обеспечение интуитивно понятного взаимодействия пользователя с системой. Интерфейс состоит из следующих основных экранов и компонентов:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Главная страница:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Приветственный баннер с кратким описанием возможностей приложения и призывом к действию.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Карточки с основными функциями приложения (Редактор изображений, Генератор мемов, Создание коллажей) с краткими описаниями и кнопками перехода.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Галерея примеров работ, созданных с помощью приложения, демонстрирующая возможности AI-стилизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Секция с шаблонами для быстрого старта работы.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Страница редактора изображений:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Вкладки «Загрузка» и «Редактирование» для разделения процесса работы на логические этапы.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Область загрузки с поддержкой drag-and-drop для удобной загрузки изображений.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Основная рабочая область с предпросмотром изображения и панелью инструментов для базового редактирования.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Панель выбора стилей с превью эффектов и возможностью предпросмотра результата применения каждого стиля.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Кнопки для применения выбранного стиля, возврата к оригинальному изображению, сохранения результата и публикации в социальных сетях.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Индикатор прогресса обработки для информирования пользователя о статусе процесса стилизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Технические особенности интерфейса:",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Адаптивный дизайн, обеспечивающий корректное отображение на устройствах с различными размерами экрана.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Темная цветовая схема для основных элементов интерфейса (навигационная панель, карточки) для снижения утомляемости при длительной работе.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Высококонтрастное оформление текста для обеспечения читаемости (белый текст на темном фоне, темный текст на светлом фоне).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Интерактивные элементы с визуальной обратной связью (hover-эффекты, анимации переходов) для улучшения пользовательского опыта.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Система уведомлений для информирования пользователя о результатах операций и возможных ошибках.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Полностью русифицированный интерфейс с учетом особенностей локализации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Заключение
        new Paragraph({
          text: "ЗАКЛЮЧЕНИЕ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "В результате выполнения проекта было разработано веб-приложение «Редактор изображений с применением AI-стилизации», которое позволяет пользователям без специальной подготовки создавать художественно стилизованные изображения с использованием технологий искусственного интеллекта.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "В ходе работы над проектом были решены следующие задачи:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Разработан интуитивно понятный пользовательский интерфейс с адаптивным дизайном, обеспечивающий удобство использования на различных устройствах.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Реализована система загрузки и обработки изображений с поддержкой различных форматов и сохранением высокого качества.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Интегрирована технология AI-стилизации на основе модели Google Magenta для художественной обработки изображений.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Создан набор предустановленных стилей, вдохновленных работами известных художников, с возможностью предварительного просмотра и сравнения результатов.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Реализованы дополнительные функции редактирования, включая добавление текста, базовую коррекцию параметров изображения и создание коллажей.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Обеспечена возможность сохранения результатов, публикации в социальных сетях и организации работы в виде проектов.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Основные технические особенности и преимущества разработанного приложения:",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Кроссплатформенность и доступность через веб-браузер без необходимости установки дополнительного программного обеспечения.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Высокая производительность обработки изображений благодаря оптимизации алгоритмов и использованию современных библиотек.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Сохранение высокого качества и разрешения изображений при стилизации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          bullet: {
            level: 0,
          },
          children: [
            new TextRun({
              text: "Полностью русифицированный интерфейс с учетом особенностей локализации.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 240,
          },
          children: [
            new TextRun({
              text: "Разработанное приложение может найти применение в различных областях, включая социальные медиа, дизайн, маркетинг, образование и личное творчество. Оно предоставляет пользователям без специальных навыков доступ к передовым технологиям обработки изображений, расширяя возможности для самовыражения и креативных экспериментов.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 0,
          },
          children: [
            new TextRun({
              text: "В перспективе планируется дальнейшее развитие проекта с добавлением новых художественных стилей, расширением функциональности редактирования, интеграцией дополнительных AI-технологий для улучшения качества изображений и оптимизацией производительности обработки для еще более быстрой работы с высокоразрешающими изображениями.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        
        // Список использованных источников
        new Paragraph({
          text: "СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "1. Goodfellow I., Bengio Y., Courville A. Deep Learning. — MIT Press, 2016. — 800 p.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "2. Gatys L. A., Ecker A. S., Bethge M. Image Style Transfer Using Convolutional Neural Networks // Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition. — 2016. — P. 2414-2423.",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "3. React Documentation [Электронный ресурс]. — URL: https://reactjs.org/docs/getting-started.html (дата обращения: 30.03.2025).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "4. TypeScript Documentation [Электронный ресурс]. — URL: https://www.typescriptlang.org/docs/ (дата обращения: 30.03.2025).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "5. TensorFlow Hub [Электронный ресурс]. — URL: https://www.tensorflow.org/hub (дата обращения: 30.03.2025).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "6. Google Magenta: Arbitrary Image Stylization [Электронный ресурс]. — URL: https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2 (дата обращения: 30.03.2025).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "7. Express.js Documentation [Электронный ресурс]. — URL: https://expressjs.com/ru/ (дата обращения: 30.03.2025).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "8. TailwindCSS Documentation [Электронный ресурс]. — URL: https://tailwindcss.com/docs (дата обращения: 30.03.2025).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 120,
          },
          children: [
            new TextRun({
              text: "9. Sharp Documentation [Электронный ресурс]. — URL: https://sharp.pixelplumbing.com/ (дата обращения: 30.03.2025).",
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            line: 360, // 1.5 интервал
            before: 0,
            after: 0,
          },
          children: [
            new TextRun({
              text: "10. Pillow (PIL) Documentation [Электронный ресурс]. — URL: https://pillow.readthedocs.io/ (дата обращения: 30.03.2025).",
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

// Выполнение примеров
async function runExample() {
  const outputPath = './project-description.docx';
  
  // Создаем документ
  await createProjectDescription(outputPath);
}

runExample().catch(console.error);