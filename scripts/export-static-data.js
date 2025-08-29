const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function exportStaticData() {
  try {
    console.log('📤 Экспортируем данные для статической версии...\n');

    // Получаем все модели с их характеристиками
    const models = await prisma.aIModel.findMany({
      include: {
        benchmarkResults: {
          include: {
            source: true
          }
        },
        userRatings: true,
        _count: {
          select: {
            benchmarkResults: true,
            userRatings: true
          }
        }
      },
      orderBy: {
        displayName: 'asc'
      }
    });

    // Обрабатываем данные для статической версии
    const staticModels = models.map(model => {
      // Рассчитываем производительность
      const avgRating = model.userRatings.length > 0
        ? model.userRatings.reduce((sum, rating) => sum + rating.rating, 0) / model.userRatings.length
        : null;

      const avgResponseTime = model.userRatings.length > 0
        ? model.userRatings.reduce((sum, rating) => sum + (rating.speedRating || 0), 0) / model.userRatings.length * 1000 // в ms
        : null;

      // Находим passRate из бенчмарков
      const passRateResult = model.benchmarkResults.find(b =>
        b.metricName.toLowerCase().includes('pass') ||
        b.metricName.toLowerCase().includes('accuracy') ||
        b.metricName.toLowerCase().includes('success')
      );

      const passRate = passRateResult ? passRateResult.metricValue : null;

      // Находим Aider benchmark
      const aiderBenchmark = model.benchmarkResults.find(b =>
        b.metricName.toLowerCase().includes('aider')
      );

      // Рассчитываем Cost/Value скор
      let costValueScore = null;
      if (passRate !== null && (avgRating !== null || avgResponseTime !== null)) {
        let qualityScore = 0;
        if (avgRating) qualityScore += avgRating * 1.2;
        if (passRate) qualityScore += passRate / 10;
        qualityScore = Math.min(10, qualityScore);

        let speedScore = 5;
        if (avgResponseTime) {
          speedScore = Math.max(0, Math.min(10, 10 - (avgResponseTime / 1000)));
        }

        let costScore = 1;
        if (model.pricingInput && !model.isFree) {
          costScore = Math.max(0.1, Math.min(5, 5 / (1 + model.pricingInput * 1000)));
        }

        costValueScore = (qualityScore + speedScore) / costScore;
      }

      return {
        id: model.id,
        name: model.name,
        displayName: model.displayName,
        provider: model.provider,
        description: model.description,
        contextWindow: model.contextWindow,
        pricingInput: model.pricingInput,
        pricingOutput: model.pricingOutput,
        isFree: model.isFree,
        isRecommended: model.isRecommended,
        isAvailableInCursor: model.isAvailableInCursor,
        isReasoning: model.isReasoning,
        isAgent: model.isAgent,
        category: model.category,
        capabilities: model.capabilities ? JSON.parse(model.capabilities) : [],
        // Вычисляемые поля
        avgRating: avgRating ? Number(avgRating.toFixed(1)) : null,
        avgResponseTime: avgResponseTime ? Number(avgResponseTime.toFixed(0)) : null,
        totalRatings: model._count.userRatings,
        passRate: passRate ? Number(passRate.toFixed(2)) : null,
        aiderBenchmark: aiderBenchmark ? Number((aiderBenchmark.metricValue * 100).toFixed(1)) : null,
        costValueScore: costValueScore ? Number(costValueScore.toFixed(1)) : null,
        totalBenchmarks: model._count.benchmarkResults
      };
    });

    // Получаем уникальные провайдеры и категории
    const providers = [...new Set(staticModels.map(m => m.provider))].sort();
    const categories = [...new Set(staticModels.map(m => m.category))].filter(Boolean).sort();

    const staticData = {
      models: staticModels,
      providers,
      categories,
      stats: {
        total: staticModels.length,
        withCursor: staticModels.filter(m => m.isAvailableInCursor).length,
        withReasoning: staticModels.filter(m => m.isReasoning).length,
        withAgent: staticModels.filter(m => m.isAgent).length,
        free: staticModels.filter(m => m.isFree).length,
        premium: staticModels.filter(m => !m.isFree).length
      },
      exportedAt: new Date().toISOString()
    };

    console.log(`✅ Экспортировано ${staticModels.length} моделей`);
    console.log(`📊 Статистика:`);
    console.log(`   • Доступны в Cursor: ${staticData.stats.withCursor}`);
    console.log(`   • С reasoning: ${staticData.stats.withReasoning}`);
    console.log(`   • С agent capabilities: ${staticData.stats.withAgent}`);
    console.log(`   • Бесплатные: ${staticData.stats.free}`);
    console.log(`   • Премиум: ${staticData.stats.premium}`);

    // Сохраняем в JSON файл
    const fs = require('fs');
    const path = require('path');

    const outputPath = path.join(__dirname, '..', 'static-models-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(staticData, null, 2));

    console.log(`💾 Данные сохранены в: ${outputPath}`);

    return staticData;

  } catch (error) {
    console.error('❌ Ошибка при экспорте данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  exportStaticData();
}

module.exports = { exportStaticData };
