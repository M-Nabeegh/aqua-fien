'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setEmployees)
  }, [])

  const addEmployee = async (data) => {
    try {
      console.log('Sending POST request to create employee:', data)
      
      const response = await fetch('/api/employees', {
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
      console.log('Employee created successfully:', result)
      
      // Refresh the employees list from the database
      const updatedEmployees = await fetch('/api/employees').then(r => r.json())
      setEmployees(updatedEmployees)
      
      alert('Employee added successfully!')
    } catch (error) {
      console.error('Error creating employee:', error)
      alert('Failed to create employee: ' + error.message)
    }
  }

  // Field configuration for the employee form
  const fieldConfig = {
    name: { type: 'text', label: 'Employee Name', placeholder: 'Enter employee name' },
    cnic: { type: 'text', label: 'CNIC Number', placeholder: 'Enter 13-digit CNIC number' },
    phone: { type: 'text', label: 'Phone Number', placeholder: 'Enter phone number (e.g., 03001234567)' },
    address: { type: 'text', label: 'Address', placeholder: 'Enter employee address' },
    joiningDate: { type: 'date', label: 'Joining Date' },
    employeeType: { 
      type: 'select', 
      label: 'Employee Type',
      options: [
        { value: 'worker', label: 'Worker' },
        { value: 'manager', label: 'Manager' },
        { value: 'rider', label: 'Rider' }
      ]
    },
    salary: { type: 'number', label: 'Monthly Salary', placeholder: 'Enter salary amount' }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Employees</h1>
      <Form 
        title="Add Employee - AquaFine" 
        fields={['name','cnic','phone','address','joiningDate','employeeType','salary']} 
        fieldConfig={fieldConfig}
        onSubmit={addEmployee} 
      />
      <Table columns={['id','name','employeeType','phone','salary','joiningDate']} data={employees} />
    </div>
  )
}
