'use client'
import { useState } from 'react'

export default function BackupManager() {
  const [isLoading, setIsLoading] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [lastBackup, setLastBackup] = useState(null)

  const handleBackup = async () => {
    setIsLoading(true)
    setBackupStatus('Preparing backup...')
    
    try {
      setBackupStatus('Connecting to database...')
      
      const response = await fetch('/api/backup', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Backup failed')
      }

      setBackupStatus('Downloading backup file...')
      
      // Get the backup data
      const backupData = await response.json()

      if (backupData.error) {
        throw new Error(backupData.details || backupData.error)
      }

      // Create and download the backup file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `aquafine-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setLastBackup({
        date: new Date().toLocaleString(),
        tables: backupData.summary?.totalTables || 0,
        records: backupData.summary?.totalRecords || 0
      })

      setBackupStatus(`✅ Backup completed successfully! Downloaded ${backupData.summary?.totalRecords || 0} records from ${backupData.summary?.totalTables || 0} tables.`)

    } catch (error) {
      console.error('Backup failed:', error)
      setBackupStatus(`❌ Backup failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💾 Database Backup</h1>
          <p className="text-gray-600">Create and download a complete backup of your database</p>
        </div>

        {/* Backup Section */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">📥 Create Backup</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-800 mb-2">Create a complete backup of all your data including:</p>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Products and pricing information</li>
                <li>Customers and their advances</li>
                <li>Employees and salary data</li>
                <li>Sales orders and rider activities</li>
                <li>Expenditures and financial records</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleBackup}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Backup...
              </>
            ) : (
              <>
                💾 Create Backup
              </>
            )}
          </button>

          {backupStatus && (
            <div className={`mt-4 p-3 rounded-lg ${
              backupStatus.includes('✅') 
                ? 'bg-green-100 text-green-800' 
                : backupStatus.includes('❌')
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {backupStatus}
            </div>
          )}
        </div>

        {/* Last Backup Info */}
        {lastBackup && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Last Backup</h3>
            <div className="text-green-800 space-y-1">
              <p><strong>Date:</strong> {lastBackup.date}</p>
              <p><strong>Tables:</strong> {lastBackup.tables}</p>
              <p><strong>Records:</strong> {lastBackup.records.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
          <ul className="text-yellow-800 text-sm space-y-1">
            <li>• Backup files are downloaded to your computer in JSON format</li>
            <li>• Keep backup files secure as they contain sensitive business data</li>
            <li>• Regular backups are recommended before making major changes</li>
            <li>• Backup includes all active records from your database</li>
          </ul>
        </div>
      </div>
    </div>
  )
}