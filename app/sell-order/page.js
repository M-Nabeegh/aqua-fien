'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'

export default function SellOrderPage() {
  const [sellOrders, setSellOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [salesEmployees, setSalesEmployees] = useState([])

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
      // Calculate total amount
      const bottleCost = parseFloat(data.bottleCost || 0)
      const quantity = parseInt(data.quantity || 0)
      const totalAmount = bottleCost * quantity

      const sellOrderData = { 
        ...data,
        totalAmount: totalAmount
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
      
      alert('Sell order added successfully!')
    } catch (error) {
      console.error('Error creating sell order:', error)
      alert('Failed to create sell order: ' + error.message)
    }
  }

  // Field configuration for the form
  const fieldConfig = {
    customerName: { type: 'select', label: 'Customer Name' },
    productName: { type: 'select', label: 'Product Name' },
    bottleCost: { type: 'number', label: 'Bottle Cost', placeholder: 'Auto-filled from customer price' },
    quantity: { type: 'number', label: 'Quantity', placeholder: 'Enter quantity' },
    billDate: { type: 'date', label: 'Bill Date' },
    salesmanAppointed: { type: 'select', label: 'Salesman Appointed' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sell Orders</h1>
      </div>
      <Form 
        title="Add Sell Order" 
        fields={['customerName', 'productName', 'bottleCost', 'quantity', 'billDate', 'salesmanAppointed']} 
        fieldConfig={fieldConfig}
        onSubmit={addSellOrder}
        customers={customers}
        products={products}
        salesEmployees={salesEmployees}
      />
      <Table
        columns={['id', 'customerName', 'productName', 'quantity', 'bottleCost', 'totalAmount', 'billDate', 'salesmanAppointed']}
        data={sellOrders}
      />
    </div>
  )
}
