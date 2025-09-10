import { NextResponse } from 'next/server'
import { isStaticExport, createStaticModeResponse } from '@/lib/api-utils'

export const dynamic = 'force-static'

export async function GET() {
  if (isStaticExport) {
    return NextResponse.json(createStaticModeResponse(), { status: 404 })
  }

  return NextResponse.json({
    success: true,
    message: 'API работает!',
    data: [
      { id: 'test1', name: 'Test Model 1', provider: 'Test' },
      { id: 'test2', name: 'Test Model 2', provider: 'Test' }
    ]
  })
}
