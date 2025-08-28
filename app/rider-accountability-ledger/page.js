'use client'
import { useEffect, useState } from 'react'

export default function RiderAccountabilityLedger() {
  const [ledgerData, setLedgerData] = useState([])
  const [riders, setRiders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedRider, setSelectedRider] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Summary stats
  const [summary, setSummary] = useState({})

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (riders.length && products.length) {
      fetchLedgerData()
    }
  }, [selectedRider, selectedProduct, startDate, endDate])

  const fetchInitialData = async () => {
    try {
      const [ridersRes, productsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/products')
      ])

      if (ridersRes.ok) {
        const ridersData = await ridersRes.json()
        const riderEmployees = ridersData.filter(emp => emp.employeeType === 'rider')
        setRiders(riderEmployees)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.filter(p => p.isActive))
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const fetchLedgerData = async () => {
    setLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      if (selectedRider) params.append('riderId', selectedRider)
      if (selectedProduct) params.append('productId', selectedProduct)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      // Fetch rider activities
      const activitiesRes = await fetch(`/api/rider-activities?${params}`)
      
      // Fetch sell orders for accountability calculation
      const sellOrdersRes = await fetch(`/api/sell-orders?${params}`)

      if (!activitiesRes.ok || !sellOrdersRes.ok) {
        throw new Error('Failed to fetch ledger data')
      }

      const activities = await activitiesRes.json()
      const sellOrders = await sellOrdersRes.json()

      // Calculate accountability per rider-product combination
      const accountability = calculateAccountability(activities, sellOrders)
      
      setLedgerData(accountability)
      calculateSummary(accountability)

    } catch (error) {
      console.error('Error fetching ledger data:', error)
      alert('Failed to load ledger data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateAccountability = (activities, sellOrders) => {
    // Group data by rider and product
    const groupedData = new Map()

    // Process rider activities
    activities.forEach(activity => {
      const key = `${activity.employee_id}-${activity.product_id}`
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          riderId: activity.employee_id,
          riderName: activity.salesmanRepresentative,
          productId: activity.product_id,
          productName: activity.productName || 'Unknown Product',
          filledBottlesSent: 0,
          filledBottlesBroughtBack: 0,
          emptyBottlesReceived: 0,
          sellOrderQuantity: 0,
          activities: []
        })
      }

      const group = groupedData.get(key)
      group.filledBottlesSent += parseInt(activity.filledBottlesSent || 0)
      group.filledBottlesBroughtBack += parseInt(activity.filledProductBoughtBack || 0)
      group.emptyBottlesReceived += parseInt(activity.emptyBottlesReceived || 0)
      group.activities.push(activity)
    })

    // Process sell orders - filter them properly by date range and rider/product
    sellOrders.forEach(order => {
      const orderDate = new Date(order.billDate)
      
      // Apply date filtering if specified
      let includeOrder = true
      if (startDate) {
        const start = new Date(startDate)
        if (orderDate < start) includeOrder = false
      }
      if (endDate && includeOrder) {
        const end = new Date(endDate)
        if (orderDate > end) includeOrder = false
      }
      
      // Apply rider filtering if specified
      if (selectedRider && order.salesmanEmployeeId !== selectedRider) {
        includeOrder = false
      }
      
      // Apply product filtering if specified
      if (selectedProduct && order.productId !== selectedProduct) {
        includeOrder = false
      }
      
      if (!includeOrder) return
      
      const key = `${order.salesmanEmployeeId}-${order.productId}`
      
      if (groupedData.has(key)) {
        const group = groupedData.get(key)
        group.sellOrderQuantity += parseInt(order.quantity || 0)
      }
    })

    // Calculate accountability for each group
    const result = Array.from(groupedData.values()).map(group => {
      // Accountability = Filled bottles sent - Filled bottles brought back - Sell orders placed
      const accountability = group.filledBottlesSent - group.filledBottlesBroughtBack - group.sellOrderQuantity
      
      return {
        ...group,
        accountability,
        accountabilityStatus: getAccountabilityStatus(accountability)
      }
    })

    return result.sort((a, b) => {
      // Sort by rider name, then by product name
      if (a.riderName !== b.riderName) {
        return a.riderName.localeCompare(b.riderName)
      }
      return a.productName.localeCompare(b.productName)
    })
  }

  const getAccountabilityStatus = (accountability) => {
    if (accountability > 0) return { label: 'Outstanding', color: 'text-red-600 bg-red-50' }
    if (accountability < 0) return { label: 'Over-returned', color: 'text-yellow-600 bg-yellow-50' }
    return { label: 'Balanced', color: 'text-green-600 bg-green-50' }
  }

  const calculateSummary = (data) => {
    const summary = data.reduce((acc, item) => {
      acc.totalSent += item.filledBottlesSent
      acc.totalBroughtBack += item.filledBottlesBroughtBack
      acc.totalSellOrders += item.sellOrderQuantity
      acc.totalAccountability += item.accountability
      
      if (item.accountability > 0) acc.outstanding += item.accountability
      if (item.accountability < 0) acc.overReturned += Math.abs(item.accountability)
      
      return acc
    }, {
      totalSent: 0,
      totalBroughtBack: 0,
      totalSellOrders: 0,
      totalAccountability: 0,
      outstanding: 0,
      overReturned: 0
    })
    
    setSummary(summary)
  }

  const handleClearFilters = () => {
    setSelectedRider('')
    setSelectedProduct('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Rider Accountability Ledger</h1>
        <p className="text-gray-600">Product-specific accountability tracking with detailed analysis</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          🔍 Filter Options
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Rider Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rider</label>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Riders</option>
              {riders.map(rider => (
                <option key={rider.id} value={rider.id}>
                  {rider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleClearFilters}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          🗑️ Clear Filters
        </button>
      </div>

      {/* Summary Cards */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalSent}</div>
            <div className="text-sm text-gray-600">Bottles Sent</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.totalBroughtBack}</div>
            <div className="text-sm text-gray-600">Brought Back</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.totalSellOrders}</div>
            <div className="text-sm text-gray-600">Sold</div>
          </div>
          <div className={`rounded-lg p-4 text-center ${
            summary.totalAccountability > 0 ? 'bg-red-50' : 
            summary.totalAccountability < 0 ? 'bg-yellow-50' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${
              summary.totalAccountability > 0 ? 'text-red-600' : 
              summary.totalAccountability < 0 ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {summary.totalAccountability}
            </div>
            <div className="text-sm text-gray-600">Net Accountability</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.outstanding}</div>
            <div className="text-sm text-gray-600">Outstanding</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.overReturned}</div>
            <div className="text-sm text-gray-600">Over-returned</div>
          </div>
        </div>
      )}

      {/* Accountability Ledger */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📈 Accountability Analysis
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Calculating accountability...</p>
          </div>
        ) : ledgerData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg">No accountability data found</p>
            <p className="text-gray-400">Add rider activities to see accountability analysis</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Rider</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Product</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Bottles Sent</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Brought Back</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Sold</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Accountability</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Status</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Activities</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      {item.riderName}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {item.productName}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        🚛 <strong>{item.filledBottlesSent}</strong>
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        🔄 <strong>{item.filledBottlesBroughtBack}</strong>
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        💰 <strong>{item.sellOrderQuantity}</strong>
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold text-lg ${
                        item.accountability > 0 ? 'text-red-600' : 
                        item.accountability < 0 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.accountability > 0 ? '⚠️' : item.accountability < 0 ? '📈' : '✅'} {item.accountability}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.accountabilityStatus.color}`}>
                        {item.accountabilityStatus.label}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {item.activities.length} entries
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accountability Formula */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">📐 Accountability Formula</h3>
        <div className="bg-white rounded-lg p-4 font-mono text-sm">
          <strong>Accountability = Filled Bottles Sent - Filled Bottles Brought Back - Sell Orders Placed</strong>
        </div>
        <div className="mt-3 text-sm text-blue-800">
          <p>• <strong>Positive value:</strong> Rider has outstanding bottles to account for</p>
          <p>• <strong>Negative value:</strong> Rider returned more than expected (over-returned)</p>
          <p>• <strong>Zero value:</strong> Perfect balance</p>
        </div>
      </div>

      {/* Back to Activities */}
      <div className="text-center">
        <a
          href="/rider-activities"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          ⬅️ Back to Activities
        </a>
      </div>
    </div>
  )
}
