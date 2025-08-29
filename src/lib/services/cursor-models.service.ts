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
      // === FREE MODELS ===
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

      // === ANTHROPIC MODELS ===
      {
        id: 'claude-3-5-sonnet',
        name: 'claude-3-5-sonnet-20241022',
        provider: 'Anthropic',
        displayName: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model for complex reasoning and coding tasks',
        contextWindow: 200000,
        maxTokens: 8192,
        pricing: {
          input: 0.003,
          output: 0.015
        },
        isFree: false,
        isRecommended: true,
        category: 'coding',
        capabilities: ['code_generation', 'code_review', 'debugging', 'documentation', 'analysis', 'reasoning']
      },
      {
        id: 'claude-3-5-haiku',
        name: 'claude-3-5-haiku-20241022',
        provider: 'Anthropic',
        displayName: 'Claude 3.5 Haiku',
        description: 'Fast and efficient model for general tasks',
        contextWindow: 200000,
        maxTokens: 4096,
        pricing: {
          input: 0.0008,
          output: 0.004
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'summarization']
      },
      {
        id: 'claude-3-opus',
        name: 'claude-3-opus-20240229',
        provider: 'Anthropic',
        displayName: 'Claude 3 Opus',
        description: 'Most capable model for highly complex tasks',
        contextWindow: 200000,
        maxTokens: 4096,
        pricing: {
          input: 0.015,
          output: 0.075
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'analysis', 'reasoning', 'research', 'documentation']
      },
      {
        id: 'claude-3-sonnet',
        name: 'claude-3-sonnet-20240229',
        provider: 'Anthropic',
        displayName: 'Claude 3 Sonnet',
        description: 'Balanced model for general tasks',
        contextWindow: 200000,
        maxTokens: 4096,
        pricing: {
          input: 0.003,
          output: 0.015
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'coding']
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
        capabilities: ['chat', 'summarization', 'basic_coding']
      },

      // === OPENAI MODELS ===
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
        capabilities: ['chat', 'analysis', 'writing', 'coding', 'reasoning']
      },
      {
        id: 'gpt-4o-mini',
        name: 'gpt-4o-mini',
        provider: 'OpenAI',
        displayName: 'GPT-4o Mini',
        description: 'Affordable and intelligent small model',
        contextWindow: 128000,
        maxTokens: 16384,
        pricing: {
          input: 0.00015,
          output: 0.0006
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'basic_coding']
      },
      {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo',
        provider: 'OpenAI',
        displayName: 'GPT-4 Turbo',
        description: 'Advanced model with large context window',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.01,
          output: 0.03
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'analysis', 'reasoning', 'documentation']
      },
      {
        id: 'gpt-4',
        name: 'gpt-4',
        provider: 'OpenAI',
        displayName: 'GPT-4',
        description: 'Original GPT-4 model',
        contextWindow: 8192,
        maxTokens: 4096,
        pricing: {
          input: 0.03,
          output: 0.06
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'coding']
      },
      {
        id: 'gpt-3-5-turbo',
        name: 'gpt-3.5-turbo',
        provider: 'OpenAI',
        displayName: 'GPT-3.5 Turbo',
        description: 'Fast and affordable model',
        contextWindow: 16385,
        maxTokens: 4096,
        pricing: {
          input: 0.0005,
          output: 0.0015
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'basic_coding']
      },

      // === GOOGLE MODELS ===
      {
        id: 'gemini-1-5-pro',
        name: 'gemini-1.5-pro',
        provider: 'Google',
        displayName: 'Gemini 1.5 Pro',
        description: 'Advanced multimodal model from Google',
        contextWindow: 2097152,
        maxTokens: 8192,
        pricing: {
          input: 0.00025,
          output: 0.0005
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'analysis', 'reasoning', 'multimodal', 'documentation']
      },
      {
        id: 'gemini-1-5-flash',
        name: 'gemini-1.5-flash',
        provider: 'Google',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast multimodal model from Google',
        contextWindow: 1048576,
        maxTokens: 8192,
        pricing: {
          input: 0.000075,
          output: 0.0003
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'multimodal', 'basic_coding']
      },
      {
        id: 'gemini-pro',
        name: 'gemini-pro',
        provider: 'Google',
        displayName: 'Gemini Pro',
        description: 'Google\'s advanced language model',
        contextWindow: 30720,
        maxTokens: 4096,
        pricing: {
          input: 0.00025,
          output: 0.0005
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'basic_coding']
      },

      // === MISTRAL MODELS ===
      {
        id: 'mistral-large',
        name: 'mistral-large',
        provider: 'Mistral',
        displayName: 'Mistral Large',
        description: 'Most capable Mistral model',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.002,
          output: 0.006
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'analysis', 'reasoning', 'documentation']
      },
      {
        id: 'mistral-medium',
        name: 'mistral-medium',
        provider: 'Mistral',
        displayName: 'Mistral Medium',
        description: 'Balanced Mistral model',
        contextWindow: 32000,
        maxTokens: 4096,
        pricing: {
          input: 0.00081,
          output: 0.00243
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'coding']
      },
      {
        id: 'mistral-small',
        name: 'mistral-small',
        provider: 'Mistral',
        displayName: 'Mistral Small',
        description: 'Fast and efficient Mistral model',
        contextWindow: 32000,
        maxTokens: 4096,
        pricing: {
          input: 0.00027,
          output: 0.00081
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'basic_coding']
      },

      // === META MODELS ===
      {
        id: 'llama-3-2-90b',
        name: 'llama-3.2-90b',
        provider: 'Meta',
        displayName: 'Llama 3.2 90B',
        description: 'Large Llama model for complex tasks',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.00072,
          output: 0.00072
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'analysis', 'reasoning', 'documentation']
      },
      {
        id: 'llama-3-2-70b',
        name: 'llama-3.2-70b',
        provider: 'Meta',
        displayName: 'Llama 3.2 70B',
        description: 'Advanced Llama model',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.00054,
          output: 0.00054
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'analysis', 'reasoning', 'documentation']
      },
      {
        id: 'llama-3-2-11b',
        name: 'llama-3.2-11b',
        provider: 'Meta',
        displayName: 'Llama 3.2 11B',
        description: 'Efficient Llama model for general tasks',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.00015,
          output: 0.00015
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'basic_coding']
      },
      {
        id: 'llama-3-2-3b',
        name: 'llama-3.2-3b',
        provider: 'Meta',
        displayName: 'Llama 3.2 3B',
        description: 'Lightweight Llama model',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.00006,
          output: 0.00006
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'basic_coding']
      },

      // === CODESTRAL MODELS ===
      {
        id: 'codestral-mamba',
        name: 'codestral-mamba',
        provider: 'Mistral',
        displayName: 'Codestral Mamba',
        description: 'Specialized coding model with large context',
        contextWindow: 256000,
        maxTokens: 4096,
        pricing: {
          input: 0.00018,
          output: 0.00018
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'code_review', 'debugging', 'documentation']
      },
      {
        id: 'codestral-22b',
        name: 'codestral-22b',
        provider: 'Mistral',
        displayName: 'Codestral 22B',
        description: 'Powerful coding model',
        contextWindow: 32000,
        maxTokens: 4096,
        pricing: {
          input: 0.00018,
          output: 0.00018
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'code_review', 'debugging', 'documentation']
      },

      // === DEEPSEEK MODELS ===
      {
        id: 'deepseek-coder-33b',
        name: 'deepseek-coder-33b',
        provider: 'DeepSeek',
        displayName: 'DeepSeek Coder 33B',
        description: 'Specialized coding model from DeepSeek',
        contextWindow: 32768,
        maxTokens: 4096,
        pricing: {
          input: 0.00014,
          output: 0.00028
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'code_review', 'debugging', 'documentation']
      },
      {
        id: 'deepseek-chat-67b',
        name: 'deepseek-chat-67b',
        provider: 'DeepSeek',
        displayName: 'DeepSeek Chat 67B',
        description: 'Large conversational model from DeepSeek',
        contextWindow: 32768,
        maxTokens: 4096,
        pricing: {
          input: 0.00014,
          output: 0.00028
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'reasoning']
      },

      // === COHERE MODELS ===
      {
        id: 'command-r-plus',
        name: 'command-r-plus',
        provider: 'Cohere',
        displayName: 'Command R+',
        description: 'Advanced command model from Cohere',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.0015,
          output: 0.0045
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'reasoning']
      },
      {
        id: 'command-r',
        name: 'command-r',
        provider: 'Cohere',
        displayName: 'Command R',
        description: 'Balanced command model from Cohere',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.0005,
          output: 0.0015
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'reasoning']
      },

      // === FIREWORKS MODELS ===
      {
        id: 'fireworks-llama-3-1-70b',
        name: 'fireworks-llama-3.1-70b',
        provider: 'Fireworks',
        displayName: 'Llama 3.1 70B (Fireworks)',
        description: 'Optimized Llama model on Fireworks',
        contextWindow: 131072,
        maxTokens: 4096,
        pricing: {
          input: 0.0009,
          output: 0.0009
        },
        isFree: false,
        isRecommended: false,
        category: 'coding',
        capabilities: ['code_generation', 'analysis', 'reasoning', 'documentation']
      },

      // === TOGETHER MODELS ===
      {
        id: 'together-mixtral-8x7b',
        name: 'together-mixtral-8x7b',
        provider: 'Together',
        displayName: 'Mixtral 8x7B (Together)',
        description: 'Powerful mixture of experts model',
        contextWindow: 32768,
        maxTokens: 4096,
        pricing: {
          input: 0.0006,
          output: 0.0006
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'writing', 'reasoning']
      },

      // === GROK MODELS ===
      {
        id: 'grok-2',
        name: 'grok-2',
        provider: 'xAI',
        displayName: 'Grok 2',
        description: 'xAI\'s advanced reasoning model',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.002,
          output: 0.01
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'reasoning', 'humor']
      },
      {
        id: 'grok-1',
        name: 'grok-1',
        provider: 'xAI',
        displayName: 'Grok 1',
        description: 'Original Grok model',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: {
          input: 0.0008,
          output: 0.004
        },
        isFree: false,
        isRecommended: false,
        category: 'chat',
        capabilities: ['chat', 'analysis', 'reasoning', 'humor']
      }
    ]
  }
}
