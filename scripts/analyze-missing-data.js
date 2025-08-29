const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function analyzeMissingData() {
  try {
    console.log('🔍 Анализ моделей с неполными данными...\n');

    // Получаем все модели с их данными
    const models = await prisma.aIModel.findMany({
      include: {
        benchmarkResults: true,
        userRatings: true,
        _count: {
          select: {
            benchmarkResults: true,
            userRatings: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Всего моделей в базе: ${models.length}\n`);

    // Анализируем каждую модель
    const modelsWithMissingData = [];
    const completeModels = [];
    const dataStats = {
      missingPricing: 0,
      missingContext: 0,
      missingBenchmarks: 0,
      missingRatings: 0,
      noBenchmarks: 0,
      noRatings: 0
    };

    for (const model of models) {
      const missingFields = [];

      // Проверяем pricing
      if (!model.pricingInput && !model.pricingOutput) {
        missingFields.push('pricing');
        dataStats.missingPricing++;
      }

      // Проверяем context window
      if (!model.contextWindow) {
        missingFields.push('context_window');
        dataStats.missingContext++;
      }

      // Проверяем бенчмарки
      if (model._count.benchmarkResults === 0) {
        missingFields.push('benchmarks');
        dataStats.noBenchmarks++;
      } else {
        dataStats.missingBenchmarks += model._count.benchmarkResults;
      }

      // Проверяем рейтинги
      if (model._count.userRatings === 0) {
        missingFields.push('ratings');
        dataStats.noRatings++;
      } else {
        dataStats.missingRatings += model._count.userRatings;
      }

      if (missingFields.length > 0) {
        modelsWithMissingData.push({
          id: model.id,
          name: model.displayName,
          provider: model.provider,
          missingFields,
          hasBenchmarks: model._count.benchmarkResults > 0,
          hasRatings: model._count.userRatings > 0,
          pricingInput: model.pricingInput,
          contextWindow: model.contextWindow
        });
      } else {
        completeModels.push({
          id: model.id,
          name: model.displayName,
          provider: model.provider
        });
      }
    }

    // Выводим статистику
    console.log('📈 Статистика по отсутствующим данным:');
    console.log(`  💰 Моделей без pricing: ${dataStats.missingPricing}`);
    console.log(`  📏 Моделей без context window: ${dataStats.missingContext}`);
    console.log(`  📊 Моделей без бенчмарков: ${dataStats.noBenchmarks}`);
    console.log(`  ⭐ Моделей без рейтингов: ${dataStats.noRatings}`);
    console.log(`  ✅ Полностью заполненных моделей: ${completeModels.length}`);
    console.log(`  ⚠️  Моделей с неполными данными: ${modelsWithMissingData.length}\n`);

    // Выводим модели с неполными данными
    if (modelsWithMissingData.length > 0) {
      console.log('🔴 Модели с неполными данными:');
      modelsWithMissingData.forEach((model, index) => {
        console.log(`\n${index + 1}. ${model.name} (${model.provider})`);
        console.log(`   Отсутствующие данные: ${model.missingFields.join(', ')}`);

        if (model.pricingInput) {
          console.log(`   💰 Pricing input: $${model.pricingInput}/1K`);
        } else {
          console.log(`   💰 Pricing: отсутствует`);
        }

        if (model.contextWindow) {
          console.log(`   📏 Context window: ${model.contextWindow}K токенов`);
        } else {
          console.log(`   📏 Context window: отсутствует`);
        }

        console.log(`   📊 Бенчмарки: ${model.hasBenchmarks ? 'есть' : 'отсутствуют'}`);
        console.log(`   ⭐ Рейтинги: ${model.hasRatings ? 'есть' : 'отсутствуют'}`);
      });

      console.log(`\n💡 Для заполнения данных можно использовать:`);
      console.log(`   • Официальную документацию провайдеров (OpenAI, Anthropic, Google, etc.)`);
      console.log(`   • Публичные бенчмарки (Hugging Face, LMSYS, etc.)`);
      console.log(`   • Ценовую информацию с сайтов провайдеров`);
      console.log(`   • Сообщественные рейтинги и отзывы`);
    }

    // Предлагаем конкретные модели для поиска
    const priorityModels = modelsWithMissingData
      .filter(model => model.missingFields.includes('pricing') || model.missingFields.includes('context_window'))
      .slice(0, 5);

    if (priorityModels.length > 0) {
      console.log(`\n🎯 Приоритетные модели для поиска информации:`);
      priorityModels.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.name} (${model.provider})`);
        console.log(`      Искать: ${model.missingFields.join(', ')}`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при анализе данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  analyzeMissingData();
}
