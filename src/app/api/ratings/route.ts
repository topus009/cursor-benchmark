import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStaticExport, createStaticModeResponse } from '@/lib/api-utils'

export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  if (isStaticExport) {
    return NextResponse.json(createStaticModeResponse(), { status: 404 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')

    let ratings

    if (modelId) {
      // Получаем оценки для конкретной модели
      ratings = await prisma.userRating.findMany({
        where: { modelId },
        include: {
          model: {
            select: {
              displayName: true,
              provider: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Получаем все оценки
      ratings = await prisma.userRating.findMany({
        include: {
          model: {
            select: {
              displayName: true,
              provider: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    // Вычисляем средние оценки
    const stats = await calculateRatingStats(modelId)

    return NextResponse.json({
      success: true,
      data: ratings,
      stats
    })
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ratings'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      modelId,
      userId,
      sessionId,
      rating,
      speedRating,
      qualityRating,
      costRating,
      comment,
      taskType
    } = body

    // Валидация
    if (!modelId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid rating data'
        },
        { status: 400 }
      )
    }

    // Проверяем существует ли модель
    const model = await prisma.aIModel.findUnique({
      where: { id: modelId }
    })

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: 'Model not found'
        },
        { status: 404 }
      )
    }

    // Создаем оценку
    const newRating = await prisma.userRating.create({
      data: {
        modelId,
        userId,
        sessionId: sessionId || generateSessionId(),
        rating,
        speedRating,
        qualityRating,
        costRating,
        comment,
        taskType
      },
      include: {
        model: {
          select: {
            displayName: true,
            provider: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newRating
    })
  } catch (error) {
    console.error('Error creating rating:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create rating'
      },
      { status: 500 }
    )
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function calculateRatingStats(modelId?: string | null) {
  const where = modelId ? { modelId } : {}

  const stats = await prisma.userRating.aggregate({
    where,
    _avg: {
      rating: true,
      speedRating: true,
      qualityRating: true,
      costRating: true
    },
    _count: {
      id: true
    }
  })

  return {
    totalRatings: stats._count.id,
    averageRating: stats._avg.rating,
    averageSpeedRating: stats._avg.speedRating,
    averageQualityRating: stats._avg.qualityRating,
    averageCostRating: stats._avg.costRating
  }
}
