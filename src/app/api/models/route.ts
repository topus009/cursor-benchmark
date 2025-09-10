import { NextRequest, NextResponse } from 'next/server'
import { CursorModelsService } from '@/lib/services/cursor-models.service'
import { isStaticExport, createStaticModeResponse } from '@/lib/api-utils'

export const dynamic = 'force-static'

const modelsService = new CursorModelsService()

export async function GET(request: NextRequest) {
  if (isStaticExport) {
    return NextResponse.json(createStaticModeResponse(), { status: 404 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const sync = searchParams.get('sync')

    // Если запрошена синхронизация
    if (sync === 'true') {
      await modelsService.syncModels()
    }

    // Получаем все модели
    const models = await modelsService.getAllModels()

    return NextResponse.json({
      success: true,
      data: models,
      count: models.length
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch models'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Синхронизируем модели
    const models = await modelsService.syncModels()

    return NextResponse.json({
      success: true,
      message: `Synced ${models.length} models`,
      data: models
    })
  } catch (error) {
    console.error('Error syncing models:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync models'
      },
      { status: 500 }
    )
  }
}
