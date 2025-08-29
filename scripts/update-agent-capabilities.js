const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Модели с agent capabilities на основе анализа различных источников
// Источники: официальная документация, бенчмарки, исследования
const AGENT_MODELS = [
  // OpenAI модели с сильными agent capabilities
  'gpt-4',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'o1',
  'o1-preview',
  'o1-mini',
  'o3',
  'o3-mini',
  'o3-pro',

  // Anthropic модели с agent capabilities
  'claude-3-5-sonnet',
  'claude-3-7-sonnet',
  'claude-3-opus',
  'claude-3-haiku',
  'claude-3-sonnet',

  // Google модели
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro',
  'gemini-pro-vision',
  'gemini-2.5-pro',
  'gemini-2.5-flash',

  // xAI модели
  'grok-4',
  'grok-3',
  'grok-beta',
  'grok-2',

  // DeepSeek модели
  'deepseek-chat',
  'deepseek-r1',
  'deepseek-v3',
  'deepseek-coder',

  // Alibaba модели
  'qwen2.5',
  'qwen2.5-coder',
  'qwen-turbo',
  'qwen-plus',
  'qwen-max',

  // Mistral модели
  'mistral-large',
  'mistral-7b-instruct',
  'mixtral-8x7b-instruct',

  // Cohere модели
  'command-r',
  'command-r-plus',

  // Другие модели с agent capabilities
  'cursor-small',
  'cursor-fast',
  'codellama'
];

// Детальные возможности для каждой модели
const AGENT_CAPABILITIES = {
  'claude-3-5-sonnet': ['tool_use', 'function_calling', 'multi_step_reasoning', 'code_generation', 'analysis'],
  'claude-3-7-sonnet': ['tool_use', 'function_calling', 'multi_step_reasoning', 'code_generation', 'analysis', 'self_reflection'],
  'gpt-4': ['tool_use', 'function_calling', 'multi_step_reasoning', 'code_generation', 'analysis'],
  'gpt-4o': ['tool_use', 'function_calling', 'multi_step_reasoning', 'code_generation', 'analysis', 'vision'],
  'o1': ['advanced_reasoning', 'multi_step_planning', 'code_generation', 'analysis', 'self_reflection'],
  'o3': ['advanced_reasoning', 'multi_step_planning', 'code_generation', 'analysis', 'self_reflection'],
  'gemini-2.5-pro': ['tool_use', 'function_calling', 'multi_step_reasoning', 'code_generation', 'analysis', 'vision'],
  'grok-4': ['tool_use', 'function_calling', 'multi_step_reasoning', 'code_generation', 'analysis', 'real_time_knowledge'],
  'deepseek-r1': ['advanced_reasoning', 'multi_step_planning', 'code_generation', 'analysis', 'self_reflection'],
};

async function updateAgentCapabilities() {
  try {
    console.log('🤖 Обновление Agent Capabilities для моделей...\n');

    let updated = 0;
    let skipped = 0;

    // Сначала сбросим все модели
    await prisma.aIModel.updateMany({
      data: { isAgent: false }
    });

    for (const modelName of AGENT_MODELS) {
      try {
        // Ищем модель по различным полям
        const model = await prisma.aIModel.findFirst({
          where: {
            OR: [
              { name: modelName },
              { displayName: modelName },
              { modelId: modelName }
            ]
          }
        });

        if (!model) {
          console.log(`⚠️  Модель "${modelName}" не найдена в базе данных`);
          skipped++;
          continue;
        }

        // Получаем детальные возможности
        const capabilities = AGENT_CAPABILITIES[modelName] || ['tool_use', 'function_calling', 'multi_step_reasoning'];

        // Обновляем модель
        await prisma.aIModel.update({
          where: { id: model.id },
          data: {
            isAgent: true,
            capabilities: JSON.stringify(capabilities)
          }
        });

        console.log(`✅ Обновлена модель ${model.displayName} (${model.provider}): ${capabilities.join(', ')}`);
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

    // Показываем статистику
    const agentModels = await prisma.aIModel.findMany({
      where: { isAgent: true },
      orderBy: { displayName: 'asc' }
    });

    if (agentModels.length > 0) {
      console.log(`\n🤖 Модели с Agent Capabilities (${agentModels.length}):`);

      // Группируем по провайдеру
      const byProvider = agentModels.reduce((acc, model) => {
        if (!acc[model.provider]) acc[model.provider] = [];
        acc[model.provider].push(model);
        return acc;
      }, {});

      Object.entries(byProvider).forEach(([provider, models]) => {
        console.log(`\n📍 ${provider}:`);
        models.forEach(model => {
          const capabilities = JSON.parse(model.capabilities || '[]');
          const capText = capabilities.slice(0, 3).join(', ') + (capabilities.length > 3 ? '...' : '');
          console.log(`   • ${model.displayName} (${capText})`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при обновлении agent capabilities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateAgentCapabilities();
}
