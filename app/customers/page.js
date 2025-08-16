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
      
      console.log('Sending POST request to create customer:', customerData)
      
      // Send POST request to backend
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Customer created successfully:', result)
      
      // Refresh the customers list from the database
      const updatedCustomers = await fetch('/api/customers').then(r => r.json())
      setCustomers(updatedCustomers)
      
      // Reset pricing after adding customer
      setCustomerPricing({})
      setShowAdvancedPricing(false)
      
      alert('Customer added successfully!')
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('Failed to create customer: ' + error.message)
    }
  }

  const handlePricingChange = (pricing) => {
    setCustomerPricing(pricing)
  }

  // Field configuration for the form
  const fieldConfig = {
    name: { type: 'text', label: 'Customer Name', placeholder: 'Enter customer name' },
    address: { type: 'text', label: 'Address', placeholder: 'Enter customer address' },
    phone: { type: 'number', label: 'Phone Number', placeholder: 'Enter phone number' },
    joiningDate: { type: 'date', label: 'Joining Date' },
    openingBottles: { type: 'number', label: 'Opening Bottles', placeholder: 'Enter number of bottles' },
    // Legacy field for backward compatibility
    ...(products.length === 1 && !showAdvancedPricing && {
      productPrice: { 
        type: 'number', 
        label: `${products[0]?.name} Price (PKR)`, 
        placeholder: 'Enter price per bottle', 
        helperText: `Default Rate: PKR ${products[0]?.basePrice}` 
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

      {/* Add Customer Form */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
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

          <Form 
            title="Add Customer - AquaFine" 
            fields={formFields} 
            fieldConfig={fieldConfig}
            onSubmit={addCustomer} 
          />

          {/* Advanced Product Pricing */}
          {(showAdvancedPricing || products.length > 1) && products.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <CustomerPricing
                products={products}
                onPricingChange={handlePricingChange}
                initialPricing={customerPricing}
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
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-md">
        <Table
          columns={['id','name','phone','address','joiningDate','openingBottles','productSelect','productPrice']}
          data={customers}
        />
      </div>
    </div>
  )
}
