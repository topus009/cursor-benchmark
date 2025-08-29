const { PrismaClient } = require('../src/generated/prisma');

async function checkModels() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Проверяем модели в базе данных...\n');

    // Получаем общее количество моделей
    const totalCount = await prisma.aIModel.count();
    console.log(`📊 Всего моделей в базе: ${totalCount}\n`);

    // Получаем модели по провайдерам
    const modelsByProvider = await prisma.aIModel.groupBy({
      by: ['provider'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    console.log('🏢 Модели по провайдерам:');
    modelsByProvider.forEach(provider => {
      console.log(`  ${provider.provider}: ${provider._count.id}`);
    });

    // Получаем премиум модели (не бесплатные)
    const premiumModels = await prisma.aIModel.findMany({
      where: { isFree: false },
      select: { name: true, provider: true },
      orderBy: { name: 'asc' }
    });

    console.log(`\n⭐ Премиум модели (${premiumModels.length}):`);
    premiumModels.forEach(model => {
      console.log(`  ${model.name} (${model.provider})`);
    });

    // Получаем рекомендованные модели
    const recommendedModels = await prisma.aIModel.findMany({
      where: { isRecommended: true },
      select: { name: true, provider: true },
      orderBy: { name: 'asc' }
    });

    console.log(`\n🎯 Рекомендованные модели (${recommendedModels.length}):`);
    recommendedModels.forEach(model => {
      console.log(`  ${model.name} (${model.provider})`);
    });

    // Получаем модели доступные в Cursor
    const cursorModels = await prisma.aIModel.findMany({
      where: { isAvailableInCursor: true },
      select: { name: true, provider: true },
      orderBy: { name: 'asc' }
    });

    console.log(`\n🖱️ Моделей доступных в Cursor (${cursorModels.length}):`);
    if (cursorModels.length > 0) {
      cursorModels.slice(0, 5).forEach(model => {
        console.log(`  ${model.name} (${model.provider})`);
      });
      if (cursorModels.length > 5) {
        console.log(`  ... и еще ${cursorModels.length - 5} моделей`);
      }
    }

    // Выводим первые 10 моделей для проверки
    const sampleModels = await prisma.aIModel.findMany({
      take: 10,
      select: {
        name: true,
        provider: true,
        category: true,
        isFree: true,
        isRecommended: true,
        isAvailableInCursor: true,
        isReasoning: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n📋 Пример моделей:');
    sampleModels.forEach(model => {
      const status = model.isFree ? 'Бесплатная' : 'Премиум';
      const recommended = model.isRecommended ? ' ⭐' : '';
      const cursorIcon = model.isAvailableInCursor ? ' 🖱️' : '';
      const reasoningIcon = model.isReasoning ? ' 🧠' : '';
      console.log(`  ${model.name} (${model.provider}) - ${model.category} - ${status}${recommended}${cursorIcon}${reasoningIcon}`);
    });

    // Показываем reasoning модели
    const reasoningModels = await prisma.aIModel.findMany({
      where: { isReasoning: true },
      select: { name: true, provider: true },
      orderBy: { name: 'asc' }
    });

    console.log(`\n🧠 Reasoning моделей (${reasoningModels.length}):`);
    if (reasoningModels.length > 0) {
      reasoningModels.slice(0, 10).forEach(model => {
        console.log(`  ${model.name} (${model.provider})`);
      });
      if (reasoningModels.length > 10) {
        console.log(`  ... и еще ${reasoningModels.length - 10} моделей`);
      }
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке моделей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkModels();
}
