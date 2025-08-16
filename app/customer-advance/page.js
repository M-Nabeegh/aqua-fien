'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'

export default function CustomerAdvancePage() {
  const [advances, setAdvances] = useState([])
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    // Fetch customer advances
    fetch('/api/customer-advances')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAdvances(data)
        } else {
          console.error('Customer advances API returned non-array:', data)
          setAdvances([])
        }
      })
      .catch((error) => {
        console.error('Failed to fetch customer advances:', error)
        setAdvances([])
      })
      
    // Fetch customers for dropdown
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomers(data)
        } else {
          console.error('Customers API returned non-array:', data)
          setCustomers([])
        }
      })
      .catch((error) => {
        console.error('Failed to fetch customers:', error)
        setCustomers([])
      })
  }, [])

  const addAdvance = async (data) => {
    try {
      console.log('Form data received:', data)
      
      // Map form data to API fields
      const customerAdvanceData = {
        customerId: data.customerId || data.customerName, // Handle both field names
        amount: parseFloat(data.amount),
        date: data.date,
        notes: data.notes || data.description || ''
      }
      
      console.log('Sending POST request to create customer advance:', customerAdvanceData)
      
      const response = await fetch('/api/customer-advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerAdvanceData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Customer advance created successfully:', result)
      
      // Refresh the advances list from the database
      const updatedAdvances = await fetch('/api/customer-advances')
        .then(r => r.json())
        .then(data => Array.isArray(data) ? data : [])
      setAdvances(updatedAdvances)
      
      alert('Customer advance added successfully!')
    } catch (error) {
      console.error('Error creating customer advance:', error)
      alert('Failed to create customer advance: ' + error.message)
    }
  }

  // Field configuration for the form
  const fieldConfig = {
    customerId: { 
      type: 'select', 
      label: 'Customer', 
      options: customers.map(customer => ({ value: customer.id, label: customer.name }))
    },
    date: { type: 'date', label: 'Advance Date' },
    amount: { type: 'number', label: 'Amount (PKR)', placeholder: 'Enter advance amount' },
    notes: { type: 'text', label: 'Notes', placeholder: 'Enter notes for the advance' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">💰 Customer Advance Management</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <Form 
          title="Add Customer Advance" 
          fields={['customerId', 'date', 'amount', 'notes']} 
          fieldConfig={fieldConfig}
          onSubmit={addAdvance}
          buttonText="Add Advance"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📋 Customer Advances History</h3>
          <p className="text-sm text-gray-600 mt-1">Track all customer advances and payments</p>
        </div>
        <div className="p-6">
          <Table
            columns={['id', 'customerName', 'advanceDate', 'amount', 'notes', 'createdAt']}
            data={Array.isArray(advances) ? advances.map(item => ({
              ...item,
              advanceDate: item.advanceDate ? new Date(item.advanceDate).toLocaleDateString() : 'N/A',
              amount: `PKR ${parseFloat(item.amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
              createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
              notes: item.notes || 'N/A'
            })) : []}
          />
        </div>
      </div>
    </div>
  )
}
