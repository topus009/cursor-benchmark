'use client'

import { useState, useEffect } from 'react'
import { Play, Square, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface SchedulerStatus {
  isRunning: boolean
  nextModelSync: string | null
  nextBenchmarkSync: string | null
  nextFullSync: string | null
}

export function SchedulerAdmin() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/scheduler')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (action: string) => {
    try {
      setActionLoading(action)
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        await fetchStatus() // Обновляем статус после выполнения действия
      } else {
        throw new Error('Action failed')
      }
    } catch (error) {
      console.error(`Error executing action ${action}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Scheduler Management</h2>
        <button
          onClick={fetchStatus}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Статус планировщика */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          {status?.isRunning ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700 font-medium">Scheduler is running</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-yellow-700 font-medium">Scheduler is stopped</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Next Model Sync</span>
            </div>
            <p className="text-sm text-gray-600">
              {status?.nextModelSync ? new Date(status.nextModelSync).toLocaleString() : 'Not scheduled'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Next Benchmark Sync</span>
            </div>
            <p className="text-sm text-gray-600">
              {status?.nextBenchmarkSync ? new Date(status.nextBenchmarkSync).toLocaleString() : 'Not scheduled'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Next Full Sync</span>
            </div>
            <p className="text-sm text-gray-600">
              {status?.nextFullSync ? new Date(status.nextFullSync).toLocaleString() : 'Not scheduled'}
            </p>
          </div>
        </div>
      </div>

      {/* Управление планировщиком */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Scheduler Controls</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => executeAction('start')}
            disabled={actionLoading === 'start' || status?.isRunning}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'start' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Scheduler
          </button>

          <button
            onClick={() => executeAction('stop')}
            disabled={actionLoading === 'stop' || !status?.isRunning}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'stop' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            Stop Scheduler
          </button>
        </div>
      </div>

      {/* Ручная синхронизация */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Sync</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => executeAction('sync_models')}
            disabled={actionLoading === 'sync_models'}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'sync_models' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Models
          </button>

          <button
            onClick={() => executeAction('sync_benchmarks')}
            disabled={actionLoading === 'sync_benchmarks'}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'sync_benchmarks' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Benchmarks
          </button>

          <button
            onClick={() => executeAction('full_sync')}
            disabled={actionLoading === 'full_sync'}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'full_sync' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Full Sync
          </button>
        </div>
      </div>
    </div>
  )
}
