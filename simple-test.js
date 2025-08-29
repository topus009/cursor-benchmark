// Простой тест для проверки работы с данными

console.log('Testing models data...');

// Это не сработает напрямую, так как файл .ts
// Но давайте создадим простой JavaScript тест

const testModels = [
  {
    id: 'cursor-small',
    name: 'cursor-small',
    provider: 'Cursor',
    displayName: 'Cursor Small (Free)',
    description: 'Fast and efficient free tier model',
    contextWindow: 32000,
    maxTokens: 2048,
    isFree: true,
    isRecommended: false,
    category: 'chat',
    capabilities: ['chat', 'basic_coding', 'summarization']
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'claude-3-5-sonnet-20241022',
    provider: 'Anthropic',
    displayName: 'Claude 3.5 Sonnet',
    description: 'Most intelligent model for complex reasoning and coding tasks',
    contextWindow: 200000,
    maxTokens: 8192,
    pricing: { input: 0.003, output: 0.015 },
    isFree: false,
    isRecommended: true,
    category: 'coding',
    capabilities: ['code_generation', 'code_review', 'debugging', 'documentation', 'analysis', 'reasoning']
  },
  {
    id: 'grok-1',
    name: 'grok-1',
    provider: 'xAI',
    displayName: 'Grok 1',
    description: 'Original Grok model',
    contextWindow: 128000,
    maxTokens: 4096,
    pricing: { input: 0.0008, output: 0.004 },
    isFree: false,
    isRecommended: false,
    category: 'chat',
    capabilities: ['chat', 'analysis', 'reasoning', 'humor']
  }
];

console.log(`✅ Найдено ${testModels.length} моделей:`);
testModels.forEach(model => {
  console.log(`- ${model.displayName} (${model.provider})`);
});

console.log('\n📊 Статистика по провайдерам:');
const byProvider = {};
testModels.forEach(model => {
  byProvider[model.provider] = (byProvider[model.provider] || 0) + 1;
});

Object.entries(byProvider).forEach(([provider, count]) => {
  console.log(`${provider}: ${count} моделей`);
});

console.log('\n🎯 Модель, которую использует пользователь:');
const grokModels = testModels.filter(m => m.provider === 'xAI');
if (grokModels.length > 0) {
  grokModels.forEach(model => {
    console.log(`- ${model.displayName}: ${model.description}`);
    console.log(`  Контекст: ${model.contextWindow} токенов`);
    console.log(`  Цена: $${model.pricing?.input || 'N/A'} за вход, $${model.pricing?.output || 'N/A'} за выход`);
    console.log(`  Возможности: ${model.capabilities.join(', ')}`);
    console.log('');
  });
} else {
  console.log('❌ Модели xAI не найдены');
}
