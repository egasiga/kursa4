import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as fs from 'fs';

async function createBasicDoc() {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun("2 Описание инструментария и его обоснования"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("2.1 Выбор языка программирования"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("В наше время существует множество различных языков программирования, и перед созданием приложения программист должен проанализировать, какой язык подойдет для реализации функционала приложения. Для проекта редактора изображений с AI-стилизацией были рассмотрены следующие языки и технологии:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("TypeScript и JavaScript - языки программирования, используемые для создания веб-приложений. TypeScript является надмножеством JavaScript, предоставляющим дополнительные возможности статической типизации, что делает разработку крупных приложений более безопасной и структурированной."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Особенности языков программирования:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("TypeScript обеспечивает статическую типизацию, что позволяет обнаруживать ошибки на этапе компиляции, а не во время выполнения."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("JavaScript является основным языком для веб-разработки, что обеспечивает интеграцию с большинством современных веб-технологий."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Node.js - серверная платформа для JavaScript, которая позволяет создавать быстрые и масштабируемые сетевые приложения. Она использует событийно-ориентированную архитектуру и асинхронный ввод/вывод для оптимизации пропускной способности и масштабируемости."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Python - высокоуровневый интерпретируемый язык программирования с простым синтаксисом, широко используемый в машинном обучении и обработке изображений благодаря богатой экосистеме библиотек для AI и компьютерного зрения."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Особенности языка программирования:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Низкий порог вхождения. Синтаксис Python понятный и читаемый, что упрощает разработку и поддержку кода."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Богатая экосистема библиотек для машинного обучения и обработки изображений, таких как TensorFlow, PyTorch, PIL, NumPy и др."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Проведя анализ популярных языков программирования, для реализации проекта редактора изображений с AI-стилизацией был выбран следующий стек технологий:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("1. TypeScript и React для фронтенд-части приложения, что обеспечивает типобезопасность, современную архитектуру и высокую производительность пользовательского интерфейса."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("2. Node.js и Express для серверной части, что позволяет создать быстрый и производительный API для обработки запросов клиентской части."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("3. Python для модуля AI-стилизации изображений, что позволяет использовать передовые библиотеки машинного обучения и компьютерного зрения для создания качественных художественных эффектов."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("2.2 Выбор среды разработки"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Неотъемлемой частью написания программного обеспечения является выбор среды разработки. IDE позволяет не только упрощать работу написания кода, но и позволяет следить за новыми тенденциями в сфере программирования."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Visual Studio Code - легковесный, но мощный редактор кода, который работает на всех основных операционных системах. Он предоставляет встроенную поддержку для JavaScript, TypeScript и Node.js, а также имеет богатую экосистему расширений для поддержки других языков и фреймворков."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Особенности VS Code:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Интеграция с Git и другими системами контроля версий."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Отладка кода прямо в редакторе."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Поддержка IntelliSense для автодополнения кода и предложений."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Встроенный терминал для выполнения команд."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Расширяемость через многочисленные плагины и расширения."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("2.3 Выбор библиотек и фреймворков"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Для разработки проекта были выбраны следующие библиотеки и фреймворки:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Фронтенд:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- React: библиотека JavaScript для создания пользовательских интерфейсов с компонентным подходом."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- TailwindCSS: утилитарный CSS-фреймворк для быстрого создания адаптивных интерфейсов."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- ShadcnUI: набор компонентов пользовательского интерфейса, основанный на Radix UI и стилизованный с помощью TailwindCSS."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- React-Dropzone: библиотека для удобной загрузки файлов методом drag-and-drop."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- TanStack Query: библиотека для управления серверным состоянием и асинхронными запросами."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Бэкенд:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Express: минималистичный веб-фреймворк для Node.js."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Drizzle ORM: современная ORM-библиотека для TypeScript с типизацией."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Sharp: высокопроизводительная библиотека для обработки изображений в Node.js."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("AI-стилизация:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- PIL (Python Imaging Library): библиотека для работы с изображениями в Python."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- NumPy: библиотека для научных вычислений с поддержкой многомерных массивов."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- TensorFlow: открытая библиотека машинного обучения для создания нейронных сетей."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("3 Описание реализации проекта"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("3.1 Архитектура приложения"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Архитектура приложения редактора изображений с AI-стилизацией построена по принципу клиент-серверного взаимодействия и состоит из трех основных компонентов:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("1. Клиентская часть (фронтенд) - отвечает за пользовательский интерфейс, загрузку и предварительную обработку изображений, а также отображение результатов стилизации."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("2. Серверная часть (бэкенд) - обрабатывает запросы от клиента, управляет хранением данных и координирует процесс стилизации изображений."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("3. Модуль AI-стилизации - реализует алгоритмы преобразования изображений с использованием технологий искусственного интеллекта."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("3.2 Пользовательский интерфейс"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Пользовательский интерфейс приложения разработан с учетом принципов UX/UI дизайна и включает следующие основные элементы:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Главная страница с описанием возможностей приложения и быстрым доступом к основным функциям."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Страница редактора изображений с интерфейсом загрузки файлов, выбора стилей и предпросмотра результатов."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Галерея стилей с примерами различных художественных эффектов."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Раздел \"Мои проекты\" для сохранения и управления обработанными изображениями."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Интерфейс полностью переведен на русский язык и адаптирован для различных устройств, от мобильных телефонов до настольных компьютеров."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("3.3 Модуль стилизации изображений"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Для стилизации изображений в проекте реализовано два подхода:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("1. Использование библиотеки PIL (Python Imaging Library) для создания базовых эффектов стилизации через комбинацию фильтров, корректировок цвета, яркости, контрастности и других параметров изображения."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("2. Применение нейронных сетей (модель Google Magenta на базе TensorFlow) для продвинутой художественной стилизации изображений в духе известных художников."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Модуль стилизации обеспечивает высокое качество обработки изображений с сохранением разрешения до 1024 пикселей и поддерживает различные форматы файлов (JPEG, PNG, GIF, WEBP)."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("4 Заключение"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("В результате выполнения проекта было разработано веб-приложение \"Редактор изображений с AI-стилизацией\", которое предоставляет пользователям удобный инструмент для художественной обработки изображений с использованием технологий искусственного интеллекта."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Основные достижения проекта:"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Разработан интуитивно понятный пользовательский интерфейс на русском языке."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Реализована функциональность загрузки и обработки изображений с высоким качеством."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Создан набор художественных стилей, вдохновленных работами известных художников."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("- Обеспечена возможность сохранения и управления обработанными изображениями."),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(""),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Приложение удовлетворяет всем требованиям технического задания и может быть использовано широкой аудиторией для создания художественно стилизованных изображений без необходимости специальных навыков в области дизайна и обработки фотографий."),
                        ],
                    }),
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync('project-doc.docx', buffer);
    console.log('Документ успешно создан!');
}

createBasicDoc().catch(err => console.error(err));