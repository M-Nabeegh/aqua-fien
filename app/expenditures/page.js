'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'

export default function ExpendituresPage() {
  const [expenditures, setExpenditures] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    // Load expenditures
    fetch('/api/expenditures')
      .then(r => r.json())
      .then(data => {
        // Check if the response is an array, otherwise set empty array
        if (Array.isArray(data)) {
          setExpenditures(data)
        } else {
          console.error('Expenditures API returned non-array:', data)
          setExpenditures([])
        }
      })
      .catch((error) => {
        console.error('Failed to fetch expenditures:', error)
        setExpenditures([])
      })
    
    // Load employees for the dropdown
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const employeeOptions = [
            { value: '', label: 'None' },
            ...data.map(emp => ({ value: emp.id, label: emp.name }))
          ]
          setFieldConfig(prev => ({
            ...prev,
            employeeId: { ...prev.employeeId, options: employeeOptions }
          }))
        }
      })
      .catch(console.error)
  }, [])

  const [fieldConfig, setFieldConfig] = useState({
    description: { type: 'text', label: 'Description', placeholder: 'Enter expenditure description' },
    amount: { type: 'number', label: 'Amount (PKR)', placeholder: 'Enter amount' },
    date: { type: 'date', label: 'Date' },
    category: { 
      type: 'select', 
      label: 'Category', 
      options: [
        { value: 'transportation', label: 'Transportation' },
        { value: 'administrative', label: 'Administrative' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'other', label: 'Other' }
      ]
    },
    employeeId: { 
      type: 'select', 
      label: 'Employee (Optional)', 
      options: [{ value: '', label: 'Loading...' }]
    }
  })

  const addExpenditure = async (data) => {
    try {
      // Map form fields to API fields
      const expenditureData = {
        expenseDate: data.date,
        category: data.category,
        amount: parseFloat(data.amount),
        description: data.description,
        employeeId: data.employeeId || null
      }

      const response = await fetch('/api/expenditures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenditureData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Expenditure created successfully:', result)
        
        // Refresh the expenditures list from the database
        const updatedExpenditures = await fetch('/api/expenditures')
          .then(r => r.json())
          .then(data => Array.isArray(data) ? data : [])
        setExpenditures(updatedExpenditures)
        
        alert('Expenditure added successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error adding expenditure:', error)
      alert('Failed to add expenditure: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">💸 Expenditure Management</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <Form 
          title="Add New Expenditure" 
          fields={['description', 'amount', 'date', 'category', 'employeeId']} 
          fieldConfig={fieldConfig}
          onSubmit={addExpenditure}
          buttonText="Add Expenditure"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📋 Expenditure History</h3>
          <p className="text-sm text-gray-600 mt-1">Track all business expenditures and expenses</p>
        </div>
        <div className="p-6">
          <Table
            columns={['id', 'expenseDate', 'description', 'category', 'amount', 'employeeName']}
            data={Array.isArray(expenditures) ? expenditures.map(item => ({
              ...item,
              expenseDate: new Date(item.expenseDate).toLocaleDateString(),
              amount: `PKR ${parseFloat(item.amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
              employeeName: item.employeeName || 'N/A'
            })) : []}
          />
        </div>
      </div>
    </div>
  )
}
