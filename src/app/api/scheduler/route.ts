import { NextRequest, NextResponse } from 'next/server'
import { scheduler } from '@/lib/services/scheduler.service'
import { isStaticExport, createStaticModeResponse } from '@/lib/api-utils'

export const dynamic = 'force-static'

export async function GET() {
  if (isStaticExport) {
    return NextResponse.json(createStaticModeResponse(), { status: 404 })
  }
  try {
    const status = scheduler.getStatus()

    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scheduler status'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'start':
        scheduler.start()
        return NextResponse.json({
          success: true,
          message: 'Scheduler started successfully'
        })

      case 'stop':
        scheduler.stop()
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped successfully'
        })

      case 'sync_models':
        await scheduler.runModelSync()
        return NextResponse.json({
          success: true,
          message: 'Model sync completed successfully'
        })

      case 'sync_benchmarks':
        await scheduler.runBenchmarkSync()
        return NextResponse.json({
          success: true,
          message: 'Benchmark sync completed successfully'
        })

      case 'full_sync':
        await scheduler.runFullSync()
        return NextResponse.json({
          success: true,
          message: 'Full sync completed successfully'
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error executing scheduler action:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute scheduler action'
      },
      { status: 500 }
    )
  }
}
