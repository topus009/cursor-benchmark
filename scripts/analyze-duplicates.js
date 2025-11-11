const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function analyzeDuplicates() {
  try {
    const models = await prisma.aIModel.findMany({
      select: { id: true, name: true, displayName: true, provider: true },
      orderBy: { displayName: 'asc' }
    });

    console.log('🔍 Анализ дубликатов и похожих моделей...\n');

    // Группируем по очищенным названиям
    const groups = {};

    models.forEach(model => {
      const cleanName = model.displayName
        .toLowerCase()
        .replace(/claude\s+/i, '')
        .replace(/gpt[- ]/i, '')
        .replace(/gemini/i, 'gemini')
        .replace(/sonnet/i, 'sonnet')
        .replace(/haiku/i, 'haiku')
        .replace(/opus/i, 'opus')
        .replace(/turbo/i, 'turbo')
        .replace(/flash/i, 'flash')
        .replace(/pro/i, 'pro')
        .replace(/\s+v\d+/i, '') // убираем версии
        .replace(/[-_\s]+/g, '')
        .trim();

      if (!groups[cleanName]) {
        groups[cleanName] = [];
      }
      groups[cleanName].push(model);
    });

    console.log('📋 Группы похожих моделей:');
    Object.entries(groups).forEach(([key, models]) => {
      if (models.length > 1) {
        console.log(`\n🔸 Ключ: ${key}`);
        models.forEach(m => {
          console.log(`   - ${m.displayName} (${m.provider}) [ID: ${m.id}]`);
        });
      }
    });

    console.log(`\n📊 Всего моделей: ${models.length}`);

    // Показываем модели без данных
    console.log('\n🚨 Модели без контекста (возможно новые):');
    const modelsWithoutContext = models.filter(m => !m.contextWindow);
    modelsWithoutContext.forEach(m => {
      console.log(`   - ${m.displayName} (${m.provider})`);
    });

  } finally {
    await prisma.$disconnect();
  }
}

analyzeDuplicates();
