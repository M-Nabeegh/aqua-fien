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

  const addSellOrder = async (data) => {
    try {
      if (!selectedCustomer) {
        alert('Please select a customer first')
        return
      }

      // Find product and salesman IDs from names
      const selectedProduct = products.find(p => p.name === data.productName)
      const selectedSalesman = salesEmployees.find(emp => emp.name === data.salesmanAppointed)

      console.log('Data transformation:', {
        selectedCustomer: { id: selectedCustomer.id, name: selectedCustomer.name },
        productName: data.productName,
        selectedProduct: selectedProduct ? { id: selectedProduct.id, name: selectedProduct.name } : null,
        salesmanAppointed: data.salesmanAppointed,
        selectedSalesman: selectedSalesman ? { id: selectedSalesman.id, name: selectedSalesman.name } : null
      });

      if (!selectedProduct) {
        alert('Selected product not found')
        return
      }

      if (!selectedSalesman) {
        alert('Selected salesman not found')
        return
      }

      // Calculate total amount - this will be recalculated by the API with correct pricing
      const quantity = parseInt(data.quantity || 0)

      const sellOrderData = { 
        customerId: selectedCustomer.id,
        productId: selectedProduct.id,
        quantity: quantity,
        // Remove bottleCost - API will determine the correct price automatically
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
      alert('Sell order added successfully!')
    } catch (error) {
      console.error('Error creating sell order:', error)
      alert('Failed to create sell order: ' + error.message)
    }
  }

  // Field configuration for the form
  const fieldConfig = {
    productName: { type: 'select', label: 'Product Name' },
    bottleCost: { 
      type: 'number', 
      label: 'Bottle Cost (PKR)', 
      placeholder: 'Auto-filled from customer pricing',
      readOnly: true,
      helperText: 'This price is automatically determined based on customer-specific pricing or product base price.'
    },
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
            onCustomerSelect={setSelectedCustomer}
            placeholder="Search and select a customer..."
            label="Select Customer"
            required={true}
          />
        </div>

        {/* Sell Order Form */}
        <Form 
          title="Add Sell Order" 
          fields={['productName', 'bottleCost', 'quantity', 'billDate', 'salesmanAppointed']} 
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
