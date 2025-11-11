const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Функция для нормализации названий моделей
function normalizeModelName(name, provider) {
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
    .trim() + '_' + provider.toLowerCase();
}

// Группировка моделей по нормализованным названиям
async function groupDuplicates() {
  const models = await prisma.aIModel.findMany({
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

  const groups = {};

  models.forEach(model => {
    const key = normalizeModelName(model.displayName, model.provider);

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(model);
  });

  return groups;
}

// Выбор "главной" модели из группы дубликатов
function selectMasterModel(duplicates) {
  // Сортируем по качеству данных
  return duplicates.sort((a, b) => {
    // Приоритет: модель с большим количеством данных
    const aScore = (a.contextWindow ? 1 : 0) +
                   (a.pricingInput ? 1 : 0) +
                   (a._count.userRatings) +
                   (a._count.benchmarkResults);

    const bScore = (b.contextWindow ? 1 : 0) +
                   (b.pricingInput ? 1 : 0) +
                   (b._count.userRatings) +
                   (b._count.benchmarkResults);

    return bScore - aScore;
  })[0];
}

// Объединение данных из дубликатов
function mergeModelData(master, duplicates) {
  const merged = { ...master };

  // Собираем все уникальные данные
  const allCapabilities = new Set();
  let bestContext = master.contextWindow;
  let bestPricingInput = master.pricingInput;
  let bestPricingOutput = master.pricingOutput;

  duplicates.forEach(model => {
    // Контекст - берем максимальный
    if (model.contextWindow && (!bestContext || model.contextWindow > bestContext)) {
      bestContext = model.contextWindow;
    }

    // Цены - берем не-null значения
    if (model.pricingInput && !bestPricingInput) {
      bestPricingInput = model.pricingInput;
      bestPricingOutput = model.pricingOutput;
    }

    // Возможности - объединяем
    if (model.capabilities) {
      try {
        const caps = JSON.parse(model.capabilities);
        caps.forEach(cap => allCapabilities.add(cap));
      } catch (e) {
        // Игнорируем ошибку парсинга
      }
    }
  });

  // Обновляем главную модель
  if (bestContext !== master.contextWindow) {
    merged.contextWindow = bestContext;
  }

  if (bestPricingInput !== master.pricingInput) {
    merged.pricingInput = bestPricingInput;
    merged.pricingOutput = bestPricingOutput;
  }

  if (allCapabilities.size > 0) {
    merged.capabilities = JSON.stringify([...allCapabilities]);
  }

  return merged;
}

async function cleanDuplicates() {
  console.log('🧹 Начинаем очистку дубликатов...\n');

  const groups = await groupDuplicates();
  let totalDuplicates = 0;
  let cleaned = 0;

  for (const [key, models] of Object.entries(groups)) {
    if (models.length > 1) {
      console.log(`🔸 Группа: ${key} (${models.length} моделей)`);

      // Показываем все модели в группе
      models.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.displayName} (ID: ${model.id})`);
        console.log(`      Контекст: ${model.contextWindow || 'null'}`);
        console.log(`      Цена: ${model.pricingInput ? '$' + (model.pricingInput * 1000000).toFixed(2) + '/M' : 'null'}`);
        console.log(`      Оценок: ${model._count.userRatings}, Бенчмарков: ${model._count.benchmarkResults}`);
      });

      // Выбираем главную модель
      const master = selectMasterModel(models);
      console.log(`   ✅ Выбрана главная: ${master.displayName} (ID: ${master.id})`);

      // Объединяем данные
      const mergedData = mergeModelData(master, models.filter(m => m.id !== master.id));
      console.log(`   🔄 Объединенные данные:`);
      console.log(`      Контекст: ${mergedData.contextWindow}`);
      if (mergedData.pricingInput) {
        console.log(`      Цена: $${(mergedData.pricingInput * 1000000).toFixed(2)}/M`);
      }

      // Обновляем главную модель
      await prisma.aIModel.update({
        where: { id: master.id },
        data: {
          contextWindow: mergedData.contextWindow,
          pricingInput: mergedData.pricingInput,
          pricingOutput: mergedData.pricingOutput,
          capabilities: mergedData.capabilities
        }
      });

      // Переносим оценки и бенчмарки от дубликатов к главной модели
      for (const duplicate of models.filter(m => m.id !== master.id)) {
        if (duplicate._count.userRatings > 0) {
          await prisma.userRating.updateMany({
            where: { aiModelId: duplicate.id },
            data: { aiModelId: master.id }
          });
          console.log(`      📊 Перенесено ${duplicate._count.userRatings} оценок`);
        }

        if (duplicate._count.benchmarkResults > 0) {
          await prisma.benchmarkResult.updateMany({
            where: { aiModelId: duplicate.id },
            data: { aiModelId: master.id }
          });
          console.log(`      📊 Перенесено ${duplicate._count.benchmarkResults} бенчмарков`);
        }

        // Удаляем дубликат
        await prisma.aIModel.delete({
          where: { id: duplicate.id }
        });
        console.log(`      🗑️ Удалена модель: ${duplicate.displayName}`);
        cleaned++;
      }

      totalDuplicates += models.length - 1;
      console.log('');
    }
  }

  console.log('📊 Итоги очистки:');
  console.log(`   🗑️ Удалено дубликатов: ${cleaned}`);
  console.log(`   📦 Групп дубликатов: ${Object.values(groups).filter(g => g.length > 1).length}`);

  // Финальная статистика
  const finalCount = await prisma.aIModel.count();
  console.log(`   📈 Осталось моделей: ${finalCount}`);

  return { cleaned, totalDuplicates };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--clean')) {
    await cleanDuplicates();
  } else if (args.includes('--analyze')) {
    const groups = await groupDuplicates();
    console.log('📋 Анализ дубликатов:');

    let totalModels = 0;
    let duplicateGroups = 0;

    for (const [key, models] of Object.entries(groups)) {
      totalModels += models.length;
      if (models.length > 1) {
        duplicateGroups++;
        console.log(`\n🔸 ${key}: ${models.length} моделей`);
        models.forEach(m => console.log(`   - ${m.displayName} (${m.provider})`));
      }
    }

    console.log(`\n📊 Всего моделей: ${totalModels}`);
    console.log(`📊 Групп дубликатов: ${duplicateGroups}`);
  } else {
    console.log('🧹 Очистка дубликатов моделей');
    console.log('');
    console.log('Использование:');
    console.log('  --analyze   - проанализировать дубликаты');
    console.log('  --clean     - очистить дубликаты (ОСТОРОЖНО!)');
    console.log('');
    console.log('⚠️  Очистка необратима! Сделайте бэкап базы перед запуском.');
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  main();
}
