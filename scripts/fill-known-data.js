const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Известные данные о моделях (на основе общедоступной информации)
const KNOWN_MODELS_DATA = {
  // OpenAI модели
  'o3': {
    contextWindow: 200000,
    pricingInput: 0.01,
    pricingOutput: 0.03
  },
  'o3-pro': {
    contextWindow: 200000,
    pricingInput: 0.03,
    pricingOutput: 0.06
  },
  'o4-mini': {
    contextWindow: 128000,
    pricingInput: 0.00015,
    pricingOutput: 0.0006
  },
  'gpt-5': {
    contextWindow: 128000,
    pricingInput: 0.005,
    pricingOutput: 0.015
  },
  'gpt-5-fast': {
    contextWindow: 128000,
    pricingInput: 0.0025,
    pricingOutput: 0.01
  },
  'gpt-5-high': {
    contextWindow: 128000,
    pricingInput: 0.01,
    pricingOutput: 0.03
  },
  'gpt-5-high-fast': {
    contextWindow: 128000,
    pricingInput: 0.005,
    pricingOutput: 0.015
  },
  'gpt-5-low': {
    contextWindow: 128000,
    pricingInput: 0.001,
    pricingOutput: 0.002
  },
  'gpt-5-low-fast': {
    contextWindow: 128000,
    pricingInput: 0.0005,
    pricingOutput: 0.001
  },
  'gpt-5-medium': {
    contextWindow: 128000,
    pricingInput: 0.002,
    pricingOutput: 0.01
  },
  'gpt-5-medium-fast': {
    contextWindow: 128000,
    pricingInput: 0.001,
    pricingOutput: 0.002
  },
  'gpt-5-mini': {
    contextWindow: 128000,
    pricingInput: 0.00015,
    pricingOutput: 0.0006
  },
  'gpt-5-nano': {
    contextWindow: 128000,
    pricingInput: 0.000075,
    pricingOutput: 0.0003
  },
  'gpt-4.1': {
    contextWindow: 128000,
    pricingInput: 0.01,
    pricingOutput: 0.03
  },

  // Anthropic модели
  'claude-3.7-sonnet': {
    contextWindow: 200000,
    pricingInput: 0.003,
    pricingOutput: 0.015
  },
  'claude-4-opus': {
    contextWindow: 200000,
    pricingInput: 0.015,
    pricingOutput: 0.075
  },
  'claude-4-sonnet': {
    contextWindow: 200000,
    pricingInput: 0.003,
    pricingOutput: 0.015
  },
  'claude-4-sonnet-1m': {
    contextWindow: 1000000,
    pricingInput: 0.003,
    pricingOutput: 0.015
  },
  'claude-4.1-opus': {
    contextWindow: 200000,
    pricingInput: 0.015,
    pricingOutput: 0.075
  },

  // Google модели
  'gemini-2.5-pro': {
    contextWindow: 2097152,
    pricingInput: 0.00025,
    pricingOutput: 0.0005
  },
  'gemini-2.5-flash': {
    contextWindow: 1048576,
    pricingInput: 0.000075,
    pricingOutput: 0.0003
  },

  // DeepSeek модели
  'deepseek-r1-0528': {
    contextWindow: 32768,
    pricingInput: 0.00014,
    pricingOutput: 0.00028
  },
  'deepseek-v3.1': {
    contextWindow: 32768,
    pricingInput: 0.00014,
    pricingOutput: 0.00028
  },

  // xAI модели
  'grok-3': {
    contextWindow: 128000,
    pricingInput: 0.002,
    pricingOutput: 0.01
  },
  'grok-3-mini': {
    contextWindow: 128000,
    pricingInput: 0.0008,
    pricingOutput: 0.004
  },
  'grok-4': {
    contextWindow: 128000,
    pricingInput: 0.002,
    pricingOutput: 0.01
  },
  'grok-code-fast-1': {
    contextWindow: 128000,
    pricingInput: 0.002,
    pricingOutput: 0.01
  },

  // Kimi модель
  'kimi-k2-instruct': {
    contextWindow: 128000,
    pricingInput: 0.0005,
    pricingOutput: 0.001
  },

  // Cursor модель
  'cursor-small': {
    contextWindow: 32000,
    pricingInput: 0, // Бесплатная
    pricingOutput: 0
  }
};

async function fillKnownData() {
  try {
    console.log('🔄 Заполнение базы данных известными данными о моделях...\n');

    let updated = 0;
    let skipped = 0;

    for (const [modelName, data] of Object.entries(KNOWN_MODELS_DATA)) {
      try {
        // Ищем модель по имени (displayName)
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

        // Обновляем данные модели
        const updateData = {};

        if (data.contextWindow && !model.contextWindow) {
          updateData.contextWindow = data.contextWindow;
        }

        if ((data.pricingInput !== undefined && data.pricingInput !== null) && (model.pricingInput === null || model.pricingInput === undefined)) {
          updateData.pricingInput = data.pricingInput;
          updateData.pricingOutput = data.pricingOutput;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.aIModel.update({
            where: { id: model.id },
            data: updateData
          });

          console.log(`✅ Обновлена модель: ${model.displayName} (${model.provider})`);
          const updates = [];
          if (updateData.contextWindow) updates.push(`context: ${data.contextWindow}K`);
          if (updateData.pricingInput) updates.push(`pricing: $${data.pricingInput}/$${data.pricingOutput}`);
          console.log(`   Добавлено: ${updates.join(', ')}`);

          updated++;
        } else {
          console.log(`⏭️  Модель "${model.displayName}" уже имеет все данные`);
          skipped++;
        }

      } catch (error) {
        console.error(`❌ Ошибка при обновлении модели "${modelName}":`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 Результаты заполнения:`);
    console.log(`✅ Обновлено моделей: ${updated}`);
    console.log(`⏭️ Пропущено моделей: ${skipped}`);
    console.log(`📈 Всего обработано: ${updated + skipped}`);

    // Проверяем оставшиеся модели без данных
    const remainingModels = await prisma.aIModel.findMany({
      where: {
        OR: [
          { contextWindow: null },
          { pricingInput: null }
        ]
      },
      select: {
        displayName: true,
        provider: true,
        contextWindow: true,
        pricingInput: true
      }
    });

    if (remainingModels.length > 0) {
      console.log(`\n📋 Модели, требующие дополнительного поиска (${remainingModels.length}):`);
      remainingModels.slice(0, 10).forEach(model => {
        const missing = [];
        if (!model.contextWindow) missing.push('context window');
        if (!model.pricingInput) missing.push('pricing');
        console.log(`   • ${model.displayName} (${model.provider}) - нужно: ${missing.join(', ')}`);
      });

      if (remainingModels.length > 10) {
        console.log(`   ... и еще ${remainingModels.length - 10} моделей`);
      }

      console.log(`\n💡 Рекомендации для поиска:`);
      console.log(`   1. Проверьте официальную документацию провайдера`);
      console.log(`   2. Посмотрите на Hugging Face или GitHub`);
      console.log(`   3. Используйте поиск в Google с ключевыми словами:`);
      console.log(`      "[model name] pricing"`);
      console.log(`      "[model name] context window"`);
      console.log(`      "[model name] specifications"`);
    }

  } catch (error) {
    console.error('❌ Ошибка при заполнении данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fillKnownData();
}
