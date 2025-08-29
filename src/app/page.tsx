'use client'

import { useState, useEffect } from 'react'
import { ModelsComparisonTable } from '@/components/ModelsComparisonTable'
import { DashboardHeader } from '@/components/DashboardHeader'
import { SyncStatus } from '@/components/SyncStatus'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [modelsData, setModelsData] = useState<any[]>([])

  useEffect(() => {
    // Загружаем начальные данные
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)

      // Загружаем модели из API
      const modelsResponse = await fetch('/api/models')
      if (!modelsResponse.ok) throw new Error('Failed to fetch models')

      const modelsResult = await modelsResponse.json()
      if (modelsResult.success) {
        setModelsData(modelsResult.data)
        console.log(`Loaded ${modelsResult.data.length} models`)
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncStatus('syncing')

      // Синхронизируем модели
      const modelsResponse = await fetch('/api/models?sync=true')
      if (!modelsResponse.ok) throw new Error('Failed to sync models')

      // Синхронизируем бенчмарки
      const benchmarksResponse = await fetch('/api/benchmarks?sync=true')
      if (!benchmarksResponse.ok) throw new Error('Failed to sync benchmarks')

      setSyncStatus('success')
      // Перезагружаем данные
      await loadInitialData()
    } catch (error) {
      console.error('Error syncing data:', error)
      setSyncStatus('error')
    } finally {
      // Сбрасываем статус через 3 секунды
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader onSync={handleSync} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Models Performance Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compare AI models performance, pricing, and user ratings across different benchmarks
          </p>
        </div>

        <SyncStatus status={syncStatus} />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : (
          <ModelsComparisonTable initialData={modelsData} />
        )}
      </main>
    </div>
  )
}
