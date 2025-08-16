'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'

export default function EmployeeAdvancePage() {
  const [advances, setAdvances] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    // Fetch employee advances
    fetch('/api/employee-advances').then(r => r.json()).then(setAdvances).catch(() => setAdvances([]))
    // Fetch employees for dropdown
    fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => setEmployees([]))
  }, [])

  const addAdvance = async (data) => {
    try {
      console.log('Sending POST request to create employee advance:', data)
      
      const response = await fetch('/api/employee-advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Employee advance created successfully:', result)
      
      // Refresh the advances list from the database
      const updatedAdvances = await fetch('/api/employee-advances').then(r => r.json())
      setAdvances(updatedAdvances)
      
      alert('Employee advance added successfully!')
    } catch (error) {
      console.error('Error creating employee advance:', error)
      alert('Failed to create employee advance: ' + error.message)
    }
  }

  // Field configuration for the form
  const fieldConfig = {
    employeeName: { type: 'select', label: 'Employee Name' },
    date: { type: 'date', label: 'Date' },
    amount: { type: 'number', label: 'Amount', placeholder: 'Enter advance amount' },
    description: { type: 'text', label: 'Description', placeholder: 'Enter description for the advance' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Employee Advances</h1>
      </div>
      <Form 
        title="Add Employee Advance" 
        fields={['employeeName', 'date', 'amount', 'description']} 
        fieldConfig={fieldConfig}
        onSubmit={addAdvance}
        employees={employees}
      />
      <Table
        columns={['id', 'employeeName', 'date', 'amount', 'description', 'createdAt']}
        data={advances}
      />
    </div>
  )
}
