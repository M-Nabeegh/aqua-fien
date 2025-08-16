'use client'
import { useEffect, useState } from 'react'
import DashboardCard from '../../components/DashboardCard'

export default function ReportsPage() {
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [sellOrders, setSellOrders] = useState([])
  const [customerAdvances, setCustomerAdvances] = useState([])
  const [employeeAdvances, setEmployeeAdvances] = useState([])
  const [riderActivities, setRiderActivities] = useState([])
  const [expenses, setExpenses] = useState([
    { id: 1, category: 'Expenditures', amount: 28000, date: '2025-08-01', description: 'Total Expenses' }
  ])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, employeesRes, sellOrdersRes, customerAdvancesRes, employeeAdvancesRes, riderActivitiesRes] = await Promise.all([
          fetch('/api/customers').then(r => r.json()).catch(() => []),
          fetch('/api/employees').then(r => r.json()).catch(() => []),
          fetch('/api/sell-orders').then(r => r.json()).catch(() => []),
          fetch('/api/customer-advances').then(r => r.json()).catch(() => []),
          fetch('/api/employee-advances').then(r => r.json()).catch(() => []),
          fetch('/api/rider-activities').then(r => r.json()).catch(() => [])
        ])

        setCustomers(customersRes)
        setEmployees(employeesRes)
        setSellOrders(sellOrdersRes)
        setCustomerAdvances(customerAdvancesRes)
        setEmployeeAdvances(employeeAdvancesRes)
        setRiderActivities(riderActivitiesRes)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Financial Calculations with date filtering
  const getFilteredData = () => {
    let filteredSellOrders = sellOrders
    let filteredExpenses = expenses
    let filteredRiderActivities = riderActivities

    if (fromDate && toDate) {
      filteredSellOrders = sellOrders.filter(order => 
        order.billDate >= fromDate && order.billDate <= toDate
      )
      filteredExpenses = expenses.filter(expense =>
        expense.date >= fromDate && expense.date <= toDate
      )
      filteredRiderActivities = riderActivities.filter(activity =>
        activity.date >= fromDate && activity.date <= toDate
      )
    }

    return { filteredSellOrders, filteredExpenses, filteredRiderActivities }
  }

  const { filteredSellOrders, filteredExpenses, filteredRiderActivities } = getFilteredData()
  const totalRevenue = Array.isArray(filteredSellOrders) ? filteredSellOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0) : 0
  const totalEmployeeSalaries = Array.isArray(employees) ? employees.reduce((sum, emp) => sum + parseFloat(emp.salary || 0), 0) : 0
  const totalExpenses = Array.isArray(filteredExpenses) ? filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0) : 0
  const totalCosts = totalEmployeeSalaries + totalExpenses
  const netProfit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Rider Analytics Calculations
  const riderStats = {
    totalEmptyReceived: Array.isArray(filteredRiderActivities) ? filteredRiderActivities.reduce((sum, activity) => sum + (activity.emptyBottlesReceived || 0), 0) : 0,
    totalFilledSent: Array.isArray(filteredRiderActivities) ? filteredRiderActivities.reduce((sum, activity) => sum + (activity.filledBottlesSent || 0), 0) : 0,
    totalBoughtBack: Array.isArray(filteredRiderActivities) ? filteredRiderActivities.reduce((sum, activity) => sum + (activity.filledProductBoughtBack || 0), 0) : 0,
    totalAccountability: Array.isArray(filteredRiderActivities) ? filteredRiderActivities.reduce((sum, activity) => sum + ((activity.filledBottlesSent || 0) - (activity.filledProductBoughtBack || 0)), 0) : 0,
    activitiesCount: Array.isArray(filteredRiderActivities) ? filteredRiderActivities.length : 0
  }
  riderStats.averageAccountability = riderStats.activitiesCount > 0 ? riderStats.totalAccountability / riderStats.activitiesCount : 0
  riderStats.efficiencyRate = riderStats.totalFilledSent > 0 ? (riderStats.totalAccountability / riderStats.totalFilledSent) * 100 : 0

  const formatCurrency = (amount) => `PKR ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

  const updateExpense = (id, newAmount) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, amount: parseFloat(newAmount) || 0 } : expense
    ))
  }

  const printProfitLossReport = () => {
    const periodText = fromDate && toDate ? `${fromDate} to ${toDate}` : 'All Time'
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>AquaFine - Profit & Loss Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #f8f9fa; font-weight: bold; }
            .summary { background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px solid #e9ecef; }
            .profit { color: #10B981; font-weight: bold; }
            .loss { color: #EF4444; font-weight: bold; }
            .total-row { background-color: #e3f2fd; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AquaFine - Profit & Loss Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Period: ${periodText}</p>
          </div>
          
          <div class="section">
            <h2>📈 Revenue</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Water Sales (19L Bottles)</td>
                  <td>${formatCurrency(totalRevenue)}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Total Revenue</strong></td>
                  <td><strong>${formatCurrency(totalRevenue)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>💸 Expenses</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Employee Salaries</td>
                  <td>${formatCurrency(totalEmployeeSalaries)}</td>
                </tr>
                ${filteredExpenses.map(expense => `
                  <tr>
                    <td>${expense.description}</td>
                    <td>${formatCurrency(expense.amount)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td><strong>Total Expenses</strong></td>
                  <td><strong>${formatCurrency(totalCosts)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="summary">
            <h2>📊 Financial Summary</h2>
            <table class="table">
              <tbody>
                <tr>
                  <td><strong>Total Revenue</strong></td>
                  <td><strong>${formatCurrency(totalRevenue)}</strong></td>
                </tr>
                <tr>
                  <td><strong>Total Expenses</strong></td>
                  <td><strong>${formatCurrency(totalCosts)}</strong></td>
                </tr>
                <tr style="border-top: 3px solid #333;">
                  <td><strong>Net Profit/Loss</strong></td>
                  <td class="${netProfit >= 0 ? 'profit' : 'loss'}">
                    <strong>${formatCurrency(netProfit)}</strong>
                  </td>
                </tr>
                <tr>
                  <td><strong>Profit Margin</strong></td>
                  <td class="${profitMargin >= 0 ? 'profit' : 'loss'}">
                    <strong>${profitMargin.toFixed(2)}%</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
            <p>AquaFine - Premium Water Supply Management System</p>
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
          <p className="mt-4 text-gray-600">Loading financial reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📈 Financial Reports</h1>
        <p className="text-gray-600">Comprehensive profit & loss analysis</p>
        
        {/* Date Range Picker */}
        <div className="mt-6 max-w-lg mx-auto">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">📅 Report Period</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {fromDate && toDate && (
              <p className="text-sm text-blue-600 mt-2">
                📊 Showing data from {fromDate} to {toDate}
              </p>
            )}
            {!fromDate && !toDate && (
              <p className="text-sm text-gray-500 mt-2">
                📋 Showing all-time data
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={printProfitLossReport}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          🖨️ Print P&L Report
        </button>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Revenue"
          subtitle="From water sales"
          value={formatCurrency(totalRevenue)}
          icon="💰"
          color="#10B981"
        />
        
        <DashboardCard
          title="Total Expenses"
          subtitle="Salaries + Expenditures"
          value={formatCurrency(totalCosts)}
          icon="💸"
          color="#EF4444"
        />
        
        <DashboardCard
          title="Net Profit"
          subtitle={netProfit >= 0 ? "Profitable" : "Loss"}
          value={formatCurrency(netProfit)}
          change={profitMargin}
          changeType={netProfit >= 0 ? "positive" : "negative"}
          icon={netProfit >= 0 ? "📈" : "📉"}
          color={netProfit >= 0 ? "#10B981" : "#EF4444"}
        />
        
        <DashboardCard
          title="Profit Margin"
          subtitle="Revenue efficiency"
          value={`${profitMargin.toFixed(1)}%`}
          icon="📊"
          color={profitMargin >= 0 ? "#3B82F6" : "#F59E0B"}
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            💰 Revenue Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Water Sales Revenue (19L Bottles)</span>
              <span className="font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-bold">{filteredSellOrders.length}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-bold">{formatCurrency(filteredSellOrders.length > 0 ? totalRevenue / filteredSellOrders.length : 0)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
              <span className="font-medium text-green-800">Total Revenue</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            💸 Expense Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Employee Salaries</span>
              <span className="font-bold text-red-600">{formatCurrency(totalEmployeeSalaries)}</span>
            </div>
            
            {filteredExpenses.map((expense, index) => (
              <div key={expense.id} className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">{expense.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">PKR</span>
                  <input
                    type="number"
                    value={expense.amount}
                    onChange={(e) => updateExpense(expense.id, e.target.value)}
                    className="w-24 px-2 py-1 border rounded text-right font-bold text-red-600"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center py-3 bg-red-50 px-4 rounded-lg">
              <span className="font-medium text-red-800">Total Expenses</span>
              <span className="font-bold text-red-600 text-lg">{formatCurrency(totalCosts)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rider Analytics */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
          🚚 Rider Analytics & Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{riderStats.totalEmptyReceived}</div>
            <div className="text-sm text-gray-600">Empty Bottles Received</div>
            <div className="text-2xl mt-1">📦</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{riderStats.totalFilledSent}</div>
            <div className="text-sm text-gray-600">Filled Bottles Sent</div>
            <div className="text-2xl mt-1">🚛</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{riderStats.totalBoughtBack}</div>
            <div className="text-sm text-gray-600">Bottles Bought Back</div>
            <div className="text-2xl mt-1">🔄</div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${riderStats.totalAccountability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {riderStats.totalAccountability}
            </div>
            <div className="text-sm text-gray-600">Total Accountability</div>
            <div className="text-2xl mt-1">{riderStats.totalAccountability >= 0 ? '📈' : '📉'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {riderStats.averageAccountability.toFixed(1)}
            </div>
            <div className="text-sm text-indigo-800">Average Accountability</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {riderStats.efficiencyRate.toFixed(1)}%
            </div>
            <div className="text-sm text-purple-800">Efficiency Rate</div>
          </div>
          
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">
              {riderStats.activitiesCount}
            </div>
            <div className="text-sm text-cyan-800">Total Activities</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/rider-inout"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📦 Add Rider Activity
            </a>
            <a
              href="/rider-ledgers"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📊 View Rider Ledgers
            </a>
          </div>
        </div>
      </div>

      {/* Profit & Loss Summary */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          📊 Profit & Loss Statement
        </h3>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{formatCurrency(totalCosts)}</div>
              <div className="text-sm text-gray-600">Total Expenses</div>
            </div>
          </div>
          
          <div className="border-t-2 border-gray-300 pt-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </div>
              <div className="text-lg text-gray-600 mb-2">
                Net {netProfit >= 0 ? 'Profit' : 'Loss'}
              </div>
              <div className={`text-lg font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(2)}% Profit Margin
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
