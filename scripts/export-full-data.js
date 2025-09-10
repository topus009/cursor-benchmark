const { PrismaClient } = require('../src/generated/prisma')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportFullData() {
  try {
    console.log('🔄 Начинаем экспорт полных данных из базы...')

    // Получаем все модели с полными данными
    const models = await prisma.aIModel.findMany({
      include: {
        userRatings: true,
        benchmarkResults: {
          include: {
            source: true
          }
        },
        _count: {
          select: {
            userRatings: true,
            benchmarkResults: true
          }
        }
      },
      orderBy: {
        displayName: 'asc'
      }
    })

    console.log(`📊 Найдено ${models.length} моделей`)

    // Обрабатываем данные для статического режима
    const processedModels = models.map(model => {
      // Вычисляем средние оценки пользователей
      const userRatings = model.userRatings || []
      const avgRating = userRatings.length > 0
        ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length
        : null

      const avgSpeedRating = userRatings.length > 0
        ? userRatings
            .filter(r => r.speedRating)
            .reduce((sum, r) => sum + (r.speedRating || 0), 0) /
          userRatings.filter(r => r.speedRating).length || null
        : null

      const avgQualityRating = userRatings.length > 0
        ? userRatings
            .filter(r => r.qualityRating)
            .reduce((sum, r) => sum + (r.qualityRating || 0), 0) /
          userRatings.filter(r => r.qualityRating).length || null
        : null

      const avgCostRating = userRatings.length > 0
        ? userRatings
            .filter(r => r.costRating)
            .reduce((sum, r) => sum + (r.costRating || 0), 0) /
          userRatings.filter(r => r.costRating).length || null
        : null

      // Обрабатываем результаты бенчмарков
      const benchmarkResults = model.benchmarkResults || []
      const benchmarks = benchmarkResults.reduce((acc, result) => {
        if (!acc[result.metricName]) {
          acc[result.metricName] = []
        }
        acc[result.metricName].push({
          id: result.id,
          metricName: result.metricName,
          metricValue: result.metricValue,
          benchmarkType: result.benchmarkType,
          benchmarkId: result.benchmarkId,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          source: result.source ? {
            id: result.source.id,
            name: result.source.name,
            displayName: result.source.displayName,
            description: result.source.description,
            category: result.source.category
          } : null
        })
        return acc
      }, {})

      // Вычисляем ключевые метрики
      const avgResponseTime = benchmarks['avg_response_time']?.[0]?.metricValue || null
      const successRate = benchmarks['success_rate']?.[0]?.metricValue || null
      const passRate = benchmarks['pass_rate']?.[0]?.metricValue || null

      // Находим aider benchmark
      const aiderBenchmark = benchmarkResults.find(b =>
        b.metricName.toLowerCase().includes('aider') ||
        b.benchmarkType.toLowerCase().includes('aider')
      )?.metricValue || null

      // Вычисляем cost value score
      const costValueScore = model.pricingInput && model.pricingOutput && avgRating
        ? Math.round((avgRating / ((model.pricingInput + model.pricingOutput) / 2)) * 100) / 100
        : null

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
        capabilities: model.capabilities,
        
        // Вычисленные метрики
        avgRating,
        avgSpeedRating,
        avgQualityRating,
        avgCostRating,
        avgResponseTime,
        successRate,
        passRate,
        totalRatings: model._count.userRatings,
        totalBenchmarks: model._count.benchmarkResults,
        aiderBenchmark,
        costValueScore,
        
        // Полные данные для совместимости
        userRatings: userRatings.map(rating => ({
          id: rating.id,
          rating: rating.rating,
          speedRating: rating.speedRating,
          qualityRating: rating.qualityRating,
          costRating: rating.costRating,
          comment: rating.comment,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt
        })),
        benchmarkResults: benchmarkResults.map(result => ({
          id: result.id,
          metricName: result.metricName,
          metricValue: result.metricValue,
          benchmarkType: result.benchmarkType,
          benchmarkId: result.benchmarkId,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          source: result.source ? {
            id: result.source.id,
            name: result.source.name,
            displayName: result.source.displayName,
            description: result.source.description,
            category: result.source.category
          } : null
        })),
        
        // Метаданные
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      }
    })

    // Создаем объект с данными
    const exportData = {
      models: processedModels,
      exportDate: new Date().toISOString(),
      totalModels: processedModels.length,
      totalRatings: processedModels.reduce((sum, model) => sum + model.totalRatings, 0),
      totalBenchmarks: processedModels.reduce((sum, model) => sum + model.totalBenchmarks, 0)
    }

    // Сохраняем в файл
    const outputPath = path.join(__dirname, '..', 'static-models-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2))

    console.log('✅ Данные успешно экспортированы!')
    console.log(`📁 Файл сохранен: ${outputPath}`)
    console.log(`📊 Статистика:`)
    console.log(`   - Моделей: ${exportData.totalModels}`)
    console.log(`   - Оценок пользователей: ${exportData.totalRatings}`)
    console.log(`   - Результатов бенчмарков: ${exportData.totalBenchmarks}`)
    console.log(`   - Дата экспорта: ${exportData.exportDate}`)

  } catch (error) {
    console.error('❌ Ошибка при экспорте данных:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем экспорт
exportFullData()
