'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'
import SearchableCustomerSelect from '../../components/SearchableCustomerSelect'

export default function SellOrderPage() {
  const [sellOrders, setSellOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [salesEmployees, setSalesEmployees] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [currentBottleCost, setCurrentBottleCost] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [emptyBottlesCollected, setEmptyBottlesCollected] = useState(0)
  const [customerBottleBalance, setCustomerBottleBalance] = useState(null)

  useEffect(() => {
    // Fetch sell orders
    fetch('/api/sell-orders').then(r => r.json()).then(setSellOrders).catch(() => setSellOrders([]))
    // Fetch customers for dropdown
    fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => setCustomers([]))
    // Fetch products for dropdown
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => setProducts([]))
    // Fetch sales employees (riders)
    fetch('/api/employees').then(r => r.json()).then(data => {
      console.log('All employees:', data)
      const salesEmps = data.filter(emp => emp.employeeType === 'rider')
      console.log('Filtered riders:', salesEmps)
      setSalesEmployees(salesEmps)
    }).catch(() => setSalesEmployees([]))
  }, [])

  // Function to get customer-specific pricing
  const getCustomerProductPrice = async (customerId, productId) => {
    try {
      if (!customerId || !productId) return 0
      
      // Check for custom pricing using query parameters
      const customPricingResponse = await fetch(`/api/customer-pricing?customerId=${customerId}&productId=${productId}`)
      if (customPricingResponse.ok) {
        const customPricing = await customPricingResponse.json()
        if (customPricing.length > 0) {
          return parseFloat(customPricing[0].customPrice)
        }
      }
      
      // If no custom pricing, get base price from product
      const product = products.find(p => p.id === productId)
      return product ? parseFloat(product.basePrice) : 0
    } catch (error) {
      console.error('Error fetching customer product price:', error)
      return 0
    }
  }

  // Function to fetch customer bottle balance for selected product
  const fetchCustomerBottleBalance = async (customerId, productId) => {
    try {
      if (!customerId || !productId) {
        setCustomerBottleBalance(null)
        return
      }
      
      const response = await fetch(`/api/customer-bottle-balance?customerId=${customerId}&productId=${productId}`)
      if (response.ok) {
        const balance = await response.json()
        setCustomerBottleBalance(balance)
      } else {
        setCustomerBottleBalance(null)
      }
    } catch (error) {
      console.error('Error fetching customer bottle balance:', error)
      setCustomerBottleBalance(null)
    }
  }

  // Update bottle cost when customer or product changes
  const updateBottleCost = async (customer, product) => {
    if (customer && product) {
      const price = await getCustomerProductPrice(customer.id, product.id)
      setCurrentBottleCost(price)
    } else {
      setCurrentBottleCost(0)
    }
  }

  const addSellOrder = async (data) => {
    try {
      if (!selectedCustomer) {
        alert('Please select a customer first')
        return
      }

      if (!selectedProduct) {
        alert('Please select a product first')
        return
      }

      // Find salesman ID from name
      const selectedSalesman = salesEmployees.find(emp => emp.name === data.salesmanAppointed)

      console.log('Data transformation:', {
        selectedCustomer: { id: selectedCustomer.id, name: selectedCustomer.name },
        selectedProduct: { id: selectedProduct.id, name: selectedProduct.name },
        currentBottleCost: currentBottleCost,
        salesmanAppointed: data.salesmanAppointed,
        selectedSalesman: selectedSalesman ? { id: selectedSalesman.id, name: selectedSalesman.name } : null
      });

      if (!selectedSalesman) {
        alert('Selected salesman not found')
        return
      }

      // Calculate total amount
      const quantity = parseInt(data.quantity || 0)

      const sellOrderData = { 
        customerId: selectedCustomer.id,
        productId: selectedProduct.id,
        quantity: quantity,
        emptyBottlesCollected: parseInt(emptyBottlesCollected || 0),
        // API will determine the correct price automatically
        billDate: data.billDate,
        salesmanId: selectedSalesman ? selectedSalesman.id : null,
        salesmanAppointed: data.salesmanAppointed || 'Unassigned'
      }

      console.log('Sending POST request to create sell order:', sellOrderData)
      
      const response = await fetch('/api/sell-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sellOrderData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Sell order created successfully:', result)
      
      // Fetch the customer's updated bottle balance for the specific product
      let bottleBalanceMessage = ''
      try {
        const bottleBalanceResponse = await fetch(`/api/customer-bottle-balance?customerId=${selectedCustomer.id}&productId=${selectedProduct.id}`)
        if (bottleBalanceResponse.ok) {
          const bottleBalance = await bottleBalanceResponse.json()
          if (bottleBalance && bottleBalance.length > 0) {
            const balance = bottleBalance[0]
            bottleBalanceMessage = `\n\n📊 Updated ${balance.productName} Bottle Balance for ${balance.customerName}:\n` +
                                 `• Opening Bottles: ${balance.openingBottles}\n` +
                                 `• Total Delivered: ${balance.totalDelivered}\n` +
                                 `• Empty Bottles Collected: ${balance.totalCollected}\n` +
                                 `• Current Balance: ${balance.currentBalance} bottles`
          }
        }
      } catch (error) {
        console.error('Error fetching bottle balance:', error)
        bottleBalanceMessage = '\n\n⚠️ Could not fetch updated bottle balance'
      }
      
      // Refresh the sell orders list from the database
      const updatedSellOrders = await fetch('/api/sell-orders').then(r => r.json())
      setSellOrders(updatedSellOrders)
      
      // Reset selected customer and show success message with bottle balance
      setSelectedCustomer(null)
      setSelectedProduct(null)
      setCurrentBottleCost(0)
      setEmptyBottlesCollected(0)
      setCustomerBottleBalance(null)
      alert(`✅ Sell order added successfully!${bottleBalanceMessage}`)
    } catch (error) {
      console.error('Error creating sell order:', error)
      alert('Failed to create sell order: ' + error.message)
    }
  }

  // Field configuration for the form
  const fieldConfig = {
    quantity: { type: 'number', label: 'Quantity', placeholder: 'Enter quantity' },
    billDate: { type: 'date', label: 'Bill Date' },
    salesmanAppointed: { type: 'select', label: 'Salesman Appointed' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sell Orders</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Searchable Customer Selection */}
        <div className="mb-6">
          <SearchableCustomerSelect
            customers={customers}
            selectedCustomer={selectedCustomer}
            onCustomerSelect={async (customer) => {
              setSelectedCustomer(customer)
              await updateBottleCost(customer, selectedProduct)
              await fetchCustomerBottleBalance(customer?.id, selectedProduct?.id)
            }}
            placeholder="Search and select a customer..."
            label="Select Customer"
            required={true}
          />
        </div>

        {/* Product Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Product *
          </label>
          <select
            value={selectedProduct ? selectedProduct.id : ''}
            onChange={async (e) => {
              const product = products.find(p => p.id === e.target.value)
              setSelectedProduct(product)
              await updateBottleCost(selectedCustomer, product)
              await fetchCustomerBottleBalance(selectedCustomer?.id, product?.id)
            }}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose a product...</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} (Base: PKR {product.basePrice})
              </option>
            ))}
          </select>
        </div>

        {/* Price Display */}
        {selectedCustomer && selectedProduct && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Pricing Information</h4>
            <div className="text-sm text-blue-800">
              <p><strong>Customer:</strong> {selectedCustomer.name}</p>
              <p><strong>Product:</strong> {selectedProduct.name}</p>
              <p><strong>Price per bottle:</strong> PKR {currentBottleCost.toFixed(2)} 
                {currentBottleCost !== parseFloat(selectedProduct.basePrice) ? (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Custom Pricing (Base: PKR {selectedProduct.basePrice})
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                    Base Price
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Customer Bottle Balance Display */}
        {selectedCustomer && selectedProduct && customerBottleBalance && customerBottleBalance.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">🍾 {customerBottleBalance[0].productName} Bottle Balance</h4>
            <div className="text-sm text-green-800">
              <p><strong>Customer:</strong> {customerBottleBalance[0].customerName}</p>
              <p><strong>Product:</strong> {customerBottleBalance[0].productName}</p>
              <p><strong>Opening Bottles:</strong> {customerBottleBalance[0].openingBottles}</p>
              <p><strong>Total Delivered:</strong> {customerBottleBalance[0].totalDelivered}</p>
              <p><strong>Empty Bottles Collected:</strong> {customerBottleBalance[0].totalCollected}</p>
              <p><strong>Current Balance:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  customerBottleBalance[0].currentBalance > 0 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {customerBottleBalance[0].currentBalance} bottles
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Sell Order Form */}
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target)
          addSellOrder({
            quantity: formData.get('quantity'),
            billDate: formData.get('billDate'),
            salesmanAppointed: formData.get('salesmanAppointed')
          })
        }} className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
          
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              required
              placeholder="Enter quantity"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Empty Bottles Collected */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🍾 Empty Bottles Collected
            </label>
            <input
              type="number"
              min="0"
              value={emptyBottlesCollected}
              onChange={(e) => setEmptyBottlesCollected(e.target.value)}
              placeholder="Number of empty bottles collected"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              How many empty bottles were collected from this customer?
            </p>
          </div>

          {/* Bill Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill Date *
            </label>
            <input
              type="date"
              name="billDate"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Salesman */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salesman Appointed *
            </label>
            <select
              name="salesmanAppointed"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose salesman...</option>
              {salesEmployees.map(emp => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.employeeType})
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedCustomer || !selectedProduct}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
          >
            {selectedCustomer && selectedProduct ? 'Create Sell Order' : 'Select Customer & Product First'}
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg">
        <Table
          columns={['id', 'customerName', 'productName', 'quantity', 'emptyBottlesCollected', 'bottleCost', 'totalAmount', 'billDate', 'salesmanAppointed']}
          data={sellOrders}
        />
      </div>
    </div>
  )
}
