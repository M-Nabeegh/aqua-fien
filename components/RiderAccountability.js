'use client'
import { useState, useEffect } from 'react'

export default function RiderAccountability() {
  const [riders, setRiders] = useState([])
  const [products, setProducts] = useState([])
  const [selectedRider, setSelectedRider] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [accountability, setAccountability] = useState(null)
  const [loading, setLoading] = useState(false)
  const [allAccountabilities, setAllAccountabilities] = useState([])

  useEffect(() => {
    fetchRiders()
    fetchProducts()
    fetchAllAccountabilities()
  }, [])

  const fetchRiders = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setRiders(data.filter(emp => emp.position === 'rider' || emp.position === 'salesman'))
    } catch (error) {
      console.error('Error fetching riders:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchAllAccountabilities = async () => {
    try {
      const response = await fetch('/api/employees')
      const ridersData = await response.json()
      const allRiders = ridersData.filter(emp => emp.position === 'rider' || emp.position === 'salesman')
      
      const productResponse = await fetch('/api/products')
      const productsData = await productResponse.json()
      
      const accountabilities = []
      
      for (const rider of allRiders) {
        for (const product of productsData) {
          try {
            const accountabilityResponse = await fetch(
              `/api/rider-activities?accountability=true&riderId=${rider.id}&productId=${product.id}`
            )
            const accountabilityData = await accountabilityResponse.json()
            
            if (accountabilityData.totalFilledBottlesSent > 0 || accountabilityData.totalBottlesSold > 0) {
              accountabilities.push({
                ...accountabilityData,
                riderName: rider.name,
                productName: product.name
              })
            }
          } catch (error) {
            console.error(`Error fetching accountability for rider ${rider.id}, product ${product.id}:`, error)
          }
        }
      }
      
      setAllAccountabilities(accountabilities)
    } catch (error) {
      console.error('Error fetching all accountabilities:', error)
    }
  }

  const fetchSpecificAccountability = async () => {
    if (!selectedRider || !selectedProduct) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `/api/rider-activities?accountability=true&riderId=${selectedRider}&productId=${selectedProduct}`
      )
      const data = await response.json()
      setAccountability(data)
    } catch (error) {
      console.error('Error fetching accountability:', error)
      setAccountability({ error: 'Failed to fetch accountability' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Clear':
        return 'text-green-600 bg-green-100'
      case 'Has Stock':
        return 'text-blue-600 bg-blue-100'
      case 'Deficit':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🧮 Rider Accountability</h2>
        <p className="text-gray-600">
          Track filled bottles sent vs bottles sold for each rider and product combination.
          This helps ensure accountability by showing remaining stock with riders.
        </p>
      </div>

      {/* Specific Accountability Query */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Query Specific Accountability</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Rider
            </label>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Rider</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.name} - {rider.phone || 'No phone'}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.size || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchSpecificAccountability}
              disabled={!selectedRider || !selectedProduct || loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Check Accountability'}
            </button>
          </div>
        </div>

        {accountability && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Accountability Report</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{accountability.totalFilledBottlesSent}</div>
                <div className="text-sm text-gray-600">Bottles Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{accountability.totalBottlesSold}</div>
                <div className="text-sm text-gray-600">Bottles Sold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{accountability.bottlesRemaining}</div>
                <div className="text-sm text-gray-600">Bottles Remaining</div>
              </div>
              <div className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(accountability.accountabilityStatus)}`}>
                  {accountability.accountabilityStatus}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All Accountabilities Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">All Rider Accountabilities</h3>
          <button
            onClick={fetchAllAccountabilities}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
        
        {allAccountabilities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allAccountabilities.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.riderName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.totalFilledBottlesSent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.totalBottlesSold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.bottlesRemaining}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.accountabilityStatus)}`}>
                        {item.accountabilityStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No accountability data available. Start by recording rider activities and sell orders.
          </div>
        )}
      </div>
    </div>
  )
}
