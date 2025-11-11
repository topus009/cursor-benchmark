const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function parseCursorTables() {
  try {
    console.log('🔄 Начинаем парсинг таблиц из cursor-tables.html...');

    const htmlPath = path.join(__dirname, '..', 'cursor-tables.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    const models = [];
    const pricing = {};

    // Парсим первую таблицу (модели)
    const modelTableRegex = /<table>[\s\S]*?<thead>[\s\S]*?<\/thead>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/g;
    const modelTableMatch = modelTableRegex.exec(htmlContent);

    if (modelTableMatch) {
      const tbodyContent = modelTableMatch[1];
      const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
      let rowMatch;

      while ((rowMatch = rowRegex.exec(tbodyContent)) !== null) {
        const rowContent = rowMatch[1];
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        const cells = [];
        let cellMatch;

        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
          cells.push(cellMatch[1].trim());
        }

        if (cells.length >= 4) {
          const nameCell = cells[0];
          const defaultContext = cells[1];
          const maxContext = cells[2];
          const capabilities = cells[3];

          // Извлекаем чистое имя модели
          const nameMatch = nameCell.match(/<\/span>([^<]+)/);
          const modelName = nameMatch ? nameMatch[1].trim() : nameCell.replace(/<[^>]+>/g, '').trim();

          // Определяем провайдера
          let provider = 'Unknown';
          if (nameCell.includes('provider-anthropic')) provider = 'Anthropic';
          else if (nameCell.includes('provider-openai')) provider = 'OpenAI';
          else if (nameCell.includes('provider-google')) provider = 'Google';
          else if (nameCell.includes('provider-deepseek')) provider = 'DeepSeek';
          else if (nameCell.includes('provider-xai')) provider = 'xAI';
          else if (nameCell.includes('provider-meta')) provider = 'Meta';
          else if (nameCell.includes('provider-cursor')) provider = 'Cursor';

          // Парсим возможности
          const caps = [];
          const capRegex = /title="([^"]+)"/g;
          let capMatch;
          while ((capMatch = capRegex.exec(capabilities)) !== null) {
            caps.push(capMatch[1]);
          }

          // Парсим контекст
          const parseContext = (ctx) => {
            if (!ctx || ctx === '-') return null;
            if (ctx.includes('M')) return parseFloat(ctx.replace('M', '')) * 1000000;
            if (ctx.includes('k')) return parseFloat(ctx.replace('k', '')) * 1000;
            return parseInt(ctx) || null;
          };

          models.push({
            name: modelName,
            provider,
            defaultContext: parseContext(defaultContext),
            maxContext: parseContext(maxContext),
            capabilities: caps
          });
        }
      }
    }

    // Парсим вторую таблицу (цены)
    const pricingTableRegex = /<table>[\s\S]*?<thead>[\s\S]*?<\/thead>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/g;
    let pricingTableMatch;
    let tableCount = 0;

    while ((pricingTableMatch = pricingTableRegex.exec(htmlContent)) !== null) {
      tableCount++;
      if (tableCount === 2) { // Вторая таблица - цены
        const tbodyContent = pricingTableMatch[1];
        const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(tbodyContent)) !== null) {
          const rowContent = rowMatch[1];
          const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
          const cells = [];
          let cellMatch;

          while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
            cells.push(cellMatch[1].trim());
          }

          if (cells.length >= 5) {
            const nameCell = cells[0];
            const inputPrice = cells[1];
            const cacheWritePrice = cells[2];
            const cacheReadPrice = cells[3];
            const outputPrice = cells[4];

            // Извлекаем чистое имя модели
            const nameMatch = nameCell.match(/<\/span>([^<]+)/);
            const modelName = nameMatch ? nameMatch[1].trim() : nameCell.replace(/<[^>]+>/g, '').trim();

            // Парсим цены
            const parsePrice = (price) => {
              if (!price || price === '$0.00') return 0;
              const match = price.match(/\$([\d.]+)/);
              return match ? parseFloat(match[1]) / 1000000 : null; // Конвертируем в $/токен
            };

            pricing[modelName] = {
              input: parsePrice(inputPrice),
              cacheWrite: parsePrice(cacheWritePrice),
              cacheRead: parsePrice(cacheReadPrice),
              output: parsePrice(outputPrice)
            };
          }
        }
      }
    }

    console.log(`📊 Найдено моделей: ${models.length}`);
    console.log(`💰 Найдено ценовых записей: ${Object.keys(pricing).length}`);

    // Сохраняем в JSON
    const outputData = {
      models,
      pricing,
      parsedAt: new Date().toISOString(),
      source: 'cursor-tables.html'
    };

    const outputPath = path.join(__dirname, '..', 'cursor-tables-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log('✅ Данные сохранены в cursor-tables-data.json');

    return outputData;

  } catch (error) {
    console.error('❌ Ошибка при парсинге таблиц:', error.message);
    throw error;
  }
}

async function updateDatabaseWithTablesData() {
  try {
    console.log('🔄 Начинаем обновление базы данных...');

    const dataPath = path.join(__dirname, '..', 'cursor-tables-data.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Файл cursor-tables-data.json не найден. Запустите парсинг сначала.');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Обновляем модели
    for (const model of data.models) {
      console.log(`🔄 Обрабатываем модель: ${model.name} (${model.provider})`);

      // Создаем modelId
      const modelId = `${model.provider.toLowerCase()}/${model.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

      // Ищем модель в базе
      const existingModel = await prisma.aIModel.findFirst({
        where: {
          OR: [
            { displayName: model.name },
            { modelId: modelId }
          ]
        }
      });

      const updates = {
        modelId,
        displayName: model.name,
        provider: model.provider,
        contextWindow: model.maxContext || model.defaultContext,
        isAvailableInCursor: true,
        category: 'coding',
        capabilities: JSON.stringify(model.capabilities)
      };

      // Добавляем цены если есть
      const priceData = data.pricing[model.name];
      if (priceData) {
        updates.pricingInput = priceData.input;
        updates.pricingOutput = priceData.output;
        console.log(`   💰 Цены: input=${(priceData.input * 1000000).toFixed(2)}/M, output=${(priceData.output * 1000000).toFixed(2)}/M`);
      }

      if (existingModel) {
        // Обновляем существующую модель
        await prisma.aIModel.update({
          where: { id: existingModel.id },
          data: updates
        });
        console.log(`✅ Обновлена модель: ${model.name}`);
      } else {
        // Создаем новую модель
        await prisma.aIModel.create({
          data: {
            name: model.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            ...updates
          }
        });
        console.log(`🆕 Создана модель: ${model.name}`);
      }
    }

    console.log('✅ Обновление базы данных завершено!');

  } catch (error) {
    console.error('❌ Ошибка при обновлении базы:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Основная логика
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--parse')) {
    await parseCursorTables();
  } else if (args.includes('--update')) {
    await updateDatabaseWithTablesData();
  } else {
    console.log('Использование:');
    console.log('  node scripts/parse-cursor-tables.js --parse   - Парсит таблицы и сохраняет в JSON.');
    console.log('  node scripts/parse-cursor-tables.js --update  - Обновляет базу данных из JSON файла.');
    process.exit(0);
  }
}

main();
