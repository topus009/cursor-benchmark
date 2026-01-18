const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'kilo-code-models.md');
const outputPath = path.join(__dirname, '..', 'kilo-code-models.json');

function slugify(value) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'model';
}

function parseKiloModels() {
  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.split(/\r?\n/);

  let section = null;
  const recommendedOrder = [];
  const allOrder = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes('Рекомендуемые модели')) {
      section = 'recommended';
      continue;
    }

    if (line.includes('Все модели')) {
      section = 'all';
      continue;
    }

    if (line.startsWith('_')) continue;

    if (section === 'recommended') {
      recommendedOrder.push(line);
      continue;
    }

    if (section === 'all') {
      allOrder.push(line);
    }
  }

  const recommendedSet = new Set(recommendedOrder);
  const ordered = [
    ...recommendedOrder,
    ...allOrder.filter(entry => !recommendedSet.has(entry))
  ];

  const usedIds = new Map();
  const models = ordered.map((displayName, index) => {
    let provider = 'Unknown';
    if (displayName.includes(':')) {
      provider = displayName.split(':')[0].trim();
    } else if (displayName.includes('/')) {
      provider = displayName.split('/')[0].trim();
    } else {
      const firstToken = displayName.split(' ')[0];
      provider = firstToken || 'Unknown';
    }

    const isFree = /\bfree\b/i.test(displayName);
    const isReasoning = /\b(reasoning|thinking)\b/i.test(displayName);
    const isRecommended = recommendedSet.has(displayName);

    let baseId = slugify(displayName);
    const seen = usedIds.get(baseId) || 0;
    if (seen > 0) {
      baseId = `${baseId}-${seen + 1}`;
    }
    usedIds.set(baseId, seen + 1);

    return {
      id: baseId,
      name: baseId,
      provider,
      displayName,
      description: 'Model available in Kilo Code',
      isFree,
      isRecommended,
      isAvailableInCursor: true,
      isReasoning,
      isAgent: false,
      category: 'chat',
      capabilities: [],
      sortIndex: index + 1
    };
  });

  return {
    models,
    recommended: recommendedOrder,
    generatedAt: new Date().toISOString()
  };
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Missing input file: ${inputPath}`);
    process.exit(1);
  }

  const data = parseKiloModels();
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Wrote ${data.models.length} models to ${outputPath}`);
}

if (require.main === module) {
  main();
}
