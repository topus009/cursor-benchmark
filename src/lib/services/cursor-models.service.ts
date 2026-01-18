import fs from 'fs'
import path from 'path'
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
  isAvailableInCursor?: boolean
  isReasoning?: boolean
  isAgent?: boolean
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
   * Синхронизирует модели Kilo Code из локального списка
   */
  async syncModels() {
    try {
      console.log('Starting Kilo Code models sync...')

      // Получаем данные из официального источника
      const models = await this.fetchFromOfficialSource()

      await prisma.aIModel.deleteMany()

      // Сохраняем или обновляем модели в БД
      for (const model of models) {
        await this.upsertModel(model)
      }

      console.log(`Synced ${models.length} Kilo Code models`)
      return models
    } catch (error) {
      console.error('Error syncing Cursor models:', error)
      throw error
    }
  }

  /**
   * Получает модели из официального источника Kilo Code
   */
  private async fetchFromOfficialSource(): Promise<CursorModel[]> {
    // Пока используем локальный список моделей Kilo Code
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
        isAvailableInCursor: model.isAvailableInCursor || false, // Только из HTML файла
        isReasoning: model.isReasoning || false,
        isAgent: model.isAgent || false,
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
        isAvailableInCursor: model.isAvailableInCursor || false, // Только из HTML файла
        isReasoning: model.isReasoning || false,
        isAgent: model.isAgent || false,
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
    const dataPath = path.join(process.cwd(), 'kilo-code-models.json')
    const raw = fs.readFileSync(dataPath, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed.models || []
  }
}
