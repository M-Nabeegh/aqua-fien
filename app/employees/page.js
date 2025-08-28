'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'
import SalaryPaymentForm from '../../components/SalaryPaymentForm'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [activeTab, setActiveTab] = useState('add') // 'add' or 'view'
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setEmployees)
  }, [])

  const addEmployee = async (data) => {
    try {
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        alert('Employee name is required.')
        return
      }
      
      // Validate phone number if provided
      if (data.phone && data.phone.trim() !== '') {
        const phoneRegex = /^(\+92|0)?[0-9]{7,11}$/
        if (!phoneRegex.test(data.phone.replace(/[\s\-]/g, ''))) {
          alert('Please provide a valid Pakistani phone number (e.g., 03001234567 or +923001234567).')
          return
        }
      }
      
      console.log(`${isEditMode ? 'Updating' : 'Creating'} employee with data:`, data)
      
      // Determine if this is an update or create operation
      const url = isEditMode ? `/api/employees/${editingEmployee.id}` : '/api/employees'
      const method = isEditMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log(`Employee ${isEditMode ? 'updated' : 'created'} successfully:`, result)
      
      // Refresh the employees list from the database
      const updatedEmployees = await fetch('/api/employees').then(r => r.json())
      setEmployees(updatedEmployees)
      
      // Reset form state
      setEditingEmployee(null)
      setIsEditMode(false)
      
      alert(`Employee ${isEditMode ? 'updated' : 'added'} successfully!`)
      
      // Switch back to view tab if we were editing
      if (isEditMode) {
        setActiveTab('view')
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} employee:`, error)
      alert(`Failed to ${isEditMode ? 'update' : 'create'} employee: ` + error.message)
    }
  }

  const deleteEmployee = async (employeeId, employeeName) => {
    if (!confirm(`Are you sure you want to delete employee "${employeeName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Refresh the employees list
      const updatedEmployees = await fetch('/api/employees').then(r => r.json())
      setEmployees(updatedEmployees)
      
      alert('Employee deleted successfully!')
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Failed to delete employee: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditEmployee = async (employee) => {
    try {
      // Set the form data for editing
      setEditingEmployee(employee)
      setIsEditMode(true)
      setActiveTab('add') // Switch to the form tab
    } catch (error) {
      console.error('Error loading employee data:', error)
      alert('Failed to load employee data for editing')
    }
  }

  const handleCancelEdit = () => {
    setEditingEmployee(null)
    setIsEditMode(false)
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

  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.employeeType?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage)

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Field configuration for the employee form
  const fieldConfig = {
    name: { type: 'text', label: 'Employee Name', placeholder: 'Enter employee name', required: true },
    cnic: { type: 'text', label: 'CNIC Number', placeholder: 'Enter 13-digit CNIC number' },
    phone: { 
      type: 'tel', 
      label: 'Phone Number', 
      placeholder: 'e.g., 03001234567 or +923001234567',
      helperText: 'Optional: Pakistani phone number format'
    },
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
    salary: { type: 'number', label: 'Monthly Salary', placeholder: 'Enter salary amount', min: 0, step: 0.01 }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Employees Management</h1>
        <div className="text-sm text-gray-500">
          Total Employees: {employees.length}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('add')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Add New Employee
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 View All Employees ({employees.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'add' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Employee' : 'Add New Employee'}
                  </h2>
                  {isEditMode && (
                    <p className="text-sm text-gray-600 mt-1">
                      Editing: {editingEmployee?.name}
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      ❌ Cancel Edit
                    </button>
                  )}
                  <button
                    onClick={() => window.location.href = '/salary-payments'}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                  >
                    📊 View Salary History
                  </button>
                </div>
              </div>

              <Form 
                title={isEditMode ? "Edit Employee - AquaFine" : "Add Employee - AquaFine"}
                fields={['name','cnic','phone','address','joiningDate','employeeType','salary']} 
                fieldConfig={fieldConfig}
                onSubmit={addEmployee}
                initialData={editingEmployee}
                key={editingEmployee?.id || 'new'} // Force re-render when editing different employee 
              />
            </div>
          )}

          {activeTab === 'view' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Employees</h2>
                <div className="text-sm text-gray-500">
                  {searchQuery ? `${filteredEmployees.length} of ${employees.length} employees` : `${employees.length} total employees`}
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search employees by name, phone, or employee type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Results Info */}
              {searchQuery && (
                <div className="mb-4 text-sm text-gray-600">
                  {filteredEmployees.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <span className="text-yellow-800">No employees found matching &ldquo;{searchQuery}&rdquo;</span>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <span className="text-blue-800">Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} matching &ldquo;{searchQuery}&rdquo;</span>
                    </div>
                  )}
                </div>
              )}

              {/* Employees Table */}
              {paginatedEmployees.length > 0 && (
                <div className="mb-6">
                  <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Salary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedEmployees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {employee.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  employee.employeeType === 'manager' ? 'bg-purple-100 text-purple-800' :
                                  employee.employeeType === 'rider' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {employee.employeeType}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.phone || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                PKR {new Intl.NumberFormat('en-PK').format(employee.salary)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => handleEditEmployee(employee)}
                                  disabled={isLoading}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleSalaryPayment(employee)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  💰 Pay Salary
                                </button>
                                <button
                                  onClick={() => deleteEmployee(employee.id, employee.name)}
                                  disabled={isLoading}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                  {isLoading ? '🗑️ Deleting...' : '🗑️ Delete'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <div className="flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredEmployees.length)}</span> of{' '}
                        <span className="font-medium">{filteredEmployees.length}</span> employees
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            if (totalPages <= 7) return true
                            if (page === 1 || page === totalPages) return true
                            if (Math.abs(page - currentPage) <= 1) return true
                            return false
                          })
                          .map((page, index, array) => {
                            if (index > 0 && array[index - 1] !== page - 1) {
                              return [
                                <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>,
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              ]
                            }
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          })}

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {employees.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first employee.</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Employee
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
