'use client'

import { RefreshCw, Github, ExternalLink } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface DashboardHeaderProps {
  onSync: () => void
}

export function DashboardHeader({ onSync }: DashboardHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cursor AI Benchmark
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Переключатель темы */}
            <ThemeToggle />

            {/* Кнопка синхронизации */}
            <button
              onClick={onSync}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Data
            </button>

            {/* Ссылка на оригинальный сайт */}
            <a
              href="https://by-ai-monnef-9ff5d9c2460ae15d70e737f77eab719c6e8a4c64c2f99ca1c2.gitlab.io/2025/cursor_models_comparison/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Original Source
            </a>

            {/* Ссылка на GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
