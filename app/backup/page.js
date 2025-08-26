'use client'
import { Suspense } from 'react'
import BackupManager from '../../components/BackupManager'

export default function BackupPage() {
  return (
    <div className="bg-gray-100">
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }>
        <BackupManager />
      </Suspense>
    </div>
  )
}
