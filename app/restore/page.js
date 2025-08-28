'use client'
import { useState } from 'react'

export default function RestorePage() {
  const [file, setFile] = useState(null)
  const [restoreStatus, setRestoreStatus] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreResults, setRestoreResults] = useState(null)

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

  const downloadSampleBackup = async () => {
    try {
      setRestoreStatus('Downloading current backup...')
      const response = await fetch('/api/backup')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aquafine-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setRestoreStatus('✅ Current backup downloaded')
    } catch (error) {
      setRestoreStatus(`❌ Download failed: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Database Restore
          </h1>

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
                  <p>This will update existing records with backup data. Make sure you have a current backup before proceeding.</p>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
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

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleRestore}
              disabled={!file || isRestoring}
              className={`px-6 py-2 rounded-md font-semibold text-white ${
                !file || isRestoring
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isRestoring ? '🔄 Restoring...' : '📥 Restore Database'}
            </button>

            <button
              onClick={downloadSampleBackup}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
            >
              💾 Download Current Backup
            </button>
          </div>

          {/* Status Message */}
          {restoreStatus && (
            <div className={`p-4 rounded-md mb-6 ${
              restoreStatus.includes('❌') 
                ? 'bg-red-50 text-red-800 border border-red-200'
                : restoreStatus.includes('✅')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {restoreStatus}
            </div>
          )}

          {/* Restore Results */}
          {restoreResults && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">Restore Results</h3>
              
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
                  <h4 className="font-medium">Table Details:</h4>
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
              )}

              {/* Errors */}
              {restoreResults.errors && restoreResults.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
                  <div className="space-y-1">
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

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Restore:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Download a current backup first (as a safety measure)</li>
              <li>Select your JSON backup file using the file input above</li>
              <li>Click &quot;Restore Database&quot; to start the restoration process</li>
              <li>The system will update existing records and add new ones</li>
              <li>Check the results table for any errors or conflicts</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <h4 className="font-medium text-blue-900">Backup Format Expected:</h4>
              <pre className="text-xs mt-2 text-blue-700 overflow-x-auto">
{`{
  "timestamp": "2025-08-28T...",
  "version": "1.0.0", 
  "tables": {
    "customers": { "count": 10, "data": [...] },
    "products": { "count": 5, "data": [...] }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
