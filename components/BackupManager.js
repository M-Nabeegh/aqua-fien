'use client'
import { useState } from 'react'

export default function BackupManager() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [lastBackup, setLastBackup] = useState(null)

  const handleBackup = async () => {
    setIsBackingUp(true)
    setBackupStatus('Preparing backup...')

    try {
      setBackupStatus('Connecting to database...')
      
      const response = await fetch('/api/backup', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setBackupStatus('Downloading backup file...')
      
      // Get the backup data
      const backupData = await response.json()
      
      if (backupData.error) {
        throw new Error(backupData.details || backupData.error)
      }

      // Create and download the file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      })
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const fileName = `aquafine-backup-${new Date().toISOString().split('T')[0]}.json`
      link.download = fileName
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setBackupStatus(`✅ Backup completed successfully! Downloaded: ${fileName}`)
      setLastBackup({
        date: new Date().toISOString(),
        fileName: fileName,
        totalRecords: backupData.summary?.totalRecords || 'Unknown',
        totalTables: backupData.summary?.totalTables || 'Unknown'
      })

    } catch (error) {
      console.error('Backup error:', error)
      setBackupStatus(`❌ Backup failed: ${error.message}`)
    } finally {
      setIsBackingUp(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📦 Data Backup</h2>
            <p className="text-gray-600">Create and download complete backup of your data</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">What's included in the backup:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• All customers and customer pricing</li>
            <li>• All products and inventory data</li>
            <li>• All employees and their information</li>
            <li>• All sell orders and transaction history</li>
            <li>• All rider activities and accountability records</li>
            <li>• All advances (customer and employee)</li>
            <li>• All expenditure records</li>
          </ul>
        </div>
      </div>

      {/* Backup Action */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Backup</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isBackingUp 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
            }`}
          >
            {isBackingUp ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Creating Backup...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                </svg>
                Create Full Backup
              </div>
            )}
          </button>
          
          <div className="text-sm text-gray-500">
            Backup will be downloaded as a JSON file
          </div>
        </div>

        {/* Status */}
        {backupStatus && (
          <div className={`p-4 rounded-lg border ${
            backupStatus.includes('❌') 
              ? 'bg-red-50 border-red-200 text-red-800'
              : backupStatus.includes('✅')
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {isBackingUp && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              <span className="font-medium">{backupStatus}</span>
            </div>
          </div>
        )}
      </div>

      {/* Last Backup Info */}
      {lastBackup && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Last Backup</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Date & Time</div>
              <div className="font-semibold text-gray-800">{formatDate(lastBackup.date)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">File Name</div>
              <div className="font-semibold text-gray-800 text-sm">{lastBackup.fileName}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Records</div>
              <div className="font-semibold text-gray-800">{lastBackup.totalRecords}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Tables Backed Up</div>
              <div className="font-semibold text-gray-800">{lastBackup.totalTables}</div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Tips */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Backup Tips</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>Regular Backups:</strong> Create backups regularly (weekly/monthly) to ensure data safety.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>Safe Storage:</strong> Store backup files in multiple locations (cloud storage, external drives).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>File Format:</strong> Backups are in JSON format and can be imported into other systems.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>Data Security:</strong> Backup files contain sensitive data - keep them secure.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
