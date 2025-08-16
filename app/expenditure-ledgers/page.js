'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'

export default function ExpenditureLedgersPage() {
  const [expenditures, setExpenditures] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const categories = ['Transportation', 'Administrative', 'Maintenance', 'Utilities', 'Marketing', 'Other']

  useEffect(() => {
    fetch('/api/expenditures').then(r => r.json()).then(setExpenditures).catch(() => setExpenditures([]))
  }, [])

  const getFilteredExpenditures = () => {
    let filtered = expenditures

    if (selectedCategory) {
      filtered = filtered.filter(exp => exp.category === selectedCategory)
    }

    if (fromDate && toDate) {
      filtered = filtered.filter(exp => exp.date >= fromDate && exp.date <= toDate)
    }

    return filtered
  }

  const filteredExpenditures = getFilteredExpenditures()
  const totalAmount = filteredExpenditures.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)

  const printExpenditureLedger = () => {
    const periodText = fromDate && toDate ? `${fromDate} to ${toDate}` : 'All Time'
    const categoryText = selectedCategory || 'All Categories'

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>AquaFine - Expenditure Ledger</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .filter-info { margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
            .advances-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .advances-table th, .advances-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .advances-table th { background-color: #f2f2f2; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
            .total { color: #EF4444; font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AquaFine - Expenditure Ledger</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="filter-info">
            <h3>📋 Report Filters</h3>
            <p><strong>Period:</strong> ${periodText}</p>
            <p><strong>Category:</strong> ${categoryText}</p>
            <p><strong>Total Records:</strong> ${filteredExpenditures.length}</p>
          </div>

          <h3>💸 Expenditure Details</h3>
          <table class="advances-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenditures.map(exp => `
                <tr>
                  <td>${exp.date}</td>
                  <td>${exp.description}</td>
                  <td>${exp.category}</td>
                  <td>PKR ${parseFloat(exp.amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>📊 Summary</h3>
            <p><strong>Total Expenditures:</strong> ${filteredExpenditures.length} records</p>
            <p class="total"><strong>Total Amount:</strong> PKR ${totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
          </div>

          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
            <p>AquaFine - Premium Water Supply Management System</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const formatCurrency = (amount) => `PKR ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📊 Expenditure Ledgers</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4 text-lg">🔍 Filters & Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Filter
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="From"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="To"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Print Report
            </label>
            <button
              onClick={printExpenditureLedger}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium"
            >
              🖨️ Print Expenditure Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              💸
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenditures</p>
              <p className="text-2xl font-bold text-gray-900">{filteredExpenditures.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              📊
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              📈
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredExpenditures.length > 0 ? totalAmount / filteredExpenditures.length : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenditure Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">💰 Expenditure Records</h3>
          <p className="text-sm text-gray-600 mt-1">
            {fromDate && toDate ? `Showing records from ${fromDate} to ${toDate}` : 'Showing all records'}
            {selectedCategory && ` • Category: ${selectedCategory}`}
          </p>
        </div>
        <Table
          columns={['date', 'description', 'category', 'amount']}
          data={filteredExpenditures.map(item => ({
            ...item,
            amount: formatCurrency(parseFloat(item.amount))
          }))}
        />
      </div>
    </div>
  )
}
