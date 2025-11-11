const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Правила для объединения моделей
const MERGE_RULES = [
  // Claude Sonnet variants
  {
    pattern: /(?:claude\s+)?(?:4\.5\s+)?sonnet(?:\s+4\.5)?/i,
    provider: 'Anthropic',
    canonicalName: 'Claude 4.5 Sonnet',
    priority: ['has_context', 'has_pricing', 'has_benchmarks', 'newer']
  },
  // Claude Opus variants
  {
    pattern: /(?:claude\s+)?(?:4\.1?\s+)?opus(?:\s+4\.1?)?/i,
    provider: 'Anthropic',
    canonicalName: 'Claude 4 Opus',
    priority: ['has_context', 'has_pricing', 'has_benchmarks', 'newer']
  },
  // Claude Haiku variants
  {
    pattern: /(?:claude\s+)?(?:3\.5\s+)?haiku(?:\s+4\.5)?/i,
    provider: 'Anthropic',
    canonicalName: 'Claude 3.5 Haiku',
    priority: ['has_context', 'has_pricing', 'has_benchmarks', 'newer']
  },
  // GPT-5 variants
  {
    pattern: /gpt-5(?:\s+(codex|fast|high|low|mini|nano|medium|pro))?(?:\s+(fast|high))?/i,
    provider: 'OpenAI',
    canonicalName: 'GPT-5',
    priority: ['has_context', 'has_pricing', 'has_benchmarks', 'newer']
  },
  // GPT-4 variants
  {
    pattern: /gpt-4(?:\.1)?(?:\s+(turbo|o|mini))?/i,
    provider: 'OpenAI',
    canonicalName: 'GPT-4',
    priority: ['has_context', 'has_pricing', 'has_benchmarks', 'newer']
  }
];

function calculateModelScore(model) {
  let score = 0;

  // Данные о контексте (высокий приоритет)
  if (model.contextWindow) score += 100;

  // Цены (высокий приоритет)
  if (model.pricingInput && model.pricingOutput) score += 50;

  // Бенчмарки
  if (model._count?.benchmarkResults > 0) score += 20;

  // Оценки пользователей
  if (model._count?.userRatings > 0) score += 10;

  // Правильный провайдер
  if (model.provider !== 'Unknown') score += 5;

  // Недавнее обновление
  const daysSinceUpdate = (Date.now() - new Date(model.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 10 - daysSinceUpdate); // Бонус за свежесть

  return score;
}

function selectBestModel(models) {
  let bestModel = null;
  let bestScore = -1;

  for (const model of models) {
    const score = calculateModelScore(model);
    if (score > bestScore) {
      bestScore = score;
      bestModel = model;
    }
  }

  return bestModel;
}

function mergeModelData(master, duplicates) {
  const merged = { ...master };

  // Собираем все данные
  const allCapabilities = new Set();
  let bestContext = master.contextWindow;
  let bestPricingInput = master.pricingInput;
  let bestPricingOutput = master.pricingOutput;
  let bestDescription = master.description;

  // Парсим возможности главной модели
  if (master.capabilities) {
    try {
      const caps = JSON.parse(master.capabilities);
      caps.forEach(cap => allCapabilities.add(cap));
    } catch (e) {}
  }

  duplicates.forEach(model => {
    // Лучший контекст
    if (model.contextWindow && (!bestContext || model.contextWindow > bestContext)) {
      bestContext = model.contextWindow;
    }

    // Лучшие цены (предпочитаем не-null значения)
    if (model.pricingInput && !bestPricingInput) {
      bestPricingInput = model.pricingInput;
      bestPricingOutput = model.pricingOutput;
    }

    // Лучшее описание
    if (model.description && model.description.length > (bestDescription?.length || 0)) {
      bestDescription = model.description;
    }

    // Возможности - объединяем
    if (model.capabilities) {
      try {
        const caps = JSON.parse(model.capabilities);
        caps.forEach(cap => allCapabilities.add(cap));
      } catch (e) {}
    }
  });

  // Обновляем главную модель
  merged.contextWindow = bestContext;
  merged.pricingInput = bestPricingInput;
  merged.pricingOutput = bestPricingOutput;
  merged.description = bestDescription;
  merged.capabilities = JSON.stringify([...allCapabilities]);

  return merged;
}

async function findAndMergeDuplicates() {
  console.log('🔍 Умный поиск и объединение дубликатов...\n');

  const allModels = await prisma.aIModel.findMany({
    include: {
      userRatings: true,
      benchmarkResults: true,
      _count: {
        select: {
          userRatings: true,
          benchmarkResults: true
        }
      }
    }
  });

  const processedIds = new Set();
  let totalMerged = 0;

  for (const rule of MERGE_RULES) {
    const matchingModels = allModels.filter(model => {
      if (processedIds.has(model.id)) return false;
      if (model.provider !== rule.provider && rule.provider !== 'Any') return false;

      return rule.pattern.test(model.displayName);
    });

    if (matchingModels.length > 1) {
      console.log(`🔸 Правило: ${rule.canonicalName} (${rule.provider})`);
      console.log(`   Найдено моделей: ${matchingModels.length}`);

      // Показываем все модели
      matchingModels.forEach((model, index) => {
        const score = calculateModelScore(model);
        console.log(`   ${index + 1}. ${model.displayName} [${model.id}]`);
        console.log(`      Счет: ${score}, Контекст: ${model.contextWindow || 'null'}, Цена: ${model.pricingInput ? '$' + (model.pricingInput * 1000000).toFixed(2) + '/M' : 'null'}`);
        console.log(`      Бенчмарков: ${model._count.benchmarkResults}, Оценок: ${model._count.userRatings}`);
      });

      // Выбираем лучшую модель
      const master = selectBestModel(matchingModels);
      const duplicates = matchingModels.filter(m => m.id !== master.id);

      console.log(`   ✅ Выбрана главная: ${master.displayName} (счет: ${calculateModelScore(master)})`);

      // Объединяем данные
      const mergedData = mergeModelData(master, duplicates);

      // Обновляем главную модель
      await prisma.aIModel.update({
        where: { id: master.id },
        data: {
          displayName: rule.canonicalName,
          contextWindow: mergedData.contextWindow,
          pricingInput: mergedData.pricingInput,
          pricingOutput: mergedData.pricingOutput,
          description: mergedData.description,
          capabilities: mergedData.capabilities
        }
      });

      // Переносим связанные данные
      for (const duplicate of duplicates) {
        if (duplicate._count.userRatings > 0) {
          await prisma.userRating.updateMany({
            where: { modelId: duplicate.id },
            data: { modelId: master.id }
          });
          console.log(`      📊 Перенесено ${duplicate._count.userRatings} оценок из ${duplicate.displayName}`);
        }

        if (duplicate._count.benchmarkResults > 0) {
          // Получаем все бенчмарки дубликата
          const duplicateBenchmarks = await prisma.benchmarkResult.findMany({
            where: { modelId: duplicate.id }
          });

          let transferred = 0;
          for (const benchmark of duplicateBenchmarks) {
            // Проверяем, существует ли уже такой бенчмарк у главной модели
            const existingBenchmark = await prisma.benchmarkResult.findFirst({
              where: {
                modelId: master.id,
                sourceId: benchmark.sourceId,
                benchmarkType: benchmark.benchmarkType,
                metricName: benchmark.metricName
              }
            });

            if (!existingBenchmark) {
              // Переносим бенчмарк
              await prisma.benchmarkResult.update({
                where: { id: benchmark.id },
                data: { modelId: master.id }
              });
              transferred++;
            } else {
              // Удаляем дублирующийся бенчмарк
              await prisma.benchmarkResult.delete({
                where: { id: benchmark.id }
              });
              console.log(`      🗑️ Удален дублирующийся бенчмарк: ${benchmark.metricName}`);
            }
          }
          console.log(`      📊 Перенесено ${transferred} бенчмарков из ${duplicate.displayName}`);
        }

        // Удаляем дубликат
        await prisma.aIModel.delete({
          where: { id: duplicate.id }
        });
        console.log(`      🗑️ Удалена модель: ${duplicate.displayName}`);
        processedIds.add(duplicate.id);
        totalMerged++;
      }

      processedIds.add(master.id);
      console.log('');
    }
  }

  console.log(`📊 Результат: объединено ${totalMerged} дубликатов`);

  // Финальная статистика
  const finalCount = await prisma.aIModel.count();
  console.log(`📈 Осталось моделей: ${finalCount}`);

  return totalMerged;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--merge')) {
    await findAndMergeDuplicates();
  } else if (args.includes('--analyze')) {
    console.log('📋 Анализ моделей по правилам объединения:');

    const allModels = await prisma.aIModel.findMany({
      select: { id: true, displayName: true, provider: true, contextWindow: true, pricingInput: true }
    });

    for (const rule of MERGE_RULES) {
      const matchingModels = allModels.filter(model => {
        if (model.provider !== rule.provider && rule.provider !== 'Any') return false;
        return rule.pattern.test(model.displayName);
      });

      if (matchingModels.length > 1) {
        console.log(`\n🔸 ${rule.canonicalName} (${rule.provider}): ${matchingModels.length} моделей`);
        matchingModels.forEach(m => {
          const hasData = (m.contextWindow ? 1 : 0) + (m.pricingInput ? 1 : 0);
          console.log(`   - ${m.displayName} [${hasData}/2 данных]`);
        });
      }
    }
  } else {
    console.log('🧠 Умное объединение дубликатов');
    console.log('');
    console.log('Использование:');
    console.log('  --analyze   - проанализировать потенциальные дубликаты');
    console.log('  --merge     - объединить дубликаты (ОСТОРОЖНО!)');
    console.log('');
    console.log('⚠️  Объединение необратимо! Сделайте бэкап перед запуском.');
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  main();
}
