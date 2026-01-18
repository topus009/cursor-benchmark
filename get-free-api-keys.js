const fetch = require('node-fetch').default;

async function getFreeAPIKeys() {
  console.log('🔑 ПРАКТИЧЕСКОЕ РУКОВОДСТВО ПО ПОЛУЧЕНИЮ БЕСПЛАТНЫХ API КЛЮЧЕЙ\n');

  const providers = [
    {
      name: 'Hugging Face',
      priority: 'Высокий',
      difficulty: 'Легко',
      steps: [
        '1. Перейти на https://huggingface.co/join',
        '2. Зарегистрироваться (email + пароль)',
        '3. Подтвердить email',
        '4. Перейти в Settings → Access Tokens',
        '5. Создать новый токен с типом "Read"',
        '6. Скопировать токен'
      ],
      apiEndpoint: 'https://api-inference.huggingface.co/models/',
      freeTier: 'Неограниченно для многих моделей',
      bestFor: 'Тысячи бесплатных моделей'
    },
    {
      name: 'Together AI',
      priority: 'Высокий',
      difficulty: 'Легко',
      steps: [
        '1. Перейти на https://www.together.ai/',
        '2. Нажать "Sign Up"',
        '3. Зарегистрироваться через email или Google',
        '4. Подтвердить email',
        '5. Перейти в API Keys в dashboard',
        '6. Скопировать API key',
        '7. Получить $5 бесплатных credits автоматически'
      ],
      apiEndpoint: 'https://api.together.xyz/v1/',
      freeTier: '$5 credits',
      bestFor: 'Llama, Mixtral, высокое качество'
    },
    {
      name: 'Replicate',
      priority: 'Высокий',
      difficulty: 'Легко',
      steps: [
        '1. Перейти на https://replicate.com/',
        '2. Нажать "Sign up"',
        '3. Зарегистрироваться',
        '4. Проверить email',
        '5. Перейти в API tokens',
        '6. Создать новый токен',
        '7. Получить бесплатные credits'
      ],
      apiEndpoint: 'https://api.replicate.com/v1/',
      freeTier: 'Бесплатные credits + pay-per-use',
      bestFor: 'Stable Diffusion, FLUX, creative задачи'
    },
    {
      name: 'Fireworks AI',
      priority: 'Высокий',
      difficulty: 'Средне',
      steps: [
        '1. Перейти на https://fireworks.ai/',
        '2. Нажать "Get started"',
        '3. Зарегистрироваться',
        '4. Подтвердить аккаунт',
        '5. Перейти в API Keys',
        '6. Скопировать ключ'
      ],
      apiEndpoint: 'https://api.fireworks.ai/inference/v1/',
      freeTier: 'Бесплатный tier для большинства моделей',
      bestFor: 'Llama 3.1, Mixtral, Gemma'
    },
    {
      name: 'Mistral AI',
      priority: 'Средний',
      difficulty: 'Средне',
      steps: [
        '1. Перейти на https://mistral.ai/',
        '2. Нажать "Try it"',
        '3. Зарегистрироваться на La Plateforme',
        '4. Выбрать план (есть бесплатный)',
        '5. Получить API key'
      ],
      apiEndpoint: 'https://api.mistral.ai/v1/',
      freeTier: 'Ограниченный бесплатный tier',
      bestFor: 'Mistral 7B, Mixtral 8x7B'
    },
    {
      name: 'DeepSeek',
      priority: 'Средний',
      difficulty: 'Легко',
      steps: [
        '1. Перейти на https://platform.deepseek.com/',
        '2. Нажать "Sign up"',
        '3. Зарегистрироваться',
        '4. Проверить email',
        '5. Создать API key в dashboard'
      ],
      apiEndpoint: 'https://api.deepseek.com/v1/',
      freeTier: 'Некоторые модели бесплатны',
      bestFor: 'DeepSeek Chat, DeepSeek Coder'
    },
    {
      name: 'Cohere',
      priority: 'Средний',
      difficulty: 'Легко',
      steps: [
        '1. Перейти на https://cohere.com/',
        '2. Нажать "Sign up"',
        '3. Зарегистрироваться',
        '4. Получить trial credits',
        '5. Скопировать API key'
      ],
      apiEndpoint: 'https://api.cohere.ai/v1/',
      freeTier: 'Trial credits',
      bestFor: 'Command R, Command R+'
    }
  ];

  console.log('🎯 РЕКОМЕНДУЕМЫЕ ПРОВАЙДЕРЫ (ПО ПРИОРИТЕТУ):\n');

  providers.forEach((provider, index) => {
    console.log(`${index + 1}. 🚀 ${provider.name}`);
    console.log(`   📊 Приоритет: ${provider.priority}`);
    console.log(`   ⚡ Сложность: ${provider.difficulty}`);
    console.log(`   💰 Бесплатный tier: ${provider.freeTier}`);
    console.log(`   🎨 Лучше всего для: ${provider.bestFor}`);
    console.log(`   🔗 API Endpoint: ${provider.apiEndpoint}`);
    console.log('   📝 Шаги получения ключа:');
    provider.steps.forEach(step => console.log(`      ${step}`));
    console.log('');
  });

  console.log('🛠️ КОНФИГУРАЦИЯ ДЛЯ CURSOR:\n');

  const cursorConfigs = [
    {
      provider: 'Hugging Face',
      modelName: 'microsoft/DialoGPT-medium',
      displayName: 'DialoGPT (Free)',
      endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      headers: { 'Authorization': 'Bearer YOUR_HF_TOKEN' }
    },
    {
      provider: 'Together AI',
      modelName: 'meta-llama/Llama-2-7b-chat-hf',
      displayName: 'Llama 2 7B Chat (Free)',
      endpoint: 'https://api.together.xyz/v1/chat/completions',
      headers: { 'Authorization': 'Bearer YOUR_TOGETHER_KEY' }
    },
    {
      provider: 'Replicate',
      modelName: 'meta/llama-2-7b-chat',
      displayName: 'Llama 2 7B (Replicate)',
      endpoint: 'https://api.replicate.com/v1/predictions',
      headers: { 'Authorization': 'Bearer YOUR_REPLICATE_KEY' }
    },
    {
      provider: 'Fireworks AI',
      modelName: 'accounts/fireworks/models/llama-v3-8b-instruct',
      displayName: 'Llama 3 8B (Fireworks)',
      endpoint: 'https://api.fireworks.ai/inference/v1/chat/completions',
      headers: { 'Authorization': 'Bearer YOUR_FIREWORKS_KEY' }
    }
  ];

  cursorConfigs.forEach((config, index) => {
    console.log(`${index + 1}. ⚙️ ${config.provider} - ${config.displayName}`);
    console.log(`   Model ID: ${config.modelName}`);
    console.log(`   API Endpoint: ${config.endpoint}`);
    console.log(`   Headers: ${JSON.stringify(config.headers, null, 2)}`);
    console.log('');
  });

  console.log('🔧 ШАБЛОН НАСТРОЙКИ В CURSOR:\n');
  console.log('1. Открыть Cursor Settings');
  console.log('2. Перейти в раздел "Models"');
  console.log('3. Нажать "Add Custom Model"');
  console.log('4. Заполнить поля:');
  console.log('   - Name: DialoGPT (Free)');
  console.log('   - Provider: Custom');
  console.log('   - API Base URL: https://api-inference.huggingface.co/models/');
  console.log('   - API Key: ваш Hugging Face токен');
  console.log('   - Model: microsoft/DialoGPT-medium');
  console.log('5. Сохранить и протестировать');

  console.log('\n⚡ БЫСТРЫЙ СТАРТ - HUGGING FACE:\n');
  console.log('1. Зарегистрируйтесь: https://huggingface.co/join');
  console.log('2. Создайте токен: https://huggingface.co/settings/tokens');
  console.log('3. Используйте любую модель из: https://huggingface.co/models');
  console.log('4. Добавьте в Cursor как кастомную модель');

  console.log('\n📊 МОНИТОРИНГ ИСПОЛЬЗОВАНИЯ:\n');
  console.log('• Hugging Face: https://huggingface.co/settings/billing');
  console.log('• Together AI: https://www.together.ai/dashboard');
  console.log('• Replicate: https://replicate.com/account/billing');
  console.log('• Fireworks: https://fireworks.ai/dashboard');
}

getFreeAPIKeys();
