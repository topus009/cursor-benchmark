import { NextRequest, NextResponse } from 'next/server'
import { BenchmarkService } from '@/lib/services/benchmark.service'
import { isStaticExport, createStaticModeResponse } from '@/lib/api-utils'

export const dynamic = 'force-static'

const benchmarkService = new BenchmarkService()

export async function GET(request: NextRequest) {
  if (isStaticExport) {
    return NextResponse.json(createStaticModeResponse(), { status: 404 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')
    const sync = searchParams.get('sync')

    // Если запрошена синхронизация
    if (sync === 'true') {
      await benchmarkService.syncAllBenchmarks()
    }

    let data

    if (modelId) {
      // Получаем бенчмарки для конкретной модели
      data = await benchmarkService.getModelBenchmarks(modelId)
    } else {
      // Получаем сводку по всем моделям
      data = await benchmarkService.getBenchmarkSummary()
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching benchmarks:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch benchmarks'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Синхронизируем все бенчмарки
    await benchmarkService.syncAllBenchmarks()

    return NextResponse.json({
      success: true,
      message: 'Benchmarks synced successfully'
    })
  } catch (error) {
    console.error('Error syncing benchmarks:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync benchmarks'
      },
      { status: 500 }
    )
  }
}
