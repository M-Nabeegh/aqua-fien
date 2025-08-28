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
      
      // Refresh the sell orders list from the database
      const updatedSellOrders = await fetch('/api/sell-orders').then(r => r.json())
      setSellOrders(updatedSellOrders)
      
      // Reset selected customer and show success message
      setSelectedCustomer(null)
      setSelectedProduct(null)
      setCurrentBottleCost(0)
      alert('Sell order added successfully!')
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

        {/* Sell Order Form */}
        <Form 
          title="Order Details" 
          fields={['quantity', 'billDate', 'salesmanAppointed']} 
          fieldConfig={fieldConfig}
          onSubmit={addSellOrder}
          customers={customers}
          products={products}
          salesEmployees={salesEmployees}
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-lg">
        <Table
          columns={['id', 'customerName', 'productName', 'quantity', 'bottleCost', 'totalAmount', 'billDate', 'salesmanAppointed']}
          data={sellOrders}
        />
      </div>
    </div>
  )
}
