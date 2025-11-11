const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Функция для нормализации названий моделей для лучшего сопоставления
function normalizeModelName(name) {
  return name
    .toLowerCase()
    .replace(/claude\s+/i, '')
    .replace(/gpt[- ]/i, '')
    .replace(/[-_\s]+/g, '')
    .replace(/\s+v\d+/i, '') // убираем версии
    .replace(/sonnet/i, 'sonnet')
    .replace(/haiku/i, 'haiku')
    .replace(/opus/i, 'opus')
    .replace(/turbo/i, 'turbo')
    .replace(/flash/i, 'flash')
    .replace(/pro/i, 'pro')
    .replace(/mini/i, 'mini')
    .replace(/nano/i, 'nano')
    .replace(/codex/i, 'codex')
    .trim();
}

// Функция для поиска наиболее подходящей модели в базе
async function findBestMatch(scrapedModel) {
  const normalizedScraped = normalizeModelName(scrapedModel.name);

  // Сначала ищем точное совпадение
  let match = await prisma.aIModel.findFirst({
    where: { displayName: scrapedModel.name }
  });

  if (match) return { match, confidence: 1.0, reason: 'exact_displayName' };

  // Ищем по modelId
  const possibleModelId = `${scrapedModel.provider.toLowerCase()}/${scrapedModel.name.toLowerCase().replace(/\s+/g, '-')}`;
  match = await prisma.aIModel.findFirst({
    where: { modelId: possibleModelId }
  });

  if (match) return { match, confidence: 0.9, reason: 'modelId_match' };

  // Ищем по нормализованному названию и провайдеру
  const candidates = await prisma.aIModel.findMany({
    where: { provider: scrapedModel.provider }
  });

  let bestMatch = null;
  let bestConfidence = 0;

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeModelName(candidate.displayName);

    // Вычисляем схожесть
    if (normalizedCandidate === normalizedScraped) {
      return { match: candidate, confidence: 0.8, reason: 'normalized_match' };
    }

    // Частичное совпадение
    if (normalizedCandidate.includes(normalizedScraped) || normalizedScraped.includes(normalizedCandidate)) {
      const confidence = Math.min(normalizedCandidate.length, normalizedScraped.length) /
                        Math.max(normalizedCandidate.length, normalizedScraped.length);
      if (confidence > bestConfidence) {
        bestMatch = candidate;
        bestConfidence = confidence;
      }
    }
  }

  if (bestMatch && bestConfidence > 0.6) {
    return { match: bestMatch, confidence: bestConfidence, reason: 'partial_match' };
  }

  return { match: null, confidence: 0, reason: 'no_match' };
}

async function scrapeCursorPricing() {
  let browser;
  try {
    console.log('🌐 Начинаем расширенный парсинг официальной страницы Cursor...');

    // Запускаем браузер
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setDefaultTimeout(30000);

    console.log('📄 Загружаем страницу...');
    await page.goto('https://cursor.com/ru/docs/models', {
      waitUntil: 'networkidle2'
    });

    // Ждем загрузки и кликаем "Show more models" если есть
    try {
      await page.waitForSelector('button, [role="button"]', { timeout: 5000 });
      const showMoreButton = await page.$('button:has-text("Show more models"), [role="button"]:has-text("Show more models")');
      if (showMoreButton) {
        console.log('🔽 Нажимаем "Show more models"...');
        await showMoreButton.click();
        await page.waitForTimeout(2000); // Ждем загрузки
      }
    } catch (e) {
      console.log('ℹ️ Кнопка "Show more models" не найдена или уже все загружено');
    }

    // Ждем загрузки таблиц
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('✅ Страница загружена, начинаем парсинг...');

    // Извлекаем данные
    const data = await page.evaluate(() => {
      const models = [];
      const pricing = {};

      const modelTables = document.querySelectorAll('table');
      if (modelTables.length >= 1) {
        const modelTable = modelTables[0];
        const rows = modelTable.querySelectorAll('tbody tr');

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td, th');
          if (cells.length < 4) continue;

          const nameCell = cells[0];
          const modelName = nameCell.textContent?.trim().replace(/\s+/g, ' ') || '';
          const defaultContext = cells[1].textContent?.trim() || '';
          const maxContext = cells[2].textContent?.trim() || '';
          const capabilities = cells[3];

          // Определяем провайдера
          let provider = 'Unknown';
          if (nameCell.innerHTML.includes('anthropic')) provider = 'Anthropic';
          else if (nameCell.innerHTML.includes('openai')) provider = 'OpenAI';
          else if (nameCell.innerHTML.includes('google')) provider = 'Google';
          else if (nameCell.innerHTML.includes('deepseek')) provider = 'DeepSeek';
          else if (nameCell.innerHTML.includes('xai')) provider = 'xAI';
          else if (nameCell.innerHTML.includes('meta')) provider = 'Meta';
          else if (nameCell.innerHTML.includes('cursor')) provider = 'Cursor';

          // Парсим возможности
          const caps = [];
          const capButtons = capabilities.querySelectorAll('button');
          capButtons.forEach(btn => {
            const title = btn.getAttribute('title');
            if (title) caps.push(title);
          });

          models.push({
            name: modelName,
            provider,
            defaultContext,
            maxContext,
            capabilities: caps
          });
        }
      }

      // Парсим таблицу цен
      if (modelTables.length >= 2) {
        const pricingTable = modelTables[1];
        const rows = pricingTable.querySelectorAll('tbody tr');

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td, th');
          if (cells.length < 5) continue;

          const nameCell = cells[0];
          const modelName = nameCell.textContent?.trim().replace(/\s+/g, ' ') || '';
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

    console.log(`📊 Спарсено моделей: ${data.models.length}`);
    console.log(`💰 Спарсено ценовых записей: ${Object.keys(data.pricing).length}`);

    // Сохраняем данные
    const outputData = {
      models: data.models,
      pricing: data.pricing,
      scrapedAt: new Date().toISOString(),
      source: 'https://cursor.com/ru/docs/models (enhanced)'
    };

    const outputPath = path.join(__dirname, '..', 'cursor-enhanced-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log('✅ Данные сохранены в cursor-enhanced-data.json');

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

async function updateDatabaseWithEnhancedData() {
  try {
    console.log('🔄 Начинаем умное обновление базы данных...');

    const dataPath = path.join(__dirname, '..', 'cursor-enhanced-data.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Файл cursor-enhanced-data.json не найден. Сначала запустите --scrape');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Получаем все существующие модели для статистики
    const existingModels = await prisma.aIModel.findMany({
      select: { id: true, displayName: true, provider: true, contextWindow: true }
    });

    console.log(`📊 В базе сейчас: ${existingModels.length} моделей`);

    let updated = 0;
    let created = 0;
    let skipped = 0;

    // Обрабатываем каждую спарсенную модель
    for (const scrapedModel of data.models) {
      console.log(`🔍 Обрабатываем: ${scrapedModel.name} (${scrapedModel.provider})`);

      // Ищем лучшую пару
      const { match, confidence, reason } = await findBestMatch(scrapedModel);

      if (match) {
        console.log(`   📍 Найдена пара: ${match.displayName} (${match.provider}) [${reason}, уверенность: ${(confidence * 100).toFixed(0)}%]`);

        // Подготавливаем обновления
        const updates = {};

        // Обновляем контекст
        const defaultContext = parseContext(scrapedModel.defaultContext);
        const maxContext = parseContext(scrapedModel.maxContext);
        const bestContext = maxContext || defaultContext;

        if (bestContext && (!match.contextWindow || bestContext > match.contextWindow)) {
          updates.contextWindow = bestContext;
          console.log(`   📏 Контекст: ${match.contextWindow || 'null'} → ${bestContext}`);
        }

        // Обновляем цены
        const pricing = data.pricing[scrapedModel.name];
        if (pricing) {
          updates.pricingInput = pricing.input / 1000000;
          updates.pricingOutput = pricing.output / 1000000;
          console.log(`   💰 Цены: input=$${(pricing.input).toFixed(2)}/M, output=$${(pricing.output).toFixed(2)}/M`);
        }

        // Все спарсенные модели доступны в Cursor
        if (!match.isAvailableInCursor) {
          updates.isAvailableInCursor = true;
          console.log(`   🖱️ Доступна в Cursor: ${match.isAvailableInCursor} → true`);
        }

        // Обновляем возможности
        if (scrapedModel.capabilities && scrapedModel.capabilities.length > 0) {
          const currentCaps = match.capabilities ? JSON.parse(match.capabilities) : [];
          const newCaps = [...new Set([...currentCaps, ...scrapedModel.capabilities])];
          if (newCaps.length > currentCaps.length) {
            updates.capabilities = JSON.stringify(newCaps);
            console.log(`   ⚡ Возможности: ${currentCaps.join(', ')} → ${newCaps.join(', ')}`);
          }
        }

        // Применяем обновления
        if (Object.keys(updates).length > 0) {
          await prisma.aIModel.update({
            where: { id: match.id },
            data: updates
          });
          updated++;
          console.log(`   ✅ Обновлена модель: ${match.displayName}`);
        } else {
          skipped++;
          console.log(`   ℹ️ Нечего обновлять для: ${match.displayName}`);
        }

      } else {
        console.log(`   ⚠️ Модель не найдена в базе: ${scrapedModel.name}`);

        // Создаем новую модель
        const defaultContext = parseContext(scrapedModel.defaultContext);
        const maxContext = parseContext(scrapedModel.maxContext);
        const pricing = data.pricing[scrapedModel.name];

        const newModel = {
          name: scrapedModel.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          modelId: `${scrapedModel.provider.toLowerCase()}/${scrapedModel.name.toLowerCase().replace(/\s+/g, '-')}`,
          displayName: scrapedModel.name,
          provider: scrapedModel.provider,
          contextWindow: maxContext || defaultContext,
          pricingInput: pricing ? pricing.input / 1000000 : null,
          pricingOutput: pricing ? pricing.output / 1000000 : null,
          isFree: pricing ? pricing.input === 0 : false,
          isAvailableInCursor: true,
          category: 'coding',
          capabilities: JSON.stringify(scrapedModel.capabilities || [])
        };

        await prisma.aIModel.create({ data: newModel });
        created++;
        console.log(`   🆕 Создана модель: ${scrapedModel.name}`);
      }
    }

    console.log('\n📊 Итоги обновления:');
    console.log(`   ✅ Обновлено: ${updated} моделей`);
    console.log(`   🆕 Создано: ${created} моделей`);
    console.log(`   ℹ️ Пропущено: ${skipped} моделей`);

    // Финальная статистика
    const finalModels = await prisma.aIModel.findMany({
      select: { id: true, contextWindow: true, pricingInput: true }
    });

    const withContext = finalModels.filter(m => m.contextWindow).length;
    const withPricing = finalModels.filter(m => m.pricingInput).length;

    console.log('\n📈 Финальная статистика базы:');
    console.log(`   Моделей всего: ${finalModels.length}`);
    console.log(`   С контекстом: ${withContext} (${((withContext / finalModels.length) * 100).toFixed(1)}%)`);
    console.log(`   С ценами: ${withPricing} (${((withPricing / finalModels.length) * 100).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Ошибка при обновлении базы:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function parseContext(contextStr) {
  if (!contextStr || contextStr === '-') return null;

  // Обрабатываем миллионы (1M = 1,000,000)
  if (contextStr.includes('M')) {
    const match = contextStr.match(/(\d+(?:\.\d+)?)M/i);
    if (match) {
      return parseFloat(match[1]) * 1000000;
    }
  }

  // Обрабатываем тысячи (200k = 200,000)
  if (contextStr.includes('k')) {
    const match = contextStr.match(/(\d+(?:\.\d+)?)k/i);
    if (match) {
      return parseFloat(match[1]) * 1000;
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
    await updateDatabaseWithEnhancedData();
  } else if (args.includes('--all')) {
    await scrapeCursorPricing();
    await updateDatabaseWithEnhancedData();
  } else if (args.includes('--analyze')) {
    await analyzeDuplicates();
  } else {
    console.log('🚀 Улучшенный парсер данных Cursor');
    console.log('');
    console.log('Использование:');
    console.log('  --scrape    - спарсить свежие данные с сайта Cursor');
    console.log('  --update    - умно обновить базу данных');
    console.log('  --all       - спарсить и обновить');
    console.log('  --analyze   - проанализировать дубликаты');
    console.log('');
    console.log('Особенности:');
    console.log('  • Умное сопоставление моделей по названию и провайдеру');
    console.log('  • Обработка версий (v2, v3, etc.)');
    console.log('  • Нажатие "Show more models" для полного списка');
    console.log('  • Обновление только изменившихся данных');
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapeCursorPricing, updateDatabaseWithEnhancedData };
