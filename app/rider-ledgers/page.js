'use client'
import { useEffect, useState } from 'react'

export default function RiderLedgersPage() {
  const [riderActivities, setRiderActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedSalesman, setSelectedSalesman] = useState('')

  // Sample salesman representatives
  const salesmanRepresentatives = [
    'Ahmad Ali',
    'Muhammad Hassan',
    'Tariq Khan',
    'Bilal Ahmed',
    'Usman Malik'
  ]

  useEffect(() => {
    fetchRiderActivities()
  }, [])

  const fetchRiderActivities = async () => {
    try {
      const response = await fetch('/api/rider-activities')
      if (response.ok) {
        const data = await response.json()
        setRiderActivities(data)
      }
    } catch (error) {
      console.error('Error fetching rider activities:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter activities based on date range and salesman
  const getFilteredActivities = () => {
    let filtered = riderActivities

    if (fromDate && toDate) {
      filtered = filtered.filter(activity => 
        activity.date >= fromDate && activity.date <= toDate
      )
    }

    if (selectedSalesman) {
      filtered = filtered.filter(activity => 
        activity.salesmanRepresentative === selectedSalesman
      )
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // Calculate accountability for each activity
  const calculateAccountability = (activity) => {
    return activity.filledBottlesSent - activity.filledProductBoughtBack
  }

  // Calculate summary statistics
  const getSummaryStats = (activities) => {
    const stats = {
      totalEmptyReceived: 0,
      totalFilledSent: 0,
      totalBoughtBack: 0,
      totalAccountability: 0,
      averageAccountability: 0,
      activitiesCount: activities.length
    }

    activities.forEach(activity => {
      stats.totalEmptyReceived += activity.emptyBottlesReceived
      stats.totalFilledSent += activity.filledBottlesSent
      stats.totalBoughtBack += activity.filledProductBoughtBack
      stats.totalAccountability += calculateAccountability(activity)
    })

    stats.averageAccountability = stats.activitiesCount > 0 
      ? stats.totalAccountability / stats.activitiesCount 
      : 0

    return stats
  }

  // Get unique salesmen from activities
  const getUniqueSalesmen = () => {
    const salesmen = [...new Set(riderActivities.map(activity => activity.salesmanRepresentative))]
    return salesmen.sort()
  }

  const filteredActivities = getFilteredActivities()
  const summaryStats = getSummaryStats(filteredActivities)
  const uniqueSalesmen = getUniqueSalesmen()

  // Print functionality
  const printLedger = () => {
    const periodText = fromDate && toDate ? `${fromDate} to ${toDate}` : 'All Time'
    const salesmanText = selectedSalesman ? selectedSalesman : 'All Salesmen'
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>AquaFine - Rider Activities Ledger</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
            .filters { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .summary { background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            .table th { background-color: #f8f9fa; font-weight: bold; }
            .accountability-positive { background-color: #d4edda; color: #155724; }
            .accountability-negative { background-color: #f8d7da; color: #721c24; }
            .accountability-zero { background-color: #e2e3e5; color: #383d41; }
            .text-center { text-align: center; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
            .summary-item { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AquaFine - Rider Activities Ledger</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="filters">
            <h3>📋 Report Filters</h3>
            <p><strong>Period:</strong> ${periodText}</p>
            <p><strong>Salesman:</strong> ${salesmanText}</p>
            <p><strong>Total Activities:</strong> ${filteredActivities.length}</p>
          </div>

          <div class="summary">
            <h3>📊 Summary Statistics</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <h4>📦 Empty Bottles</h4>
                <p><strong>${summaryStats.totalEmptyReceived}</strong> received</p>
              </div>
              <div class="summary-item">
                <h4>🚛 Filled Bottles</h4>
                <p><strong>${summaryStats.totalFilledSent}</strong> sent</p>
              </div>
              <div class="summary-item">
                <h4>🔄 Bought Back</h4>
                <p><strong>${summaryStats.totalBoughtBack}</strong> returned</p>
              </div>
              <div class="summary-item">
                <h4>📈 Total Accountability</h4>
                <p><strong>${summaryStats.totalAccountability}</strong> bottles</p>
              </div>
              <div class="summary-item">
                <h4>📊 Average Accountability</h4>
                <p><strong>${summaryStats.averageAccountability.toFixed(1)}</strong> bottles</p>
              </div>
              <div class="summary-item">
                <h4>🎯 Efficiency Rate</h4>
                <p><strong>${summaryStats.totalFilledSent > 0 ? ((summaryStats.totalAccountability / summaryStats.totalFilledSent) * 100).toFixed(1) : 0}%</strong></p>
              </div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Salesman</th>
                <th>Empty Received</th>
                <th>Filled Sent</th>
                <th>Bought Back</th>
                <th>Accountability</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              ${filteredActivities.map(activity => {
                const accountability = calculateAccountability(activity)
                const performance = activity.filledBottlesSent > 0 ? ((accountability / activity.filledBottlesSent) * 100).toFixed(1) : '0'
                return `
                  <tr>
                    <td>${new Date(activity.date).toLocaleDateString()}</td>
                    <td>${activity.salesmanRepresentative}</td>
                    <td class="text-center">${activity.emptyBottlesReceived}</td>
                    <td class="text-center">${activity.filledBottlesSent}</td>
                    <td class="text-center">${activity.filledProductBoughtBack}</td>
                    <td class="text-center ${accountability > 0 ? 'accountability-positive' : accountability < 0 ? 'accountability-negative' : 'accountability-zero'}">${accountability}</td>
                    <td class="text-center">${performance}%</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
            <p>AquaFine - Premium Water Supply Management System</p>
            <p>Accountability Formula: Filled Bottles Sent - Bottles Delivered (Bought Back)</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rider ledger...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Rider Activities Ledger</h1>
        <p className="text-gray-600">Comprehensive tracking and analytics for rider activities</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          🔍 Filters & Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Salesman Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">👨‍💼 Salesman</label>
            <select
              value={selectedSalesman}
              onChange={(e) => setSelectedSalesman(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Salesmen</option>
              {uniqueSalesmen.map((salesman) => (
                <option key={salesman} value={salesman}>
                  {salesman}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {fromDate && toDate && (
              <span>📊 Showing data from {fromDate} to {toDate}</span>
            )}
            {selectedSalesman && (
              <span className="ml-4">👨‍💼 Filtered by: {selectedSalesman}</span>
            )}
            {!fromDate && !toDate && !selectedSalesman && (
              <span>📋 Showing all rider activities</span>
            )}
          </div>
          
          <button
            onClick={printLedger}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            🖨️ Print Ledger
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Empty Received</p>
              <p className="text-2xl font-bold text-blue-600">{summaryStats.totalEmptyReceived}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Filled Sent</p>
              <p className="text-2xl font-bold text-green-600">{summaryStats.totalFilledSent}</p>
            </div>
            <div className="text-3xl">🚛</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bought Back</p>
              <p className="text-2xl font-bold text-orange-600">{summaryStats.totalBoughtBack}</p>
            </div>
            <div className="text-3xl">🔄</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Accountability</p>
              <p className={`text-2xl font-bold ${summaryStats.totalAccountability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summaryStats.totalAccountability}
              </p>
            </div>
            <div className="text-3xl">{summaryStats.totalAccountability >= 0 ? '📈' : '📉'}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Accountability</p>
              <p className={`text-2xl font-bold ${summaryStats.averageAccountability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summaryStats.averageAccountability.toFixed(1)}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activities Count</p>
              <p className="text-2xl font-bold text-indigo-600">{summaryStats.activitiesCount}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>
      </div>

      {/* Detailed Ledger */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📋 Detailed Activity Ledger
        </h2>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No activities found</p>
            <p className="text-gray-400">Try adjusting your filters or add new activities</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Salesman</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Empty Received</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Filled Sent</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Bought Back</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Accountability</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Performance</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => {
                  const accountability = calculateAccountability(activity)
                  const performance = activity.filledBottlesSent > 0 
                    ? ((accountability / activity.filledBottlesSent) * 100).toFixed(1) 
                    : '0'
                  
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3">
                        {new Date(activity.date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        {activity.salesmanRepresentative}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          📦 {activity.emptyBottlesReceived}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          🚛 {activity.filledBottlesSent}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          🔄 {activity.filledProductBoughtBack}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-medium ${
                          accountability > 0 
                            ? 'bg-green-100 text-green-800' 
                            : accountability < 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {accountability > 0 ? '📈' : accountability < 0 ? '📉' : '⚖️'} {accountability}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-medium ${
                          parseFloat(performance) >= 90 
                            ? 'bg-green-100 text-green-800' 
                            : parseFloat(performance) >= 70 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          🎯 {performance}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="text-center">
        <a
          href="/rider-inout"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          ➕ Add New Activity
        </a>
      </div>
    </div>
  )
}
