const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function addTestData() {
  try {
    console.log('🎯 Добавляем тестовые данные для демонстрации сортировки...');

    // Получаем существующие модели для добавления тестовых данных
    const existingModels = await prisma.aIModel.findMany({
      select: { id: true, name: true, modelId: true },
      take: 10
    });

    console.log('📋 Доступные модели для тестовых данных:');
    existingModels.forEach(model => {
      console.log(`  ${model.modelId}: ${model.name}`);
    });

    // Добавляем тестовые бенчмарки только для существующих моделей
    const testBenchmarks = [];
    for (const model of existingModels.slice(0, 3)) { // Берем первые 3 модели
      testBenchmarks.push(
        {
          modelId: model.id,
          benchmarkType: 'response_time',
          metricName: 'avg_response_time',
          metricValue: Math.random() * 5 + 1, // Случайное время от 1 до 6 секунд
          unit: 'seconds'
        },
        {
          modelId: model.id,
          benchmarkType: 'code_quality',
          metricName: 'pass_rate',
          metricValue: Math.random() * 0.3 + 0.7, // Случайный процент от 70% до 100%
          unit: 'percentage'
        }
      );
    }

    // Добавляем тестовые рейтинги только для существующих моделей
    const testRatings = [];
    for (const model of existingModels.slice(0, 3)) { // Берем первые 3 модели
      testRatings.push(
        {
          modelId: model.id,
          rating: Math.floor(Math.random() * 2) + 4, // Рейтинг от 4 до 5
          speedRating: Math.floor(Math.random() * 2) + 4,
          qualityRating: Math.floor(Math.random() * 2) + 4,
          costRating: Math.floor(Math.random() * 3) + 3 // От 3 до 5
        },
        {
          modelId: model.id,
          rating: Math.floor(Math.random() * 2) + 4,
          speedRating: Math.floor(Math.random() * 2) + 4,
          qualityRating: Math.floor(Math.random() * 2) + 4,
          costRating: Math.floor(Math.random() * 3) + 3
        }
      );
    }

    // Создаем источник бенчмарков
    const benchmarkSource = await prisma.benchmarkSource.upsert({
      where: { name: 'test_source' },
      update: {},
      create: {
        name: 'test_source',
        displayName: 'Test Benchmark Source',
        description: 'Тестовый источник данных для демонстрации сортировки',
        category: 'independent',
        url: 'https://example.com'
      }
    });

    // Добавляем бенчмарки
    for (const benchmark of testBenchmarks) {
      await prisma.benchmarkResult.upsert({
        where: {
          modelId_sourceId_benchmarkType_metricName: {
            modelId: benchmark.modelId,
            sourceId: benchmarkSource.id,
            benchmarkType: benchmark.benchmarkType,
            metricName: benchmark.metricName
          }
        },
        update: {
          metricValue: benchmark.metricValue,
          unit: benchmark.unit
        },
        create: {
          modelId: benchmark.modelId,
          sourceId: benchmarkSource.id,
          benchmarkType: benchmark.benchmarkType,
          metricName: benchmark.metricName,
          metricValue: benchmark.metricValue,
          unit: benchmark.unit,
          testDate: new Date(),
          lastUpdated: new Date()
        }
      });
    }

    // Добавляем рейтинги
    for (const rating of testRatings) {
      await prisma.userRating.create({
        data: {
          modelId: rating.modelId,
          sessionId: `test_session_${Math.random()}`,
          rating: rating.rating,
          speedRating: rating.speedRating,
          qualityRating: rating.qualityRating,
          costRating: rating.costRating,
          comment: 'Тестовый рейтинг для демонстрации сортировки',
          taskType: 'coding'
        }
      });
    }

    console.log('✅ Тестовые данные успешно добавлены!');
    console.log('📊 Добавлено бенчмарков:', testBenchmarks.length);
    console.log('⭐ Добавлено рейтингов:', testRatings.length);

  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  addTestData();
}
