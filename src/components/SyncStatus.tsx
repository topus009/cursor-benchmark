'use client'

import { CheckCircle, XCircle, Loader } from 'lucide-react'

interface SyncStatusProps {
  status: 'idle' | 'syncing' | 'success' | 'error'
}

export function SyncStatus({ status }: SyncStatusProps) {
  if (status === 'idle') {
    return null
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: <Loader className="h-5 w-5 animate-spin" />,
          message: 'Synchronizing data...',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        }
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          message: 'Data synchronized successfully!',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        }
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5" />,
          message: 'Failed to synchronize data. Please try again.',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()

  if (!config) return null

  return (
    <div className={`${config.bgColor} ${config.borderColor} ${config.textColor} px-4 py-3 rounded-md border mb-6`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            {config.message}
          </p>
        </div>
      </div>
    </div>
  )
}
