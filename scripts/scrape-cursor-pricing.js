const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function scrapeCursorPricing() {
  let browser;
  try {
    console.log('🌐 Начинаем парсинг официальной страницы Cursor...');

    // Запускаем браузер
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Устанавливаем таймаут
    await page.setDefaultTimeout(30000);

    console.log('📄 Загружаем страницу...');
    await page.goto('https://cursor.com/ru/docs/models', {
      waitUntil: 'networkidle2'
    });

    // Ждем загрузки таблиц
    await page.waitForSelector('table', { timeout: 10000 });

    console.log('✅ Страница загружена, начинаем парсинг...');

    // Извлекаем данные из таблиц
    const data = await page.evaluate(() => {
      const models = [];
      const pricing = {};

      // Парсим таблицу моделей (имена, контекст, возможности)
      const modelTables = document.querySelectorAll('table');
      if (modelTables.length >= 1) {
        const modelTable = modelTables[0];
        const rows = modelTable.querySelectorAll('tbody tr');

        for (let i = 1; i < rows.length; i++) { // Пропускаем заголовок
          const cells = rows[i].querySelectorAll('td, th');
          if (cells.length < 4) continue;

          // Имя модели (может содержать иконку провайдера)
          const nameCell = cells[0];
          const modelName = nameCell.textContent?.trim().replace(/\s+/g, ' ') || '';

          // Контекст по умолчанию
          const defaultContext = cells[1].textContent?.trim() || '';

          // Максимальный контекст
          const maxContext = cells[2].textContent?.trim() || '';

          // Возможности
          const capabilities = [];
          const capabilityButtons = cells[3].querySelectorAll('button');
          capabilityButtons.forEach(btn => {
            const title = btn.getAttribute('title') || btn.textContent?.trim();
            if (title) capabilities.push(title);
          });

          if (modelName) {
            models.push({
              name: modelName,
              defaultContext,
              maxContext,
              capabilities
            });
          }
        }
      }

      // Парсим таблицу цен
      if (modelTables.length >= 2) {
        const pricingTable = modelTables[1];
        const rows = pricingTable.querySelectorAll('tbody tr');

        for (let i = 1; i < rows.length; i++) { // Пропускаем заголовок
          const cells = rows[i].querySelectorAll('td, th');
          if (cells.length < 5) continue;

          // Имя модели
          const nameCell = cells[0];
          const modelName = nameCell.textContent?.trim().replace(/\s+/g, ' ') || '';

          // Цены
          const inputPrice = parseFloat((cells[1].textContent?.trim() || '').replace('$', ''));
          const cacheWritePrice = parseFloat((cells[2].textContent?.trim() || '').replace('$', ''));
          const cacheReadPrice = parseFloat((cells[3].textContent?.trim() || '').replace('$', ''));
          const outputPrice = parseFloat((cells[4].textContent?.trim() || '').replace('$', ''));

          if (modelName && !isNaN(inputPrice)) {
            pricing[modelName] = {
              input: inputPrice,
              cacheWrite: cacheWritePrice,
              cacheRead: cacheReadPrice,
              output: outputPrice
            };
          }
        }
      }

      return { models, pricing };
    });

    console.log(`📊 Найдено моделей: ${data.models.length}`);
    console.log(`💰 Найдено ценовых записей: ${Object.keys(data.pricing).length}`);

    // Сохраняем данные
    const outputData = {
      models: data.models,
      pricing: data.pricing,
      scrapedAt: new Date().toISOString(),
      source: 'https://cursor.com/ru/docs/models'
    };

    const outputPath = path.join(__dirname, '..', 'cursor-official-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

    console.log('✅ Данные сохранены в cursor-official-data.json');

    return data;

  } catch (error) {
    console.error('❌ Ошибка при парсинге:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function updateDatabaseWithOfficialData() {
  try {
    console.log('🔄 Начинаем обновление базы данных...');

    // Загружаем данные
    const dataPath = path.join(__dirname, '..', 'cursor-official-data.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Файл cursor-official-data.json не найден');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Обновляем модели
    for (const model of data.models) {
      console.log(`🔄 Обрабатываем модель: ${model.name}`);

      // Парсим контекст
      const defaultContext = parseContext(model.defaultContext);
      const maxContext = parseContext(model.maxContext);

      console.log(`   Контекст: ${defaultContext} -> ${maxContext}`);

      // Ищем модель в базе по displayName
      const existingModel = await prisma.aIModel.findFirst({
        where: {
          displayName: model.name
        }
      });

      if (existingModel) {
        // Обновляем модель
        const updates = {};

        // Обновляем контекст
        if (maxContext && maxContext > (existingModel.contextWindow || 0)) {
          updates.contextWindow = maxContext;
          console.log(`   📏 Обновлен контекст: ${existingModel.contextWindow} -> ${maxContext}`);
        } else if (defaultContext && !existingModel.contextWindow) {
          updates.contextWindow = defaultContext;
          console.log(`   📏 Установлен контекст: ${defaultContext}`);
        }

        // Обновляем цены если есть
        const pricing = data.pricing[model.name];
        if (pricing) {
          updates.pricingInput = pricing.input / 1000000; // Конвертируем из $/M токенов в $/токен
          updates.pricingOutput = pricing.output / 1000000;
          console.log(`   💰 Обновлены цены: input=${pricing.input}/M, output=${pricing.output}/M`);
        }

        if (Object.keys(updates).length > 0) {
          await prisma.aIModel.update({
            where: { id: existingModel.id },
            data: updates
          });
          console.log(`✅ Обновлена модель: ${model.name}`);
        } else {
          console.log(`ℹ️ Нечего обновлять для: ${model.name}`);
        }
      } else {
        console.log(`⚠️ Модель не найдена в базе: ${model.name}`);
        console.log(`   Попробуем найти похожие...`);

        // Попробуем найти по частичному совпадению
        const similarModels = await prisma.aIModel.findMany({
          where: {
            OR: [
              { displayName: { contains: model.name.split(' ')[0] } },
              { name: { contains: model.name.toLowerCase().replace(/\s+/g, '-') } }
            ]
          },
          take: 3
        });

        if (similarModels.length > 0) {
          console.log(`   Похожие модели в базе:`);
          similarModels.forEach(m => console.log(`     - ${m.displayName} (${m.provider})`));
        }
      }
    }

    // Добавляем отсутствующие модели
    console.log('\n🔄 Добавляем отсутствующие модели...');
    await addMissingModels(data);

    console.log('✅ Обновление базы данных завершено!');

  } catch (error) {
    console.error('❌ Ошибка при обновлении базы:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function addMissingModels(data) {
  const missingModels = [];

  // Claude 4.5 Sonnet - проверяем в базе данных
  const claude45Exists = await prisma.aIModel.findFirst({
    where: { displayName: 'Claude 4.5 Sonnet' }
  });

  if (!claude45Exists) {
    missingModels.push({
      name: 'claude-4-5-sonnet',
      modelId: 'anthropic/claude-4.5-sonnet',
      displayName: 'Claude 4.5 Sonnet',
      provider: 'Anthropic',
      contextWindow: 1000000, // 1M
      pricingInput: 3 / 1000000, // $3/M токенов
      pricingOutput: 15 / 1000000, // $15/M токенов
      isFree: false,
      isAvailableInCursor: true,
      isReasoning: true,
      category: 'coding',
      capabilities: '["agent", "thinking", "image"]'
    });
  }

  // GPT-5-Codex - проверяем в базе данных
  const gpt5CodexExists = await prisma.aIModel.findFirst({
    where: { displayName: 'GPT-5-Codex' }
  });

  if (!gpt5CodexExists) {
    missingModels.push({
      name: 'gpt-5-codex',
      modelId: 'openai/gpt-5-codex',
      displayName: 'GPT-5-Codex',
      provider: 'OpenAI',
      contextWindow: 272000,
      pricingInput: 1.25 / 1000000,
      pricingOutput: 10 / 1000000,
      isFree: false,
      isAvailableInCursor: true,
      isReasoning: true,
      category: 'coding',
      capabilities: '["agent", "thinking", "image"]'
    });
  }

  for (const modelData of missingModels) {
    try {
      // Проверяем, нет ли уже такой модели
      const existing = await prisma.aIModel.findFirst({
        where: { displayName: modelData.displayName }
      });

      if (!existing) {
        await prisma.aIModel.create({
          data: modelData
        });
        console.log(`✅ Добавлена модель: ${modelData.displayName}`);
      } else {
        console.log(`ℹ️ Модель уже существует: ${modelData.displayName}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка при добавлении модели ${modelData.displayName}:`, error.message);
    }
  }
}

function parseContext(contextStr) {
  if (!contextStr || contextStr === '-') return null;

  // Обрабатываем миллионы (1M = 1,000,000)
  if (contextStr.includes('M')) {
    const match = contextStr.match(/(\d+(?:\.\d+)?)M/i);
    if (match) {
      return parseFloat(match[1]) * 1000000; // Конвертируем M в миллионы
    }
  }

  // Обрабатываем тысячи (200k = 200,000)
  if (contextStr.includes('k')) {
    const match = contextStr.match(/(\d+(?:\.\d+)?)k/i);
    if (match) {
      return parseFloat(match[1]) * 1000; // Конвертируем k в тысячи
    }
  }

  return parseInt(contextStr) || null;
}

// Основная логика
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--scrape')) {
    await scrapeCursorPricing();
  } else if (args.includes('--update')) {
    await updateDatabaseWithOfficialData();
  } else if (args.includes('--all')) {
    await scrapeCursorPricing();
    await updateDatabaseWithOfficialData();
  } else {
    console.log('Использование:');
    console.log('  --scrape    - спарсить данные с сайта Cursor');
    console.log('  --update    - обновить базу данных');
    console.log('  --all       - спарсить и обновить');
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapeCursorPricing, updateDatabaseWithOfficialData };
