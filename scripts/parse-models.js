const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

function parseHTMLModels() {
  try {
    const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'cursor-models.html'), 'utf8');

    // Регулярное выражение для поиска моделей в HTML
    const modelRegex = /<span[^>]*>([^<]+?)<\/span>/g;
    const maxOnlyRegex = /MAX Only/g;

    const models = [];
    let match;
    let currentIndex = 0;

    while ((match = modelRegex.exec(htmlContent)) !== null) {
      const modelName = match[1].trim();

      // Пропускаем дубликаты и системные элементы
      if (!modelName ||
          modelName === 'Add or search model' ||
          modelName.includes('MAX Only') ||
          models.some(m => m.name === modelName)) {
        continue;
      }

      // Определяем, является ли модель премиум (MAX Only)
      const isPremium = htmlContent.substring(currentIndex, match.index).includes('MAX Only');

      // Все модели из HTML файла доступны в Cursor
      const isAvailableInCursor = true;

      // Определяем провайдера по названию модели
      let provider = 'Unknown';
      let category = 'chat';
      let isFree = false; // По умолчанию все модели платные

      if (modelName.includes('claude')) {
        provider = 'Anthropic';
        category = 'coding';
        // Claude модели платные, кроме некоторых старых версий
        isFree = false;
      } else if (modelName.includes('gpt')) {
        provider = 'OpenAI';
        category = 'coding';
        // GPT модели платные
        isFree = false;
      } else if (modelName.includes('gemini')) {
        provider = 'Google';
        category = 'coding';
        // Gemini модели платные
        isFree = false;
      } else if (modelName.includes('deepseek')) {
        provider = 'DeepSeek';
        category = 'coding';
        // DeepSeek имеет бесплатные модели
        isFree = true;
      } else if (modelName.includes('grok')) {
        provider = 'xAI';
        category = 'coding';
        // Grok модели платные
        isFree = false;
      } else if (modelName.includes('kimi')) {
        provider = 'Kimi';
        category = 'coding';
        // Kimi модели платные
        isFree = false;
      } else if (modelName.includes('cursor')) {
        provider = 'Cursor';
        category = 'coding';
        // Cursor модели платные
        isFree = false;
      } else if (modelName.includes('o1') || modelName.includes('o3') || modelName.includes('o4')) {
        provider = 'OpenAI';
        category = 'reasoning';
        // o1, o3, o4 - платные модели
        isFree = false;
      } else if (modelName.includes('mistral')) {
        provider = 'Mistral';
        category = 'coding';
        // Mistral модели платные
        isFree = false;
      } else if (modelName.includes('llama')) {
        provider = 'Meta';
        category = 'coding';
        // Llama модели платные
        isFree = false;
      }

      // Если модель помечена как MAX Only, она точно не бесплатная
      if (isPremium) {
        isFree = false;
      }

      const model = {
        name: modelName,
        displayName: modelName,
        modelId: modelName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        provider: provider,
        category: category,
        isFree: isFree,
        isRecommended: false, // Убрана логика recommended
        isAvailableInCursor: isAvailableInCursor,
        description: `${category === 'coding' ? 'Модель для программирования' : 'Универсальная модель ИИ'} от ${provider}${isFree ? ' (бесплатная)' : ''}`,
        capabilities: JSON.stringify([
          category === 'coding' ? 'code_generation' : 'text_generation',
          'analysis',
          'problem_solving'
        ])
      };

      models.push(model);
      currentIndex = match.index + match[0].length;
    }

    console.log(`Найдено ${models.length} моделей для импорта`);
    return models;

  } catch (error) {
    console.error('Ошибка при парсинге HTML:', error);
    return [];
  }
}

async function importModelsToDatabase(models) {
  console.log('Начинаем импорт моделей в базу данных...');

  let imported = 0;
  let skipped = 0;

  for (const model of models) {
    try {
      // Проверяем, существует ли уже модель
      const existing = await prisma.aIModel.findUnique({
        where: { modelId: model.modelId }
      });

      if (existing) {
        console.log(`Модель ${model.name} уже существует, пропускаем`);
        skipped++;
        continue;
      }

      // Создаем новую модель
      await prisma.aIModel.create({
        data: model
      });

      console.log(`✅ Импортирована модель: ${model.name}`);
      imported++;

    } catch (error) {
      console.error(`❌ Ошибка при импорте ${model.name}:`, error.message);
    }
  }

  console.log(`\n📊 Результаты импорта:`);
  console.log(`✅ Импортировано: ${imported}`);
  console.log(`⏭️ Пропущено: ${skipped}`);
  console.log(`📈 Всего обработано: ${models.length}`);
}

async function main() {
  try {
    console.log('🚀 Начинаем парсинг моделей из HTML...');

    // Парсим модели из HTML
    const models = parseHTMLModels();

    if (models.length === 0) {
      console.log('❌ Модели не найдены в HTML файле');
      return;
    }

    // Выводим найденные модели для проверки
    console.log('\n📋 Найденные модели:');
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (${model.provider}) - ${model.isFree ? 'Бесплатная' : 'Премиум'}`);
    });

    // Импортируем в базу данных
    await importModelsToDatabase(models);

    console.log('\n🎉 Парсинг и импорт завершены успешно!');

  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
if (require.main === module) {
  main();
}

module.exports = { parseHTMLModels, importModelsToDatabase };
