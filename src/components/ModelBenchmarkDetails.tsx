'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, ExternalLink } from 'lucide-react'

interface BenchmarkResult {
  id: string
  benchmarkType: string
  metricName: string
  metricValue: number
  unit?: string
  source: {
    displayName: string
    category: string
    url?: string
  }
}

interface ModelBenchmarkDetailsProps {
  modelId: string
  modelName: string
  benchmarks: BenchmarkResult[]
  onClose: () => void
}

export function ModelBenchmarkDetails({ modelId, modelName, benchmarks, onClose }: ModelBenchmarkDetailsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Группируем бенчмарки по категориям
  const categories = ['all', ...Array.from(new Set(benchmarks.map(b => b.source.category)))]

  // Фильтруем бенчмарки по выбранной категории
  const filteredBenchmarks = selectedCategory === 'all'
    ? benchmarks
    : benchmarks.filter(b => b.source.category === selectedCategory)

  // Группируем по источникам для отображения
  const benchmarksBySource = filteredBenchmarks.reduce((acc, benchmark) => {
    const sourceName = benchmark.source.displayName
    if (!acc[sourceName]) {
      acc[sourceName] = []
    }
    acc[sourceName].push(benchmark)
    return acc
  }, {} as Record<string, BenchmarkResult[]>)

  const getCategoryColor = (category: string) => {
    const colors = {
      coding: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      knowledge: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      reasoning: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      math: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      science: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      multilingual: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      chat: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      safety: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      comprehensive: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }

  const formatValue = (value: number, unit?: string) => {
    if (unit === '%') {
      return `${(value * 100).toFixed(1)}%`
    }
    if (unit === '/10') {
      return `${value.toFixed(1)}/10`
    }
    if (value < 1 && value > 0) {
      return value.toFixed(3)
    }
    return value.toFixed(2)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Benchmark Details - {modelName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Category Filter */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Benchmarks by Source */}
          <div className="space-y-4">
            {Object.entries(benchmarksBySource).map(([sourceName, sourceBenchmarks]) => (
              <div key={sourceName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{sourceName}</h4>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      getCategoryColor(sourceBenchmarks[0]?.source.category || '')
                    }`}>
                      {sourceBenchmarks[0]?.source.category}
                    </span>
                  </div>
                  {sourceBenchmarks[0]?.source.url && (
                    <a
                      href={sourceBenchmarks[0].source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sourceBenchmarks.map((benchmark) => (
                    <div key={benchmark.id} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {benchmark.benchmarkType} - {benchmark.metricName}
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatValue(benchmark.metricValue, benchmark.unit)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredBenchmarks.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No benchmarks found for selected category
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Total benchmarks: {filteredBenchmarks.length}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
