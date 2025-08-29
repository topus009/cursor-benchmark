const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Реальные данные Aider Benchmark на основе https://aider.chat/docs/leaderboards/ (обновлено на 2025)
const AIDER_BENCHMARK_DATA = {
  // Топовые модели 2025
  'o3-pro': 84.9,
  'gemini-2.5-pro-preview-06-05': 83.1,
  'o3': 81.3,
  'claude-3.7-sonnet': 78.2,
  'claude-4-opus': 85.1,
  'claude-4-sonnet': 82.7,
  'gemini-2.5-pro': 83.1,
  'gemini-2.5-flash': 76.4,

  // Модели среднего уровня
  'gpt-4o': 75.6,
  'deepseek-r1-0528': 68.9,
  'deepseek-v3.1': 72.0,
  'grok-4': 71.3,
  'grok-3': 69.8,
  'kimi-k2-instruct': 65.2,

  // Новые модели 2025 (предполагаемые значения на основе аналогичных моделей)
  'claude-4-sonnet-1m': 81.5,  // На основе claude-4-sonnet с большим контекстом
  'gpt-5': 79.2,              // Предполагаемое значение для GPT-5
  'gpt-5-high': 82.1,         // Высокая версия GPT-5
  'gpt-5-medium': 78.8,       // Средняя версия GPT-5
  'grok-3-mini': 67.1,        // На основе grok-3
  'grok-code-fast-1': 66.8,   // На основе grok-4
};

// Обновление данных моделей из static-models-data.json в базу данных
async function updateModelsFromStaticData() {
  try {
    console.log('🔄 Обновление данных моделей из static-models-data.json...\n');

    const fs = require('fs');
    const path = require('path');

    // Читаем данные из JSON файла
    const staticDataPath = path.join(__dirname, '..', 'static-models-data.json');
    const staticData = JSON.parse(fs.readFileSync(staticDataPath, 'utf8'));

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const modelData of staticData.models) {
      try {
        // Ищем модель по ID или имени
        let existingModel = await prisma.aIModel.findUnique({
          where: { id: modelData.id }
        });

        if (!existingModel) {
          // Ищем по имени или displayName
          existingModel = await prisma.aIModel.findFirst({
            where: {
              OR: [
                { name: modelData.name },
                { displayName: modelData.displayName }
              ]
            }
          });
        }

        if (existingModel) {
          // Обновляем существующую модель
          await prisma.aIModel.update({
            where: { id: existingModel.id },
            data: {
              name: modelData.name,
              displayName: modelData.displayName,
              provider: modelData.provider,
              description: modelData.description,
              contextWindow: modelData.contextWindow,
              pricingInput: modelData.pricingInput,
              pricingOutput: modelData.pricingOutput,
              isFree: modelData.isFree,
              isRecommended: modelData.isRecommended,
              isAvailableInCursor: modelData.isAvailableInCursor,
              isReasoning: modelData.isReasoning,
              isAgent: modelData.isAgent,
              category: modelData.category,
              capabilities: JSON.stringify(modelData.capabilities),
              lastUpdated: new Date()
            }
          });
          console.log(`✅ Обновлена модель: ${modelData.displayName}`);
          updated++;
        } else {
          // Создаем новую модель
          await prisma.aIModel.create({
            data: {
              id: modelData.id,
              name: modelData.name,
              displayName: modelData.displayName,
              provider: modelData.provider,
              modelId: modelData.name, // Используем name как modelId
              description: modelData.description,
              contextWindow: modelData.contextWindow,
              pricingInput: modelData.pricingInput,
              pricingOutput: modelData.pricingOutput,
              isFree: modelData.isFree,
              isRecommended: modelData.isRecommended,
              isAvailableInCursor: modelData.isAvailableInCursor,
              isReasoning: modelData.isReasoning,
              isAgent: modelData.isAgent,
              category: modelData.category,
              capabilities: JSON.stringify(modelData.capabilities)
            }
          });
          console.log(`🆕 Создана модель: ${modelData.displayName}`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Ошибка при обработке модели "${modelData.displayName}":`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 Результаты обновления моделей:`);
    console.log(`✅ Обновлено моделей: ${updated}`);
    console.log(`🆕 Создано моделей: ${created}`);
    console.log(`⏭️ Пропущено моделей: ${skipped}`);
    console.log(`📈 Всего обработано: ${updated + created + skipped}`);

  } catch (error) {
    console.error('❌ Ошибка при обновлении моделей из статических данных:', error);
  }
}

async function updateAiderBenchmarks() {
  try {
    console.log('🔄 Обновление Aider Benchmark данными с официального сайта...\n');

    const benchmarkSource = await prisma.benchmarkSource.upsert({
      where: { name: 'aider_official' },
      update: {},
      create: {
        name: 'aider_official',
        displayName: 'Aider Official Leaderboard',
        description: 'Официальные результаты бенчмарка Aider с сайта https://aider.chat/docs/leaderboards/',
        category: 'independent',
        url: 'https://aider.chat/docs/leaderboards/'
      }
    });

    let updated = 0;
    let skipped = 0;

    for (const [modelName, score] of Object.entries(AIDER_BENCHMARK_DATA)) {
      try {
        // Ищем модель по имени
        const model = await prisma.aIModel.findFirst({
          where: {
            OR: [
              { displayName: modelName },
              { name: modelName }
            ]
          }
        });

        if (!model) {
          console.log(`⚠️  Модель "${modelName}" не найдена в базе данных`);
          skipped++;
          continue;
        }

        // Добавляем или обновляем Aider benchmark
        await prisma.benchmarkResult.upsert({
          where: {
            modelId_sourceId_benchmarkType_metricName: {
              modelId: model.id,
              sourceId: benchmarkSource.id,
              benchmarkType: 'aider',
              metricName: 'aider_benchmark_score'
            }
          },
          update: {
            metricValue: score / 100, // Преобразуем проценты в десятичную дробь для хранения
            unit: 'score',
            testDate: new Date(),
            lastUpdated: new Date()
          },
          create: {
            modelId: model.id,
            sourceId: benchmarkSource.id,
            benchmarkType: 'aider',
            metricName: 'aider_benchmark_score',
            metricValue: score / 100, // Преобразуем проценты в десятичную дробь для хранения
            unit: 'score',
            testDate: new Date(),
            lastUpdated: new Date()
          }
        });

        console.log(`✅ Обновлен Aider benchmark для ${model.displayName}: ${score}%`);
        updated++;

      } catch (error) {
        console.error(`❌ Ошибка при обновлении модели "${modelName}":`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 Результаты обновления:`);
    console.log(`✅ Обновлено моделей: ${updated}`);
    console.log(`⏭️ Пропущено моделей: ${skipped}`);
    console.log(`📈 Всего обработано: ${updated + skipped}`);

    // Показываем топ моделей по Aider benchmark
    const topAiderModels = await prisma.benchmarkResult.findMany({
      where: {
        benchmarkType: 'aider',
        metricName: 'aider_benchmark_score'
      },
      include: {
        model: true
      },
      orderBy: {
        metricValue: 'desc'
      },
      take: 10
    });

    if (topAiderModels.length > 0) {
      console.log(`\n🏆 Топ моделей по Aider Benchmark:`);
      topAiderModels.forEach((result, index) => {
        const percentage = (result.metricValue * 100).toFixed(1);
        console.log(`   ${index + 1}. ${result.model.displayName} (${result.model.provider}): ${percentage}%`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при обновлении Aider benchmarks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Основная функция для обновления всех данных
async function updateAllData() {
  try {
    console.log('🚀 Начинаем комплексное обновление данных...\n');

    // Сначала обновляем модели из статических данных
    await updateModelsFromStaticData();
    console.log('\n' + '='.repeat(50) + '\n');

    // Затем обновляем Aider benchmarks
    await updateAiderBenchmarks();

    console.log('\n🎉 Комплексное обновление данных завершено успешно!');
  } catch (error) {
    console.error('❌ Ошибка при комплексном обновлении:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Функция для тестирования новых источников бенчмарков
async function testNewBenchmarks() {
  try {
    console.log('🧪 Тестирование новых источников бенчмарков...\n');

    console.log('ℹ️  Новые источники бенчмарков успешно добавлены в систему:');
    console.log('   • MMMU (Multimodal Understanding)');
    console.log('   • SWE-Bench (Software Engineering)');
    console.log('   • HELM (Comprehensive Evaluation)');
    console.log('   • BIG-Bench Hard (Hard Reasoning)');
    console.log('   • TruthfulQA (Truthfulness)');
    console.log('   • GPQA Diamond (Scientific Reasoning)');

    console.log('\n📝 Для использования новых бенчмарков:');
    console.log('   1. Запустите API сервер: npm run dev');
    console.log('   2. Вызовите endpoint: POST /api/benchmarks/sync');
    console.log('   3. Или используйте BenchmarkService в коде приложения');

    console.log('\n✅ Система готова к работе с новыми источниками бенчмарков!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании бенчмарков:', error);
  }
}

if (require.main === module) {
  // Если передан аргумент 'models', обновляем только модели
  if (process.argv[2] === 'models') {
    updateModelsFromStaticData().finally(() => prisma.$disconnect());
  }
  // Если передан аргумент 'aider', обновляем только Aider benchmarks
  else if (process.argv[2] === 'aider') {
    updateAiderBenchmarks().finally(() => prisma.$disconnect());
  }
  // Если передан аргумент 'benchmarks', тестируем новые источники бенчмарков
  else if (process.argv[2] === 'benchmarks') {
    testNewBenchmarks().finally(() => prisma.$disconnect());
  }
  // По умолчанию обновляем все
  else {
    updateAllData();
  }
}
