import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API работает!',
    data: [
      { id: 'test1', name: 'Test Model 1', provider: 'Test' },
      { id: 'test2', name: 'Test Model 2', provider: 'Test' }
    ]
  })
}
