// Утилиты для API routes

export const isStaticExport = process.env.NEXT_PUBLIC_USE_STATIC_DATA === 'true' || process.env.NODE_ENV === 'production'

export function createStaticModeResponse() {
  return {
    success: false,
    message: 'API недоступен в статическом режиме'
  }
}
