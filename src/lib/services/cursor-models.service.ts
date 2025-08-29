import { prisma } from '../prisma'

export interface CursorModel {
  id: string
  name: string
  provider: string
  displayName: string
  description?: string
  contextWindow?: number
  maxTokens?: number
  pricing?: {
    input: number
    output: number
  }
  isFree: boolean
  isRecommended: boolean
  category: string
  capabilities: string[]
}

// Источники данных о моделях Cursor (зарезервировано для будущего использования)
// const CURSOR_SOURCES = [
//   {
//     url: 'https://cursor.sh/docs/models',
//     name: 'cursor_official'
//   },
//   {
//     url: 'https://by-ai-monnef-9ff5d9c2460ae15d70e737f77eab719c6e8a4c64c2f99ca1c2.gitlab.io/2025/cursor_models_comparison/',
//     name: 'monnef_comparison'
//   }
// ]

export class CursorModelsService {
  /**
   * Синхронизирует модели из различных источников
   */
  async syncModels() {
    try {
      console.log('Starting Cursor models sync...')

      // Получаем данные из официального источника
      const models = await this.fetchFromOfficialSource()

      // Сохраняем или обновляем модели в БД
      for (const model of models) {
        await this.upsertModel(model)
      }

      console.log(`Synced ${models.length} Cursor models`)
      return models
    } catch (error) {
      console.error('Error syncing Cursor models:', error)
      throw error
    }
  }

  /**
   * Получает модели из официального источника Cursor
   */
  private async fetchFromOfficialSource(): Promise<CursorModel[]> {
    // В реальном проекте здесь был бы парсинг официальной документации
    // или API Cursor. Пока используем моковые данные
    return this.getMockCursorModels()
  }

  /**
   * Получает модели из источника monnef
   */
  private async fetchFromMonnefSource(): Promise<Partial<CursorModel>[]> {
    // Здесь будет парсинг HTML страницы monnef
    // Пока возвращаем пустой массив
    return []
  }

  /**
   * Сохраняет или обновляет модель в БД
   */
  private async upsertModel(model: CursorModel) {
    return prisma.aIModel.upsert({
      where: { modelId: model.id },
      update: {
        name: model.name,
        provider: model.provider,
        displayName: model.displayName,
        description: model.description,
        contextWindow: model.contextWindow,
        maxTokens: model.maxTokens,
        pricingInput: model.pricing?.input,
        pricingOutput: model.pricing?.output,
        isFree: model.isFree,
        isRecommended: model.isRecommended,
        category: model.category,
        capabilities: JSON.stringify(model.capabilities),
        lastUpdated: new Date()
      },
      create: {
        modelId: model.id,
        name: model.name,
        provider: model.provider,
        displayName: model.displayName,
        description: model.description,
        contextWindow: model.contextWindow,
        maxTokens: model.maxTokens,
        pricingInput: model.pricing?.input,
        pricingOutput: model.pricing?.output,
        isFree: model.isFree,
        isRecommended: model.isRecommended,
        category: model.category,
        capabilities: JSON.stringify(model.capabilities)
      }
    })
  }

  /**
   * Получает все модели из БД
   */
  async getAllModels() {
    const models = await prisma.aIModel.findMany({
      include: {
        benchmarkResults: {
          include: {
            source: true
          }
        },
        userRatings: true,
        _count: {
          select: {
            benchmarkResults: true,
            userRatings: true
          }
        }
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    })

    // Преобразуем capabilities обратно в массив
    return models.map(model => ({
      ...model,
      capabilities: JSON.parse(model.capabilities)
    }))
  }

  /**
   * Моковые данные для тестирования
   */
  private getMockCursorModels(): CursorModel[] {
    return [
      {
        id: 'claude-3-5-sonnet',
        name: 'claude-3-5-sonnet-20241022',
        provider: 'Anthropic',
        displayName: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model for complex reasoning tasks',
        contextWindow: 200000,
        maxTokens: 8192,
        pricing: {
          input: 0.003,
          output: 0.015
        },
        isFree: false,
        isRecommended: true,
        category: 'coding',
        capabilities: ['code_generation', 'code_review', 'debugging', 'documentation']
      },
      {
        id: 'gpt-4o',
        name: 'gpt-4o',
        provider: 'OpenAI',
        displayName: 'GPT-4o',
        description: 'Fast and capable model for general tasks',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.005,
          output: 0.015
        },
        isFree: false,
        isRecommended: true,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing']
      },
      {
        id: 'claude-3-haiku',
        name: 'claude-3-haiku-20240307',
        provider: 'Anthropic',
        displayName: 'Claude 3 Haiku',
        description: 'Fast and efficient for simple tasks',
        contextWindow: 200000,
        maxTokens: 4096,
        pricing: {
          input: 0.00025,
          output: 0.00125
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'summarization']
      },
      {
        id: 'cursor-small',
        name: 'cursor-small',
        provider: 'Cursor',
        displayName: 'Cursor Small (Free)',
        description: 'Free tier model for basic tasks',
        contextWindow: 32000,
        maxTokens: 2048,
        isFree: true,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'basic_coding']
      }
    ]
  }
}
