'use client'
import { useState, useEffect } from 'react'

// Helper function to fetch the effective price for a customer-product combination
const fetchCustomerProductPrice = async (customerId, productId) => {
  try {
    const response = await fetch(`/api/pricing?customerId=${customerId}&productId=${productId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch pricing')
    }
    const data = await response.json()
    return data.effectivePrice
  } catch (error) {
    console.error('Error fetching customer product price:', error)
    throw error
  }
}

export default function Form({ fields = [], onSubmit, title = 'Form', fieldConfig = {}, employees = [], customers = [], products = [], salesEmployees = [], initialData = null }) {
  const [form, setForm] = useState(() => {
    const initialForm = Object.fromEntries(fields.map(f => [f, '']))
    
    // If initialData is provided, merge it with the initial form
    if (initialData) {
      Object.keys(initialData).forEach(key => {
        if (fields.includes(key) && initialData[key] !== null && initialData[key] !== undefined) {
          // Format dates properly
          if (key.includes('Date') && initialData[key]) {
            try {
              const date = new Date(initialData[key])
              initialForm[key] = date.toISOString().split('T')[0]
            } catch (error) {
              initialForm[key] = initialData[key]
            }
          } else {
            initialForm[key] = initialData[key]
          }
        }
      })
    }
    
    // Set current date as default for date fields only if not provided in initialData
    if (!initialData) {
      if (title.includes('Employee Advance') && fields.includes('date')) {
        initialForm.date = new Date().toISOString().split('T')[0]
      }
      if (title.includes('Customer Advance') && fields.includes('date')) {
        initialForm.date = new Date().toISOString().split('T')[0]
      }
      if (title.includes('Sell Order') && fields.includes('billDate')) {
        initialForm.billDate = new Date().toISOString().split('T')[0]
      }
    }
    
    return initialForm
  })
  const [productList, setProductList] = useState([])

  useEffect(() => {
    // Fetch products from API
    fetch('/api/products')
      .then(r => r.json())
      .then(setProductList)
      .catch(err => console.error('Error fetching products:', err))
  }, [])

  // Update form when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      const updatedForm = {}
      Object.keys(initialData).forEach(key => {
        if (fields.includes(key) && initialData[key] !== null && initialData[key] !== undefined) {
          // Format dates properly
          if (key.includes('Date') && initialData[key]) {
            try {
              const date = new Date(initialData[key])
              updatedForm[key] = date.toISOString().split('T')[0]
            } catch (error) {
              updatedForm[key] = initialData[key]
            }
          } else {
            updatedForm[key] = initialData[key]
          }
        }
      })
      setForm(prevForm => ({ ...prevForm, ...updatedForm }))
    }
  }, [initialData, fields])

  const handleInputChange = (field, value) => {
    // Validation for numeric fields
    if ((field === 'openingBottles' || field === 'productPrice' || field === 'cnic' || field === 'salary' || field === 'amount' || field === 'bottleCost' || field === 'quantity') && value !== '') {
      // Only allow numbers and decimal points for price, salary, and amount
      if (field === 'productPrice' || field === 'salary' || field === 'amount' || field === 'bottleCost') {
        if (!/^\d*\.?\d*$/.test(value)) {
          return
        }
      } else if (field === 'cnic') {
        // CNIC should be exactly 13 digits
        if (!/^\d*$/.test(value) || value.length > 13) {
          return
        }
      } else if (!/^\d*$/.test(value)) {
        return
      }
    }
    
    // Special handling for phone field - allow Pakistani phone number formats
    if (field === 'phone' && value !== '') {
      // Allow digits, +, spaces, dashes
      if (!/^[\d+\s\-]*$/.test(value)) {
        return
      }
      // Limit length to reasonable phone number length
      if (value.length > 16) {
        return
      }
    }
    
    // Validate date to prevent future dates
    if (field === 'joiningDate' && value) {
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // Set to end of today
      
      if (selectedDate > today) {
        return // Don't update if future date
      }
    }
    
    // Auto-fill product price when product is selected
    if (field === 'productSelect') {
      const selectedProduct = productList.find(p => p.name === value)
      if (selectedProduct) {
        setForm({ 
          ...form, 
          [field]: value,
          productPrice: selectedProduct.basePrice.toString()
        })
        return
      }
    }
    
    // Auto-fill bottle cost when product is selected in sell order
    if (field === 'productName') {
      const selectedProduct = productList.find(p => p.name === value)
      const selectedCustomer = customers.find(c => c.name === form.customerName)
      
      if (selectedProduct && selectedCustomer) {
        // Fetch custom pricing from API
        fetchCustomerProductPrice(selectedCustomer.id, selectedProduct.id)
          .then(price => {
            setForm(prevForm => ({ 
              ...prevForm, 
              [field]: value,
              bottleCost: price.toString()
            }))
          })
          .catch(err => {
            console.error('Error fetching customer price:', err)
            // Fallback to base price
            setForm(prevForm => ({ 
              ...prevForm, 
              [field]: value,
              bottleCost: selectedProduct.basePrice?.toString() || '0'
            }))
          })
        return
      } else if (selectedProduct) {
        // If no customer selected yet, just use base price
        setForm({ 
          ...form, 
          [field]: value,
          bottleCost: selectedProduct.basePrice?.toString() || '0'
        })
        return
      }
    }
    
    // Auto-fill bottle cost when customer is selected in sell order
    if (field === 'customerName' && form.productName) {
      const selectedProduct = productList.find(p => p.name === form.productName)
      const selectedCustomer = customers.find(c => c.name === value)
      
      if (selectedProduct && selectedCustomer) {
        // Fetch custom pricing from API
        fetchCustomerProductPrice(selectedCustomer.id, selectedProduct.id)
          .then(price => {
            setForm(prevForm => ({ 
              ...prevForm, 
              [field]: value,
              bottleCost: price.toString()
            }))
          })
          .catch(err => {
            console.error('Error fetching customer price:', err)
            // Fallback to base price
            setForm(prevForm => ({ 
              ...prevForm, 
              [field]: value,
              bottleCost: selectedProduct.basePrice?.toString() || '0'
            }))
          })
        return
      }
    }
    
    setForm({ ...form, [field]: value })
  }

  const renderField = (field) => {
    const fieldType = fieldConfig[field]?.type || 'text'
    const placeholder = fieldConfig[field]?.placeholder || field
    const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format

    switch (fieldType) {
      case 'date':
        return (
          <input
            key={field}
            type="date"
            name={field}
            value={form[field]}
            max={today}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        )
      
      case 'select':
        if (field === 'productSelect') {
          return (
            <select
              key={field}
              name={field}
              value={form[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Product</option>
              {productList.map(product => (
                <option key={product.id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          )
        } else if (field === 'employeeType') {
          const employeeTypes = [
            'Worker',
            'Manager',
            'Rider',
          ]
          return (
            <select
              key={field}
              name={field}
              value={form[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Employee Type</option>
              {employeeTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )
        } else if (field === 'employeeName') {
          return (
            <select
              key={field}
              name={field}
              value={form[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Employee</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.name}>
                  {employee.name} ({employee.employeeType})
                </option>
              ))}
            </select>
          )
        } else if (field === 'customerName') {
          return (
            <select
              key={field}
              name={field}
              value={form[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>
          )
        } else if (field === 'productName') {
          return (
            <select
              key={field}
              name={field}
              value={form[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Product</option>
              {productList.map(product => (
                <option key={product.id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          )
        } else if (field === 'salesmanAppointed') {
          return (
            <select
              key={field}
              name={field}
              value={form[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Salesman (Optional)</option>
              {salesEmployees.map(employee => (
                <option key={employee.id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          )
        } else {
          // Generic select field using fieldConfig options
          const options = fieldConfig[field]?.options || []
          return (
            <select
              key={field}
              name={field}
              value={form[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={fieldConfig[field]?.required !== false}
            >
              <option value="">Select {fieldConfig[field]?.label || field}</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        }
        break
      
      case 'number':
        return (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={placeholder}
            value={form[field]}
            min={fieldConfig[field]?.min}
            step={fieldConfig[field]?.step}
            readOnly={fieldConfig[field]?.readOnly}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldConfig[field]?.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            inputMode={field === 'productPrice' || field === 'salary' || field === 'amount' || field === 'bottleCost' ? 'decimal' : 'numeric'}
            required={fieldConfig[field]?.required !== false}
          />
        )
      
      case 'tel':
        return (
          <input
            key={field}
            type="tel"
            name={field}
            placeholder={placeholder}
            value={form[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={fieldConfig[field]?.required !== false}
          />
        )
      
      default:
        return (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={placeholder}
            value={form[field]}
            readOnly={fieldConfig[field]?.readOnly}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldConfig[field]?.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            required={fieldConfig[field]?.required !== false}
          />
        )
    }
  }

  // Split fields into two columns
  const leftColumnFields = fields.slice(0, Math.ceil(fields.length / 2))
  const rightColumnFields = fields.slice(Math.ceil(fields.length / 2))

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Check if all required fields are filled
    const optionalFields = ['salesmanAppointed'] // Add other optional fields here
    const requiredFields = fields.filter(field => {
      // Check if field is explicitly marked as not required
      if (fieldConfig[field]?.required === false) return false
      // Check if field is in optional list
      if (optionalFields.includes(field)) return false
      return true
    })
    
    const emptyFields = requiredFields.filter(field => !form[field] || form[field].toString().trim() === '')
    
    if (emptyFields.length > 0) {
      alert(`Please fill in all required fields: ${emptyFields.join(', ')}`)
      return
    }
    
    // Validate joining date is not in future
    if (form.joiningDate) {
      const selectedDate = new Date(form.joiningDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      if (selectedDate > today) {
        alert('Joining date cannot be in the future.')
        return
      }
    }
    
    // Validate CNIC format
    if (form.cnic && form.cnic.length !== 13) {
      alert('CNIC number must be exactly 13 digits.')
      return
    }
    
    onSubmit?.(form)
    // Reset form after submission
    setForm(Object.fromEntries(fields.map(f => [f, ''])))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-6"
    >
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {leftColumnFields.map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {fieldConfig[field]?.label || field.replace(/([A-Z])/g, ' $1').trim()}
                {fieldConfig[field]?.required !== false && field !== 'salesmanAppointed' && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {fieldConfig[field]?.helperText && (
                <p className="text-xs text-gray-500 mt-1">
                  {fieldConfig[field].helperText}
                </p>
              )}
              {field === 'productPrice' && (
                <p className="text-xs text-gray-500 mt-1">
                  Price auto-fills when product is selected. You can customize it.
                </p>
              )}
              {field === 'joiningDate' && (
                <p className="text-xs text-gray-500 mt-1">
                  Cannot select future dates.
                </p>
              )}
              {field === 'cnic' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter exactly 13 digits without dashes (e.g., 1234567890123).
                </p>
              )}
              {field === 'salary' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter salary amount (decimals allowed).
                </p>
              )}
              {field === 'amount' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter advance amount (decimals allowed).
                </p>
              )}
              {field === 'bottleCost' && (
                <p className="text-xs text-gray-500 mt-1">
                  Auto-fills based on customer and product selection.
                </p>
              )}
              {field === 'quantity' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter number of bottles.
                </p>
              )}
              {field === 'billDate' && (
                <p className="text-xs text-gray-500 mt-1">
                  Select bill date (today&apos;s date recommended).
                </p>
              )}
              {field === 'salesmanAppointed' && (
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Select a rider for delivery.
                </p>
              )}
            </div>
          ))}
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {rightColumnFields.map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {fieldConfig[field]?.label || field.replace(/([A-Z])/g, ' $1').trim()}
                {fieldConfig[field]?.required !== false && field !== 'salesmanAppointed' && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {fieldConfig[field]?.helperText && (
                <p className="text-xs text-gray-500 mt-1">
                  {fieldConfig[field].helperText}
                </p>
              )}
              {field === 'productPrice' && (
                <p className="text-xs text-gray-500 mt-1">
                  Price auto-fills when product is selected. You can customize it.
                </p>
              )}
              {field === 'joiningDate' && (
                <p className="text-xs text-gray-500 mt-1">
                  Cannot select future dates.
                </p>
              )}
              {field === 'cnic' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter exactly 13 digits without dashes (e.g., 1234567890123).
                </p>
              )}
              {field === 'salary' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter salary amount (decimals allowed).
                </p>
              )}
              {field === 'amount' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter advance amount (decimals allowed).
                </p>
              )}
              {field === 'bottleCost' && (
                <p className="text-xs text-gray-500 mt-1">
                  Auto-fills based on customer and product selection.
                </p>
              )}
              {field === 'quantity' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter number of bottles.
                </p>
              )}
              {field === 'billDate' && (
                <p className="text-xs text-gray-500 mt-1">
                  Select bill date (today&apos;s date recommended).
                </p>
              )}
              {field === 'salesmanAppointed' && (
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Select a rider for delivery.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200 font-medium"
        >
          {title.includes('Customer Advance') ? 'Save Customer Advance' :
           title.includes('Sell Order') ? 'Create Sell Order' :
           title.includes('Customer') ? 'Save Customer' : 
           title.includes('Employee Advance') ? 'Save Employee Advance' : 
           title.includes('Employee') ? 'Save Employee' : 'Save'}
        </button>
      </div>
    </form>
  )
}
