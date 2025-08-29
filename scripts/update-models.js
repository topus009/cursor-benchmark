const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function updateExistingModels() {
  try {
    console.log('🔄 Начинаем обновление существующих моделей...');

    // Шаг 1: Сбрасываем все флаги для корректной работы парсера
    const resetUpdate = await prisma.aIModel.updateMany({
      data: {
        isRecommended: false,
        isAvailableInCursor: false,
        isReasoning: false
      }
    });

    console.log(`✅ Сброшены флаги для ${resetUpdate.count} моделей (recommended, cursor, reasoning)`);

    // Шаг 2: Устанавливаем правильные значения isFree
    // Сначала сбрасываем все модели как платные
    await prisma.aIModel.updateMany({
      data: {
        isFree: false
      }
    });

    // Затем устанавливаем бесплатными только DeepSeek модели
    const deepSeekUpdate = await prisma.aIModel.updateMany({
      where: {
        provider: 'DeepSeek'
      },
      data: {
        isFree: true
      }
    });

    console.log(`✅ Установлено бесплатными ${deepSeekUpdate.count} DeepSeek моделей`);

    // Проверяем результаты
    const recommendedCount = await prisma.aIModel.count({
      where: { isRecommended: true }
    });

    const freeModels = await prisma.aIModel.findMany({
      where: { isFree: true },
      select: { name: true, provider: true },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Моделей с меткой recommended: ${recommendedCount}`);
    console.log(`🆓 Бесплатных моделей: ${freeModels.length}`);

    if (freeModels.length > 0) {
      console.log('Список бесплатных моделей:');
      freeModels.forEach(model => {
        console.log(`  ${model.name} (${model.provider})`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при обновлении моделей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateExistingModels();
}
