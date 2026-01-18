const fetch = require('node-fetch').default;

async function analyzeFreeModels() {
  try {
    console.log('🔍 Анализ моделей для возможности бесплатного использования...\n');

    const response = await fetch('http://localhost:3000/api/models');
    const data = await response.json();

    console.log(`📊 Всего моделей в базе: ${data.data.length}\n`);

    // Анализируем бесплатные модели
    const freeModels = data.data.filter(model => model.isFree === true);
    console.log(`🆓 БЕСПЛАТНЫЕ МОДЕЛИ (${freeModels.length}):`);
    freeModels.forEach(model => {
      console.log(`  ✅ ${model.displayName} (${model.provider})`);
      console.log(`     Категория: ${model.category}`);
      console.log(`     Возможности: ${model.capabilities.join(', ')}`);
      console.log(`     Доступен в Cursor: ${model.isAvailableInCursor ? 'Да' : 'Нет'}`);
      console.log('');
    });

    // Анализируем модели по провайдерам
    const providerStats = {};
    data.data.forEach(model => {
      if (!providerStats[model.provider]) {
        providerStats[model.provider] = {
          total: 0,
          free: 0,
          cursor: 0,
          agent: 0,
          reasoning: 0
        };
      }
      providerStats[model.provider].total++;
      if (model.isFree) providerStats[model.provider].free++;
      if (model.isAvailableInCursor) providerStats[model.provider].cursor++;
      if (model.isAgent) providerStats[model.provider].agent++;
      if (model.isReasoning) providerStats[model.provider].reasoning++;
    });

    console.log('📈 СТАТИСТИКА ПО ПРОВАЙДЕРАМ:');
    Object.entries(providerStats).forEach(([provider, stats]) => {
      console.log(`${provider}:`);
      console.log(`  Всего: ${stats.total}`);
      console.log(`  Бесплатных: ${stats.free}`);
      console.log(`  В Cursor: ${stats.cursor}`);
      console.log(`  С агентскими возможностями: ${stats.agent}`);
      console.log(`  С reasoning: ${stats.reasoning}`);
      console.log('');
    });

    // Ищем модели с низкой ценой (потенциально бесплатные)
    const lowCostModels = data.data
      .filter(model => !model.isFree && model.pricingInput !== null && model.pricingInput < 0.001)
      .sort((a, b) => a.pricingInput - b.pricingInput);

    console.log('💰 МОДЕЛИ С НИЗКОЙ ЦЕНОЙ (потенциально доступные для тестов):');
    lowCostModels.slice(0, 10).forEach(model => {
      console.log(`  💵 ${model.displayName} (${model.provider})`);
      console.log(`     Цена input: $${model.pricingInput}/1K токенов`);
      console.log(`     Цена output: $${model.pricingOutput}/1K токенов`);
      console.log('');
    });

    // Анализируем возможности получения API ключей для бесплатного использования
    console.log('🔑 АНАЛИЗ ВОЗМОЖНОСТЕЙ ПОЛУЧЕНИЯ БЕСПЛАТНЫХ API КЛЮЧЕЙ:');
    console.log('');

    // Провайдеры с бесплатными tier'ами
    const freeTierProviders = [
      'OpenAI (GPT-3.5 Turbo - бесплатный tier)',
      'Anthropic (ограниченный бесплатный доступ через Console)',
      'Google (Gemini API - бесплатный tier)',
      'xAI (Grok - через X/Twitter premium)',
      'Meta (Llama модели через Together AI)',
      'Mistral (бесплатный tier для некоторых моделей)',
      'DeepSeek (некоторые модели доступны бесплатно)',
      'Hugging Face (бесплатные inference API)',
      'Replicate (бесплатный tier)',
      'Cohere (бесплатный tier)',
      'Together AI (бесплатные credits)',
      'Fireworks AI (бесплатный tier)'
    ];

    freeTierProviders.forEach(provider => {
      console.log(`  🎁 ${provider}`);
    });

    console.log('');
    console.log('🌐 ДОПОЛНИТЕЛЬНЫЕ ПРОВАЙДЕРЫ НЕ В СПИСКЕ CURSOR:');
    const additionalProviders = [
      'Hugging Face (Transformers Inference API - многие модели бесплатны)',
      'Replicate (огромная библиотека моделей с бесплатным tier)',
      'Anyscale (бесплатный tier для некоторых моделей)',
      'Perplexity (бесплатный tier для поиска и чата)',
      'You.com (бесплатные модели через API)',
      'Bing Chat (через Microsoft Azure, но с ограничениями)',
      'Claude через Poe (бесплатный tier)',
      'Character.AI API (экспериментальный доступ)',
      'Pi.ai (бесплатный доступ к их моделям)',
      'Grok через xAI API (с токеном от X premium)'
    ];

    additionalProviders.forEach(provider => {
      console.log(`  🔍 ${provider}`);
    });

    console.log('');
    console.log('⚡ РЕКОМЕНДАЦИИ ДЛЯ БЕСПЛАТНОГО ИСПОЛЬЗОВАНИЯ:');
    console.log('1. Использовать Cursor Small (Free) - уже доступен');
    console.log('2. Зарегистрироваться в Together AI - бесплатные credits');
    console.log('3. Использовать Hugging Face Inference API');
    console.log('4. Попробовать Replicate с бесплатным tier');
    console.log('5. Проверить Mistral API бесплатный tier');
    console.log('6. Использовать Perplexity API для поиска');
    console.log('7. Попробовать Grok через xAI с premium токеном');

  } catch (error) {
    console.error('❌ Ошибка анализа:', error.message);
  }
}

analyzeFreeModels();
