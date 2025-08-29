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

} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Star, Clock, DollarSign, Zap, MessageSquare, Code, Brain, Bot } from 'lucide-react'
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
  isAvailableInCursor?: boolean
  isReasoning?: boolean
  isAgent?: boolean
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
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"
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
            <div className="flex items-center gap-2">
              <div className="font-medium text-gray-900 dark:text-white">{row.original.displayName}</div>
              <div className="flex items-center gap-1">
                {row.original.isAvailableInCursor && (
                  <Code
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    title="Доступно в Cursor IDE"
                  />
                )}
                {row.original.isReasoning && (
                  <Brain
                    className="h-4 w-4 text-purple-600 dark:text-purple-400"
                    title="Модель с reasoning способностями"
                  />
                )}
                {row.original.isAgent && (
                  <Bot
                    className="h-4 w-4 text-green-600 dark:text-green-400"
                    title="Модель с agent capabilities"
                  />
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{row.original.provider}</div>
            {row.original.isRecommended && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                Recommended
              </span>
            )}
          </div>
        )
      },
      {
        id: 'costValue',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"
            onClick={() => column.toggleSorting()}
          >
            Cost/Value
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </button>
        ),
        accessorFn: (row) => {
          // Функция для расчета Cost/Value скора
          const calculateScore = (model: any) => {
            let qualityScore = 0;
            if (model.avgRating) qualityScore += model.avgRating * 1.2;
            if (model.passRate) qualityScore += model.passRate / 10;
            qualityScore = Math.min(10, qualityScore);

            let speedScore = 5;
            if (model.avgResponseTime) {
              speedScore = Math.max(0, Math.min(10, 10 - (model.avgResponseTime / 1000)));
            }

            let costScore = 1;
            if (model.pricingInput && !model.isFree) {
              costScore = Math.max(0.1, Math.min(5, 5 / (1 + model.pricingInput * 1000)));
            }

            return (qualityScore + speedScore) / costScore;
          };

          return calculateScore(row);
        },
        sortingFn: (rowA, rowB) => {
          // Функция для расчета Cost/Value скора
          const calculateScore = (row: any) => {
            let qualityScore = 0;
            if (row.avgRating) qualityScore += row.avgRating * 1.2;
            if (row.passRate) qualityScore += row.passRate / 10;
            qualityScore = Math.min(10, qualityScore);

            let speedScore = 5;
            if (row.avgResponseTime) {
              speedScore = Math.max(0, Math.min(10, 10 - (row.avgResponseTime / 1000)));
            }

            let costScore = 1;
            if (row.pricingInput && !row.isFree) {
              costScore = Math.max(0.1, Math.min(5, 5 / (1 + row.pricingInput * 1000)));
            }

            return (qualityScore + speedScore) / costScore;
          };

          const scoreA = calculateScore(rowA.original);
          const scoreB = calculateScore(rowB.original);

          return scoreA - scoreB; // По возрастанию (меньшие значения первыми)
        },
        cell: ({ row }) => {
          // Повторяем расчет для отображения
          let qualityScore = 0;
          if (row.original.avgRating) qualityScore += row.original.avgRating * 1.2;
          if (row.original.passRate) qualityScore += row.original.passRate / 10;
          qualityScore = Math.min(10, qualityScore);

          let speedScore = 5;
          if (row.original.avgResponseTime) {
            speedScore = Math.max(0, Math.min(10, 10 - (row.original.avgResponseTime / 1000)));
          }

          let costScore = 1;
          if (row.original.pricingInput && !row.original.isFree) {
            costScore = Math.max(0.1, Math.min(5, 5 / (1 + row.original.pricingInput * 1000)));
          }

          const totalScore = (qualityScore + speedScore) / costScore;
          const hasData = row.original.benchmarkResults?.length > 0 || row.original.userRatings?.length > 0;

          // Определяем уровень и иконку
          const getCostValueInfo = (score: number) => {
            if (score > 15) {
              return {
                icon: '🚀',
                level: 'excellent',
                color: 'text-green-600 dark:text-green-400',
                tooltip: 'Отличное соотношение цена/качество'
              };
            } else if (score >= 5) {
              return {
                icon: '✅',
                level: 'good',
                color: 'text-blue-600 dark:text-blue-400',
                tooltip: 'Хорошее соотношение цена/качество'
              };
            } else {
              return {
                icon: '⚠️',
                level: 'poor',
                color: 'text-orange-600 dark:text-orange-400',
                tooltip: 'Дорого или низкое качество'
              };
            }
          };

          const costValueInfo = hasData ? getCostValueInfo(totalScore) : null;

          return (
            <div className="text-xs flex justify-center">
              {hasData ? (
                <div className="flex items-center gap-1">
                  <span className={`font-medium text-gray-900 dark:text-gray-100 ${costValueInfo?.color || ''}`}>
                    {totalScore.toFixed(1)}
                  </span>
                  {costValueInfo && (
                    <span
                      className="text-xs"
                      title={costValueInfo.tooltip}
                    >
                      {costValueInfo.icon}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">N/A</span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs">❓</span>
                </div>
              )}
            </div>
          );
        }
      },
      {
        id: 'performance',
        accessorFn: (row) => {
          // Вычисляем общий скор производительности (0-10 шкала)
          let score = 0
          if (row.avgRating) score += row.avgRating * 1.5 // Рейтинг весит больше
          if (row.passRate) score += row.passRate * 5 // Качество кода
          if (row.avgResponseTime) score -= Math.min(row.avgResponseTime / 10, 2) // Штраф за медленность
          return Math.max(0, Math.min(10, score))
        },
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"
            onClick={() => column.toggleSorting()}
          >
            Performance
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </button>
        ),
        sortingFn: 'alphanumeric',
        cell: ({ row }) => {
          const model = row.original
          return (
            <div className="flex flex-col space-y-1">
              {/* Скорость */}
              {model.avgResponseTime && (
                <div className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                  <span className={`font-medium ${
                    model.avgResponseTime < 1 ? 'text-green-600 dark:text-green-400' :
                    model.avgResponseTime < 3 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {model.avgResponseTime < 1
                      ? `${(model.avgResponseTime * 1000).toFixed(0)}ms`
                      : `${model.avgResponseTime.toFixed(1)}s`
                    }
                  </span>
                </div>
              )}

              {/* Качество кода */}
              {model.passRate && (
                <div className="flex items-center text-xs">
                  <Zap className="h-3 w-3 mr-1 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{(model.passRate * 100).toFixed(0)}%</span>
                </div>
              )}

              {/* Пользовательский рейтинг */}
              {model.avgRating && (
                <div className="flex items-center text-xs">
                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{model.avgRating.toFixed(1)}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">({model.totalRatings})</span>
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
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}>
            {row.original.isFree ? 'Free' : 'Paid'}
          </span>
        )
      },
      {
        id: 'pricing',
        accessorFn: (row) => {
          // Возвращаем специальное значение для бесплатных моделей
          if (row.isFree) return -1
          return row.pricingInput || 999999 // Высокое значение для моделей без цены
        },
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"
            onClick={() => column.toggleSorting()}
          >
            Pricing
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </button>
        ),
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.pricingInput || 999999 // Высокое значение для моделей без цены
          const b = rowB.original.pricingInput || 999999

          // Бесплатные модели (isFree = true) идут первыми
          if (rowA.original.isFree && !rowB.original.isFree) return -1
          if (!rowA.original.isFree && rowB.original.isFree) return 1

          return a - b // По возрастанию цены
        },
        cell: ({ row }) => (
          <div className="text-xs">
            {row.original.pricingInput ? (
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">${row.original.pricingInput?.toFixed(4)}</span>
                <span className="text-gray-600 dark:text-gray-400">/1K</span>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">N/A</span>
            )}
          </div>
        )
      },
      {
        accessorKey: 'contextWindow',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"
            onClick={() => column.toggleSorting()}
          >
            Context
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </button>
        ),
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.contextWindow || 0
          const b = rowB.original.contextWindow || 0
          return b - a // По убыванию (больший контекст выше)
        },
        cell: ({ row }) => (
          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
            {row.original.contextWindow ? `${row.original.contextWindow.toLocaleString()} K` : 'N/A'}
          </span>
        )
      },
      {
        id: 'benchmarks',
        header: 'Benchmarks',
        cell: ({ row }) => (
          <button
            onClick={() => openBenchmarkDetails(row.original.id, row.original.displayName)}
            className="text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
          >
            <span className="font-medium text-blue-600 dark:text-blue-400">{row.original.totalBenchmarks}</span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">sources</span>
          </button>
        )
      },
      {
        id: 'aider',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"
            onClick={() => column.toggleSorting()}
          >
            Aider Benchmark
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </button>
        ),
        accessorFn: (row) => {
          // Ищем aider benchmark среди результатов
          const aiderBenchmark = row.benchmarkResults.find(b =>
            b.metricName.toLowerCase().includes('aider') ||
            b.benchmarkType.toLowerCase().includes('aider')
          );
          return aiderBenchmark ? aiderBenchmark.metricValue : null;
        },
        sortingFn: (rowA, rowB) => {
          const aValue = rowA.original.benchmarkResults.find(b =>
            b.metricName.toLowerCase().includes('aider') ||
            b.benchmarkType.toLowerCase().includes('aider')
          )?.metricValue || 0;

          const bValue = rowB.original.benchmarkResults.find(b =>
            b.metricName.toLowerCase().includes('aider') ||
            b.benchmarkType.toLowerCase().includes('aider')
          )?.metricValue || 0;

          // Модели без данных идут в конец
          if (aValue === 0 && bValue === 0) return 0;
          if (aValue === 0) return 1;
          if (bValue === 0) return -1;

          return bValue - aValue; // Сортировка по убыванию (лучшие модели сверху)
        },
        cell: ({ row }) => {
          const aiderBenchmark = row.original.benchmarkResults.find(b =>
            b.metricName.toLowerCase().includes('aider') ||
            b.benchmarkType.toLowerCase().includes('aider')
          );

          return (
            <div className="text-xs">
              {aiderBenchmark ? (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {(aiderBenchmark.metricValue * 100).toFixed(1)}%
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">
                    Aider Score
                  </span>
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">N/A</span>
              )}
            </div>
          );
        }
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => openRatingForm(row.original.id, row.original.displayName)}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
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
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Фильтры */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search models..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />

        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                  No models found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
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
