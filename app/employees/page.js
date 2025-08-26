'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'
import SalaryPaymentForm from '../../components/SalaryPaymentForm'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

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

  const handleSalaryPayment = (employee) => {
    setSelectedEmployee(employee)
    setShowSalaryForm(true)
  }

  const handleSalarySubmitted = () => {
    setShowSalaryForm(false)
    setSelectedEmployee(null)
    // You could refresh salary data here if needed
  }

  const handleSalaryCancelled = () => {
    setShowSalaryForm(false)
    setSelectedEmployee(null)
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

  // Enhanced table with salary payment buttons
  const EmployeeTable = () => {
    if (!employees.length) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
          <p className="text-gray-500">Add your first employee using the form above.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Employee Type</th>
              <th className="px-3 py-2 text-left font-medium">Phone</th>
              <th className="px-3 py-2 text-left font-medium">Monthly Salary</th>
              <th className="px-3 py-2 text-left font-medium">Joining Date</th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{employee.id}</td>
                <td className="px-3 py-2 font-medium">{employee.name}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    employee.employeeType === 'manager' ? 'bg-purple-100 text-purple-800' :
                    employee.employeeType === 'rider' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {employee.employeeType}
                  </span>
                </td>
                <td className="px-3 py-2">{employee.phone}</td>
                <td className="px-3 py-2 font-medium">
                  PKR {new Intl.NumberFormat('en-PK').format(employee.salary)}
                </td>
                <td className="px-3 py-2">
                  {new Date(employee.joiningDate).toLocaleDateString('en-PK')}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleSalaryPayment(employee)}
                    className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-xs font-medium transition-colors"
                    title={`Pay salary to ${employee.name}`}
                  >
                    💰 Pay Salary
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">👥 Employees</h1>
        <button
          onClick={() => window.location.href = '/salary-payments'}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          📊 View Salary History
        </button>
      </div>
      
      <Form 
        title="Add Employee - AquaFine" 
        fields={['name','cnic','phone','address','joiningDate','employeeType','salary']} 
        fieldConfig={fieldConfig}
        onSubmit={addEmployee} 
      />
      
      <EmployeeTable />

      {/* Salary Payment Modal */}
      {showSalaryForm && selectedEmployee && (
        <SalaryPaymentForm
          employee={selectedEmployee}
          onSubmit={handleSalarySubmitted}
          onCancel={handleSalaryCancelled}
        />
      )}
    </div>
  )
}
