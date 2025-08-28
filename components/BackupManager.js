'use client'
import { useState } from 'react'

export default function BackupManager() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [lastBackup, setLastBackup] = useState(null)
  
  // Restore states
  const [file, setFile] = useState(null)
  const [restoreStatus, setRestoreStatus] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreResults, setRestoreResults] = useState(null)

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

  // Restore functions
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile)
      setRestoreStatus('')
      setRestoreResults(null)
    } else {
      setRestoreStatus('Please select a valid JSON backup file')
      setFile(null)
    }
  }

  const handleRestore = async () => {
    if (!file) {
      setRestoreStatus('Please select a backup file first')
      return
    }

    setIsRestoring(true)
    setRestoreStatus('Reading backup file...')

    try {
      // Read the JSON file
      const fileText = await file.text()
      const backupData = JSON.parse(fileText)

      // Validate backup format
      if (!backupData.tables || !backupData.version) {
        throw new Error('Invalid backup format')
      }

      setRestoreStatus(`Restoring backup from ${backupData.timestamp}...`)

      // Send to restore API
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backupData)
      })

      const result = await response.json()

      if (result.success) {
        setRestoreStatus('✅ Database restored successfully!')
        setRestoreResults(result)
      } else {
        setRestoreStatus(`❌ Restore failed: ${result.details}`)
        setRestoreResults(result)
      }

    } catch (error) {
      console.error('Restore error:', error)
      setRestoreStatus(`❌ Error: ${error.message}`)
    } finally {
      setIsRestoring(false)
    }
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
            <h2 className="text-2xl font-bold text-gray-800">📦 Data Backup & Restore</h2>
            <p className="text-gray-600">Create backups and restore your data safely</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">What&apos;s included in the backup:</h3>
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
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
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
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              <span className="font-medium">{backupStatus}</span>
            </div>
          </div>
        )}
      </div>

      {/* Data Restore Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 Restore from Backup</h3>
        
        {/* Warning Message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Warning: Data Restoration
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This will update existing records with backup data. Create a backup first as a safety measure.</p>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select AquaFine JSON Backup File
          </label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Restore Button */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleRestore}
            disabled={!file || isRestoring}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              !file || isRestoring
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg'
            }`}
          >
            {isRestoring ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Restoring...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Restore Database
              </div>
            )}
          </button>
        </div>

        {/* Restore Status */}
        {restoreStatus && (
          <div className={`p-4 rounded-lg mb-4 ${
            restoreStatus.includes('❌') 
              ? 'bg-red-50 text-red-800 border border-red-200'
              : restoreStatus.includes('✅')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {isRestoring && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              <span className="font-medium">{restoreStatus}</span>
            </div>
          </div>
        )}

        {/* Restore Results */}
        {restoreResults && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold mb-3">Restore Results</h4>
            
            {restoreResults.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-blue-600">
                    {restoreResults.summary.totalTables}
                  </div>
                  <div className="text-sm text-gray-600">Tables Processed</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-green-600">
                    {restoreResults.summary.totalRecords}
                  </div>
                  <div className="text-sm text-gray-600">Records Restored</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-2xl font-bold text-red-600">
                    {restoreResults.summary.errors}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>
            )}

            {/* Table Details */}
            {restoreResults.restoredTables && (
              <div className="space-y-2">
                <h5 className="font-medium">Table Details:</h5>
                <div className="max-h-60 overflow-y-auto">
                  {Object.entries(restoreResults.restoredTables).map(([table, details]) => (
                    <div key={table} className="flex justify-between items-center bg-white p-2 rounded border">
                      <span className="font-medium">{table}</span>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          details.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : details.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {details.status}
                        </span>
                        <div className="text-sm text-gray-600">
                          {details.count}/{details.total || details.count} records
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {restoreResults.errors && restoreResults.errors.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-red-700 mb-2">Errors:</h5>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {restoreResults.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <strong>{error.table}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* Tips */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Backup & Restore Tips</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>Regular Backups:</strong> Create backups regularly (weekly/monthly) to ensure data safety.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>Before Restore:</strong> Always create a current backup before restoring old data.</span>
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
