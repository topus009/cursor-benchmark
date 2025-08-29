const fetch = require('node-fetch').default;

async function checkModels() {
  try {
    const response = await fetch('http://localhost:3000/api/models');
    const data = await response.json();

    console.log(`Total models: ${data.data.length}`);

    // Группируем по провайдерам
    const byProvider = {};
    data.data.forEach(model => {
      if (!byProvider[model.provider]) {
        byProvider[model.provider] = [];
      }
      byProvider[model.provider].push(model.displayName);
    });

    console.log('\nModels by provider:');
    Object.entries(byProvider).forEach(([provider, models]) => {
      console.log(`${provider}: ${models.length} models`);
      // Показываем первые 3 модели каждого провайдера
      console.log(`  Examples: ${models.slice(0, 3).join(', ')}`);
      console.log();
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkModels();
