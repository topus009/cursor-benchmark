'use client'

import { SchedulerAdmin } from '@/components/admin/SchedulerAdmin'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600">
            Manage data synchronization and system settings
          </p>
        </div>

        <div className="space-y-6">
          <SchedulerAdmin />
        </div>
      </div>
    </div>
  )
}
