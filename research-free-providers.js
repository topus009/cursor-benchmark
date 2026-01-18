const fetch = require('node-fetch').default;

async function researchFreeProviders() {
  console.log('🔬 ИССЛЕДОВАНИЕ БЕСПЛАТНЫХ AI ПРОВАЙДЕРОВ И МОДЕЛЕЙ\n');

  const providers = [
    {
      name: 'Hugging Face',
      url: 'https://huggingface.co/inference-api/pricing',
      description: 'Бесплатный Inference API для тысяч моделей',
      freeModels: ['GPT-2', 'DistilBERT', 'RoBERTa', 'BART', 'T5', 'Llama 2 7B', 'Falcon 7B'],
      apiKeyMethod: 'Регистрация на huggingface.co → Settings → Access Tokens'
    },
    {
      name: 'Replicate',
      url: 'https://replicate.com/pricing',
      description: 'Бесплатный tier + credits для новых пользователей',
      freeModels: ['Llama 2 70B', 'Stable Diffusion', 'CodeLlama', 'Mixtral 8x7B', 'FLUX.1'],
      apiKeyMethod: 'Регистрация → бесплатные credits автоматически'
    },
    {
      name: 'Together AI',
      url: 'https://www.together.ai/pricing',
      description: 'Бесплатные credits для тестирования',
      freeModels: ['Llama 2/3', 'Mixtral', 'Qwen', 'Gemma', 'Falcon'],
      apiKeyMethod: 'Регистрация → получение бесплатных $5 credits'
    },
    {
      name: 'Fireworks AI',
      url: 'https://fireworks.ai/pricing',
      description: 'Бесплатный tier для большинства моделей',
      freeModels: ['Llama 3.1 70B', 'Mixtral 8x7B', 'Gemma', 'Phi-3'],
      apiKeyMethod: 'Регистрация → бесплатный tier доступен сразу'
    },
    {
      name: 'Anyscale',
      url: 'https://www.anyscale.com/pricing',
      description: 'Бесплатный tier для inference',
      freeModels: ['Llama 2/3', 'Mixtral', 'Zephyr', 'Neural Chat'],
      apiKeyMethod: 'Регистрация → бесплатный tier для development'
    },
    {
      name: 'Mistral AI',
      url: 'https://mistral.ai/technology/',
      description: 'Бесплатный tier для некоторых моделей',
      freeModels: ['Mistral 7B', 'Mixtral 8x7B'],
      apiKeyMethod: 'Регистрация на La Plateforme → бесплатный tier'
    },
    {
      name: 'Perplexity AI',
      url: 'https://docs.perplexity.ai/',
      description: 'Бесплатный API для поиска и чата',
      freeModels: ['pplx-7b-online', 'pplx-70b-online'],
      apiKeyMethod: 'Регистрация → API key для бесплатного tier'
    },
    {
      name: 'Cohere',
      url: 'https://cohere.com/pricing',
      description: 'Бесплатный tier для тестирования',
      freeModels: ['Command R', 'Command R+'],
      apiKeyMethod: 'Регистрация → бесплатные credits'
    },
    {
      name: 'DeepSeek',
      url: 'https://platform.deepseek.com/',
      description: 'Некоторые модели доступны бесплатно',
      freeModels: ['deepseek-chat', 'deepseek-coder'],
      apiKeyMethod: 'Регистрация → бесплатный tier доступен'
    },
    {
      name: 'xAI (Grok)',
      url: 'https://docs.x.ai/',
      description: 'Через X Premium или специальные токены',
      freeModels: ['Grok-1', 'Grok-1.5'],
      apiKeyMethod: 'X Premium подписка или специальный доступ'
    },
    {
      name: 'Poe (Quora)',
      url: 'https://poe.com/',
      description: 'Бесплатный доступ к Claude и другим моделям',
      freeModels: ['Claude 3.5 Sonnet (limited)', 'GPT-4 (limited)'],
      apiKeyMethod: 'Через неофициальные API endpoints'
    },
    {
      name: 'Character.AI',
      url: 'https://character.ai/',
      description: 'Экспериментальный API доступ',
      freeModels: ['Различные character-based модели'],
      apiKeyMethod: 'Через неофициальные API endpoints'
    },
    {
      name: 'Pi.ai',
      url: 'https://pi.ai/',
      description: 'Бесплатный доступ к их моделям',
      freeModels: ['Pi-1', 'Pi-2'],
      apiKeyMethod: 'Через неофициальные API endpoints'
    },
    {
      name: 'You.com',
      url: 'https://you.com/',
      description: 'Бесплатные модели через API',
      freeModels: ['YouChat models'],
      apiKeyMethod: 'Через неофициальные API endpoints'
    },
    {
      name: 'Bing Chat',
      url: 'https://www.bing.com/chat',
      description: 'Через Microsoft Azure с ограничениями',
      freeModels: ['GPT-4 based models'],
      apiKeyMethod: 'Azure OpenAI с бесплатным tier (ограничено)'
    }
  ];

  console.log('📋 ПОЛНЫЙ СПИСОК ПРОВАЙДЕРОВ С БЕСПЛАТНЫМИ МОДЕЛЯМИ:\n');

  providers.forEach((provider, index) => {
    console.log(`${index + 1}. 🎯 ${provider.name}`);
    console.log(`   📝 ${provider.description}`);
    console.log(`   🤖 Бесплатные модели: ${provider.freeModels.join(', ')}`);
    console.log(`   🔑 Получение API ключа: ${provider.apiKeyMethod}`);
    console.log(`   🌐 URL: ${provider.url}`);
    console.log('');
  });

  console.log('🚀 РЕКОМЕНДОВАННЫЕ ШАГИ ДЛЯ НАЧАЛА:\n');

  const steps = [
    '1. Зарегистрироваться на Hugging Face (самый простой старт)',
    '2. Получить API ключ от Together AI (бесплатные $5)',
    '3. Попробовать Replicate (автоматические credits)',
    '4. Проверить Fireworks AI (много бесплатных моделей)',
    '5. Настроить модели в Cursor как custom providers'
  ];

  steps.forEach(step => console.log(`   ${step}`));

  console.log('\n⚙️ НАСТРОЙКА В CURSOR:\n');
  console.log('Для добавления кастомных моделей в Cursor:');
  console.log('1. Открыть Cursor Settings → Models');
  console.log('2. Выбрать "Add Custom Model"');
  console.log('3. Указать:');
  console.log('   - Model Name: название модели');
  console.log('   - API Endpoint: URL провайдера');
  console.log('   - API Key: ваш ключ');
  console.log('   - Model ID: идентификатор модели у провайдера');

  console.log('\n💡 ПРОФЕССИОНАЛЬНЫЕ СОВЕТЫ:');
  console.log('• Начинайте с Hugging Face - там тысячи бесплатных моделей');
  console.log('• Together AI дает $5 credits - хватит на тестирование');
  console.log('• Replicate хорош для creative задач (Stable Diffusion)');
  console.log('• Mistral AI - отличное качество по низкой цене');
  console.log('• Для кода: CodeLlama, DeepSeek Coder, Codestral');
  console.log('• Для чата: Mixtral, Llama 3, Grok');
}

// Запуск исследования
researchFreeProviders();
