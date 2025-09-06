'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import SearchableCustomerSelect from '../../components/SearchableCustomerSelect'

export default function CustomerBottleLedgerPage() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [customerBottleBalances, setCustomerBottleBalances] = useState([])
  const [customerProductBalances, setCustomerProductBalances] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [newOpeningBottles, setNewOpeningBottles] = useState('')

  useEffect(() => {
    // Fetch customers and products
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]).then(([customersData, productsData]) => {
      setCustomers(customersData)
      setProducts(productsData)
    }).catch(error => {
      console.error('Error fetching data:', error)
      setCustomers([])
      setProducts([])
    })
  }, [])

  const fetchCustomerBottleBalances = async (customerId = null, productId = null) => {
    setLoading(true)
    try {
      let url = '/api/customer-bottle-balance'
      const params = new URLSearchParams()
      
      if (customerId) params.append('customerId', customerId)
      if (productId) params.append('productId', productId)
      
      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await fetch(url)
      const data = await response.json()
      setCustomerBottleBalances(data)
    } catch (error) {
      console.error('Error fetching bottle balances:', error)
      setCustomerBottleBalances([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerProductBalances = async (customerId = null) => {
    try {
      let url = '/api/customer-product-opening-bottles'
      if (customerId) {
        url += `?customerId=${customerId}`
      }

      const response = await fetch(url)
      const data = await response.json()
      setCustomerProductBalances(data)
    } catch (error) {
      console.error('Error fetching product balances:', error)
      setCustomerProductBalances([])
    }
  }

  const updateOpeningBottles = async (customerId, productId, openingBottles) => {
    try {
      const response = await fetch('/api/customer-product-opening-bottles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: parseInt(customerId),
          productId: parseInt(productId),
          openingBottles: parseInt(openingBottles || 0)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update opening bottles')
      }

      // Refresh data
      await fetchCustomerBottleBalances(selectedCustomer?.id, selectedProduct?.id)
      await fetchCustomerProductBalances(selectedCustomer?.id)
      
      alert('Opening bottles updated successfully!')
      setEditingRecord(null)
      setNewOpeningBottles('')
    } catch (error) {
      console.error('Error updating opening bottles:', error)
      alert('Error updating opening bottles: ' + error.message)
    }
  }

  useEffect(() => {
    fetchCustomerBottleBalances()
    fetchCustomerProductBalances()
  }, [])

  useEffect(() => {
    fetchCustomerBottleBalances(selectedCustomer?.id, selectedProduct?.id)
    fetchCustomerProductBalances(selectedCustomer?.id)
  }, [selectedCustomer, selectedProduct])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customer Bottle Ledger</h1>
        <div className="text-sm text-gray-500">
          Product-wise Bottle Tracking
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4 text-lg">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Customer Filter */}
          <div>
            <SearchableCustomerSelect
              customers={customers}
              selectedCustomer={selectedCustomer}
              onCustomerSelect={setSelectedCustomer}
              placeholder="All customers"
              label="Filter by Customer"
              required={false}
            />
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Product</label>
            <select
              value={selectedProduct ? selectedProduct.id : ''}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value)
                setSelectedProduct(product || null)
              }}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {(selectedCustomer || selectedProduct) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Filters:</strong>
              {selectedCustomer && ` Customer: ${selectedCustomer.name}`}
              {selectedCustomer && selectedProduct && ' | '}
              {selectedProduct && ` Product: ${selectedProduct.name}`}
            </p>
          </div>
        )}
      </div>

      {/* Bottle Balance Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">🍾 Current Bottle Balances</h3>
          <p className="text-sm text-gray-600 mt-1">
            Product-wise bottle tracking showing opening bottles, deliveries, collections, and current balance
          </p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bottle balances...</p>
          </div>
        ) : customerBottleBalances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Product</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Opening Bottles</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Total Delivered</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Empty Collected</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Current Balance</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerBottleBalances.map((balance, index) => (
                  <tr key={`${balance.customerId}-${balance.productId}`} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">{balance.customerName}</td>
                    <td className="border border-gray-300 px-4 py-3">{balance.productName}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {editingRecord === `${balance.customerId}-${balance.productId}` ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={newOpeningBottles}
                            onChange={(e) => setNewOpeningBottles(e.target.value)}
                            className="w-20 border rounded px-2 py-1 text-center"
                            placeholder={balance.openingBottles.toString()}
                          />
                          <button
                            onClick={() => updateOpeningBottles(balance.customerId, balance.productId, newOpeningBottles)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecord(null)
                              setNewOpeningBottles('')
                            }}
                            className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium">{balance.openingBottles}</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        📦 <strong>{balance.totalDelivered}</strong>
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        🔄 <strong>{balance.totalEmptyCollected}</strong>
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold text-lg ${
                        balance.currentBottleBalance > 0 ? 'text-orange-600' : 
                        balance.currentBottleBalance < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        🍾 {balance.currentBottleBalance}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {editingRecord !== `${balance.customerId}-${balance.productId}` && (
                        <button
                          onClick={() => {
                            setEditingRecord(`${balance.customerId}-${balance.productId}`)
                            setNewOpeningBottles(balance.openingBottles.toString())
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Edit Opening
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No bottle balance data found.</p>
            {(selectedCustomer || selectedProduct) && (
              <p className="text-sm mt-1">Try adjusting your filters or adding some opening bottles.</p>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-2">📋 How Product-wise Bottle Tracking Works</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Opening Bottles:</strong> Initial bottles given to customer for a specific product</p>
          <p><strong>Total Delivered:</strong> All bottles delivered through sell orders for that product</p>
          <p><strong>Empty Collected:</strong> Empty bottles collected back from customer for that product</p>
          <p><strong>Current Balance:</strong> Opening + Delivered - Collected = Customer&apos;s current bottle balance</p>
          <p className="mt-3"><strong>🎯 Goal:</strong> Track bottle inventory separately for each product type (20L, 5L, 1L bottles, etc.)</p>
        </div>
      </div>
    </div>
  )
}
