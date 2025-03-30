import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import * as fs from 'fs';
import * as mammoth from 'mammoth';

// Пример создания DOCX файла
async function createDocxFile(outputPath: string): Promise<void> {
  // Создаем новый документ
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'Пример DOCX документа',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun('Это документ, созданный с помощью библиотеки '),
            new TextRun({
              text: 'docx',
              bold: true
            }),
            new TextRun(' в Node.js.')
          ]
        }),
        new Paragraph({
          text: 'Можно добавлять различные элементы форматирования:',
          spacing: {
            before: 200,
            after: 200
          }
        }),
        new Paragraph({
          bullet: {
            level: 0
          },
          text: 'Маркированные списки'
        }),
        new Paragraph({
          bullet: {
            level: 0
          },
          text: 'Форматирование текста (жирный, курсив, подчеркнутый)'
        }),
        new Paragraph({
          bullet: {
            level: 0
          },
          text: 'Таблицы, изображения и многое другое'
        }),
        new Paragraph({
          text: 'Текст приложения Редактор изображений',
          spacing: {
            before: 400
          },
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph({
          text: 'Создавайте потрясающие мемы и коллажи с помощью стилей на основе ИИ за считанные минуты. Опыт дизайна не требуется.',
          spacing: {
            before: 200
          }
        })
      ]
    }]
  });

  // Сохраняем документ
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Документ успешно создан: ${outputPath}`);
}

// Пример чтения DOCX файла
async function readDocxFile(filePath: string): Promise<void> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    console.log("Содержимое документа:");
    console.log(result.value);
    
    // Если нужно конвертировать в HTML
    const htmlResult = await mammoth.convertToHtml({ path: filePath });
    console.log("\nHTML версия:");
    console.log(htmlResult.value);
  } catch (error) {
    console.error("Ошибка при чтении документа:", error);
  }
}

// Выполнение примеров
async function runExamples() {
  const outputPath = './example-document.docx';
  
  // Создаем документ
  await createDocxFile(outputPath);
  
  // Читаем созданный документ
  console.log("\n--- Чтение созданного документа ---");
  await readDocxFile(outputPath);
}

runExamples().catch(console.error);