'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'
import CustomerPricing from '../../components/CustomerPricing'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false)
  const [customerPricing, setCustomerPricing] = useState({})
  const [activeTab, setActiveTab] = useState('add') // 'add' or 'view'
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    // Fetch customers and products
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]).then(([customersData, productsData]) => {
      setCustomers(customersData)
      setProducts(productsData)
    })
  }, [])

  const addCustomer = async (data) => {
    try {
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        alert('Customer name is required.')
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
      
      // Validate opening bottles
      if (data.openingBottles && (isNaN(data.openingBottles) || parseInt(data.openingBottles) < 0)) {
        alert('Opening bottles must be a number 0 or greater.')
        return
      }
      
      // Create customer data with custom pricing
      const customerData = {
        ...data,
        customPricing: customerPricing,
        // Legacy support - if only one product and custom price is set
        productPrice: products.length === 1 && customerPricing[products[0]?.id] 
          ? customerPricing[products[0].id] 
          : data.productPrice || products[0]?.basePrice,
        productSelect: products.length === 1 ? products[0]?.name : data.productSelect
      }
      
      console.log(`${isEditMode ? 'Updating' : 'Creating'} customer with data:`, customerData)
      
      // Determine if this is an update or create operation
      const url = isEditMode ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = isEditMode ? 'PUT' : 'POST'
      
      // Send request to backend
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log(`Customer ${isEditMode ? 'updated' : 'created'} successfully:`, result)
      
      // Refresh the customers list from the database
      const updatedCustomers = await fetch('/api/customers').then(r => r.json())
      setCustomers(updatedCustomers)
      
      // Reset form state
      setCustomerPricing({})
      setShowAdvancedPricing(false)
      setEditingCustomer(null)
      setIsEditMode(false)
      
      alert(`Customer ${isEditMode ? 'updated' : 'added'} successfully!`)
      
      // Switch back to view tab if we were editing
      if (isEditMode) {
        setActiveTab('view')
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} customer:`, error)
      alert(`Failed to ${isEditMode ? 'update' : 'create'} customer: ` + error.message)
    }
  }

  const updateCustomer = async (customerId, data) => {
    try {
      setIsLoading(true)
      
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        alert('Customer name is required.')
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
      
      // Validate opening bottles
      if (data.openingBottles && (isNaN(data.openingBottles) || parseInt(data.openingBottles) < 0)) {
        alert('Opening bottles must be a number 0 or greater.')
        return
      }

      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Refresh the customers list
      const updatedCustomers = await fetch('/api/customers').then(r => r.json())
      setCustomers(updatedCustomers)
      setEditingCustomer(null)
      
      alert('Customer updated successfully!')
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Failed to update customer: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCustomer = async (customerId, customerName) => {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Refresh the customers list
      const updatedCustomers = await fetch('/api/customers').then(r => r.json())
      setCustomers(updatedCustomers)
      
      alert('Customer deleted successfully!')
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Failed to delete customer: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePricingChange = (pricing) => {
    setCustomerPricing(pricing)
  }

  const handleEditCustomer = async (customer) => {
    try {
      // Fetch customer's custom pricing
      const pricingResponse = await fetch(`/api/customers/${customer.id}`)
      const customerData = await pricingResponse.json()
      
      // Fetch existing custom pricing for this customer
      const existingPricing = {}
      for (const product of products) {
        try {
          const response = await fetch(`/api/pricing?customerId=${customer.id}&productId=${product.id}`)
          const pricingData = await response.json()
          if (pricingData.customPrice) {
            existingPricing[product.id] = pricingData.customPrice
          }
        } catch (error) {
          console.log(`No custom pricing found for product ${product.id}`)
        }
      }

      // Set the form data for editing
      setEditingCustomer(customer)
      setCustomerPricing(existingPricing)
      setIsEditMode(true)
      setShowAdvancedPricing(Object.keys(existingPricing).length > 0)
      setActiveTab('add') // Switch to the form tab
    } catch (error) {
      console.error('Error loading customer data:', error)
      alert('Failed to load customer data for editing')
    }
  }

  const handleCancelEdit = () => {
    setEditingCustomer(null)
    setCustomerPricing({})
    setIsEditMode(false)
    setShowAdvancedPricing(false)
  }

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage)

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Field configuration for the form

  // Field configuration for the form
  const fieldConfig = {
    name: { type: 'text', label: 'Customer Name', placeholder: 'Enter customer name', required: true },
    address: { type: 'text', label: 'Address', placeholder: 'Enter customer address' },
    phone: { 
      type: 'tel', 
      label: 'Phone Number', 
      placeholder: 'e.g., 03001234567 or +923001234567',
      helperText: 'Optional: Pakistani phone number format'
    },
    joiningDate: { type: 'date', label: 'Joining Date' },
    openingBottles: { 
      type: 'number', 
      label: 'Opening Bottles', 
      placeholder: 'Enter number of bottles (default: 0)',
      min: 0
    },
    // Legacy field for backward compatibility
    ...(products.length === 1 && !showAdvancedPricing && {
      productPrice: { 
        type: 'number', 
        label: `${products[0]?.name} Price (PKR)`, 
        placeholder: 'Enter price per bottle', 
        helperText: `Default Rate: PKR ${products[0]?.basePrice}`,
        min: 0,
        step: 0.01
      }
    })
  }

  const formFields = ['name', 'address', 'phone', 'joiningDate', 'openingBottles']
  if (products.length === 1 && !showAdvancedPricing) {
    formFields.push('productPrice')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customers Management</h1>
        <div className="text-sm text-gray-500">
          Total Customers: {customers.length}
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
              📝 Add New Customer
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 View All Customers ({customers.length})
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
                    {isEditMode ? 'Edit Customer' : 'Add New Customer'}
                  </h2>
                  {isEditMode && (
                    <p className="text-sm text-gray-600 mt-1">
                      Editing: {editingCustomer?.name}
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
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        showAdvancedPricing 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {showAdvancedPricing ? '📊 Advanced Pricing (ON)' : '💰 Enable Custom Pricing'}
                    </button>
                  )}
                </div>
              </div>

              <Form 
                title={isEditMode ? "Edit Customer - AquaFine" : "Add Customer - AquaFine"}
                fields={formFields} 
                fieldConfig={fieldConfig}
                onSubmit={addCustomer}
                initialData={editingCustomer}
                key={editingCustomer?.id || 'new'} // Force re-render when editing different customer 
              />

              {/* Advanced Product Pricing */}
              {(showAdvancedPricing || products.length > 1) && products.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <CustomerPricing
                    products={products}
                    onPricingChange={handlePricingChange}
                    initialPricing={customerPricing}
                    key={editingCustomer?.id || 'new'} // Force re-render when editing different customer
                  />
                </div>
              )}

              {products.length === 0 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div>
                      <p className="text-yellow-800 font-medium">No Products Available</p>
                      <p className="text-yellow-700 text-sm">
                        Please add products first before creating customers. 
                        <a href="/products" className="text-yellow-800 underline ml-1">Go to Products →</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'view' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Customers</h2>
                <div className="text-sm text-gray-500">
                  {searchQuery ? `${filteredCustomers.length} of ${customers.length} customers` : `${customers.length} total customers`}
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
                    placeholder="Search customers by name, phone, or address..."
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
                  {filteredCustomers.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <span className="text-yellow-800">No customers found matching "{searchQuery}"</span>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <span className="text-blue-800">Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} matching "{searchQuery}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Customers Table */}
              {paginatedCustomers.length > 0 && (
                <div className="mb-6">
                  <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Bottles</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedCustomers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {customer.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.phone || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.address || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.joiningDate ? new Date(customer.joiningDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.openingBottles || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => handleEditCustomer(customer)}
                                  disabled={isLoading}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => deleteCustomer(customer.id, customer.name)}
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
              )}              {/* Pagination */}
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
                        <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredCustomers.length)}</span> of{' '}
                        <span className="font-medium">{filteredCustomers.length}</span> customers
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
              {customers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first customer.</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Customer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
