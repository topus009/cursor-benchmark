'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Star, Clock, DollarSign, Zap, MessageSquare } from 'lucide-react'
import { ModelRatingForm } from './ModelRatingForm'
import { ModelBenchmarkDetails } from './ModelBenchmarkDetails'

interface AIModel {
  id: string
  name: string
  provider: string
  modelId: string
  displayName: string
  description?: string
  contextWindow?: number
  maxTokens?: number
  pricingInput?: number
  pricingOutput?: number
  isFree: boolean
  isRecommended: boolean
  category: string
  capabilities: string[]
  lastUpdated: string
  benchmarkResults: BenchmarkResult[]
  userRatings: UserRating[]
  _count: {
    benchmarkResults: number
    userRatings: number
  }
}

interface BenchmarkResult {
  id: string
  benchmarkType: string
  metricName: string
  metricValue: number
  unit?: string
  source: {
    displayName: string
  }
}

interface UserRating {
  rating: number
  speedRating?: number
  qualityRating?: number
  costRating?: number
}

interface ModelsComparisonTableProps {
  initialData?: AIModel[]
}

export function ModelsComparisonTable({ initialData = [] }: ModelsComparisonTableProps = {}) {
  const [models, setModels] = useState<AIModel[]>(initialData)
  const [loading, setLoading] = useState(initialData.length === 0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [ratingForm, setRatingForm] = useState<{ modelId: string; modelName: string } | null>(null)
  const [benchmarkDetails, setBenchmarkDetails] = useState<{ modelId: string; modelName: string; benchmarks: any[] } | null>(null)

  // Загружаем данные
  useEffect(() => {
    // Если переданы initialData, используем их
    if (initialData.length > 0) {
      setModels(initialData)
      setLoading(false)
    } else {
      // Иначе загружаем самостоятельно
      fetchModels()
    }
  }, [initialData])

  const fetchModels = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRatingSubmit = async (ratingData: {
    modelId: string
    rating: number
    speedRating?: number
    qualityRating?: number
    costRating?: number
    comment?: string
    taskType?: string
  }) => {
    // Перезагружаем данные после отправки рейтинга
    await fetchModels()
  }

  const openRatingForm = (modelId: string, modelName: string) => {
    setRatingForm({ modelId, modelName })
  }

  const closeRatingForm = () => {
    setRatingForm(null)
  }

  const openBenchmarkDetails = async (modelId: string, modelName: string) => {
    try {
      const response = await fetch(`/api/benchmarks?modelId=${modelId}`)
      if (response.ok) {
        const data = await response.json()
        setBenchmarkDetails({
          modelId,
          modelName,
          benchmarks: data.data || []
        })
      }
    } catch (error: unknown) {
      console.error('Error fetching benchmark details:', error)
    }
  }

  const closeBenchmarkDetails = () => {
    setBenchmarkDetails(null)
  }

  // Вычисляем метрики для каждой модели
  const modelsWithMetrics = useMemo(() => {
    return models.map(model => {
      // Вычисляем средние оценки пользователей
      const avgRating = model.userRatings.length > 0
        ? model.userRatings.reduce((sum, r) => sum + r.rating, 0) / model.userRatings.length
        : 0

      const avgSpeedRating = model.userRatings.length > 0
        ? model.userRatings
            .filter(r => r.speedRating)
            .reduce((sum, r) => sum + (r.speedRating || 0), 0) /
          model.userRatings.filter(r => r.speedRating).length || 0
        : 0

      const avgQualityRating = model.userRatings.length > 0
        ? model.userRatings
            .filter(r => r.qualityRating)
            .reduce((sum, r) => sum + (r.qualityRating || 0), 0) /
          model.userRatings.filter(r => r.qualityRating).length || 0
        : 0

      const avgCostRating = model.userRatings.length > 0
        ? model.userRatings
            .filter(r => r.costRating)
            .reduce((sum, r) => sum + (r.costRating || 0), 0) /
          model.userRatings.filter(r => r.costRating).length || 0
        : 0

      // Получаем ключевые бенчмарки
      const benchmarks = model.benchmarkResults.reduce((acc, result) => {
        if (!acc[result.metricName]) {
          acc[result.metricName] = []
        }
        acc[result.metricName].push(result)
        return acc
      }, {} as Record<string, BenchmarkResult[]>)

      // Вычисляем средние значения для ключевых метрик
      const avgResponseTime = benchmarks['avg_response_time']?.[0]?.metricValue || null
      const successRate = benchmarks['success_rate']?.[0]?.metricValue || null
      const passRate = benchmarks['pass_rate']?.[0]?.metricValue || null

      return {
        ...model,
        avgRating: avgRating || null,
        avgSpeedRating: avgSpeedRating || null,
        avgQualityRating: avgQualityRating || null,
        avgCostRating: avgCostRating || null,
        avgResponseTime,
        successRate,
        passRate,
        totalBenchmarks: model._count.benchmarkResults,
        totalRatings: model._count.userRatings
      }
    })
  }, [models])

  // Определяем колонки таблицы
  const columns = useMemo<ColumnDef<typeof modelsWithMetrics[0]>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => column.toggleSorting()}
          >
            Model
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-900">{row.original.displayName}</div>
            <div className="text-sm text-gray-500">{row.original.provider}</div>
            {row.original.isRecommended && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Recommended
              </span>
            )}
          </div>
        )
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
            {row.original.category}
          </span>
        )
      },
      {
        id: 'performance',
        header: 'Performance',
        cell: ({ row }) => {
          const model = row.original
          return (
            <div className="flex flex-col space-y-1">
              {/* Скорость */}
              {model.avgResponseTime && (
                <div className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="font-medium">{model.avgResponseTime}s</span>
                </div>
              )}

              {/* Качество кода */}
              {model.passRate && (
                <div className="flex items-center text-xs">
                  <Zap className="h-3 w-3 mr-1 text-green-500" />
                  <span className="font-medium">{(model.passRate * 100).toFixed(0)}%</span>
                </div>
              )}

              {/* Пользовательский рейтинг */}
              {model.avgRating && (
                <div className="flex items-center text-xs">
                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                  <span className="font-medium">{model.avgRating.toFixed(1)}</span>
                  <span className="text-gray-500 ml-1">({model.totalRatings})</span>
                </div>
              )}
            </div>
          )
        }
      },
      {
        accessorKey: 'isFree',
        header: 'Free',
        cell: ({ row }) => (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            row.original.isFree
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {row.original.isFree ? 'Free' : 'Paid'}
          </span>
        )
      },
      {
        id: 'pricing',
        header: 'Pricing',
        cell: ({ row }) => (
          <div className="text-xs">
            {row.original.pricingInput ? (
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                <span className="font-medium">${row.original.pricingInput}</span>
                <span className="text-gray-500">/1K</span>
              </div>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>
        )
      },
      {
        accessorKey: 'contextWindow',
        header: 'Context',
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {row.original.contextWindow ? `${row.original.contextWindow}K` : 'N/A'}
          </span>
        )
      },
      {
        id: 'benchmarks',
        header: 'Benchmarks',
        cell: ({ row }) => (
          <button
            onClick={() => openBenchmarkDetails(row.original.id, row.original.displayName)}
            className="text-xs hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            <span className="font-medium text-blue-600">{row.original.totalBenchmarks}</span>
            <span className="text-gray-500 ml-1">sources</span>
          </button>
        )
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => openRatingForm(row.original.id, row.original.displayName)}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Rate
          </button>
        )
      }
    ],
    []
  )

  const table = useReactTable({
    data: modelsWithMetrics,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Фильтры */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search models..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={table.getColumn('category')?.getFilterValue() as string || ''}
            onChange={(e) => table.getColumn('category')?.setFilterValue(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="coding">Coding</option>
            <option value="chat">Chat</option>
            <option value="vision">Vision</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-4 text-center text-gray-500">
                  No models found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {table.getRowModel().rows.length} of {modelsWithMetrics.length} models
          </div>
        </div>
      </div>

      {/* Форма рейтинга */}
      {ratingForm && (
        <ModelRatingForm
          modelId={ratingForm.modelId}
          modelName={ratingForm.modelName}
          onClose={closeRatingForm}
          onSubmit={handleRatingSubmit}
        />
      )}

      {/* Детали бенчмарков */}
      {benchmarkDetails && (
        <ModelBenchmarkDetails
          modelId={benchmarkDetails.modelId}
          modelName={benchmarkDetails.modelName}
          benchmarks={benchmarkDetails.benchmarks}
          onClose={closeBenchmarkDetails}
        />
      )}
    </div>
  )
}
