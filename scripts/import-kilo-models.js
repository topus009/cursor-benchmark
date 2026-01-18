const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function importKiloModels() {
  const inputPath = path.join(__dirname, '..', 'kilo-code-models.json');
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing models file: ${inputPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const models = payload.models || [];

  if (models.length === 0) {
    console.log('No models found to import.');
    return;
  }

  console.log(`Importing ${models.length} models...`);

  await prisma.aIModel.deleteMany();

  const data = models.map(model => ({
    modelId: model.id,
    name: model.name,
    provider: model.provider,
    displayName: model.displayName,
    description: model.description,
    contextWindow: model.contextWindow ?? null,
    maxTokens: model.maxTokens ?? null,
    pricingInput: model.pricing?.input ?? null,
    pricingOutput: model.pricing?.output ?? null,
    isFree: model.isFree,
    isRecommended: model.isRecommended,
    isAvailableInCursor: model.isAvailableInCursor ?? true,
    isReasoning: model.isReasoning ?? false,
    isAgent: model.isAgent ?? false,
    category: model.category || 'chat',
    capabilities: JSON.stringify(model.capabilities || [])
  }));

  await prisma.aIModel.createMany({ data });

  console.log('Import completed.');
}

async function main() {
  try {
    await importKiloModels();
  } catch (error) {
    console.error('Import failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
