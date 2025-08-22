'use client'
import { useState, useRef, useEffect } from 'react'

export default function SearchableCustomerSelect({ 
  customers = [], 
  selectedCustomer, 
  onCustomerSelect, 
  placeholder = "Search for customers...", 
  label = "Select Customer",
  required = false 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredCustomers[highlightedIndex]) {
          selectCustomer(filteredCustomers[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const selectCustomer = (customer) => {
    onCustomerSelect(customer)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  // Get display value for selected customer
  const displayValue = selectedCustomer 
    ? `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}`
    : ''

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedCustomer ? displayValue : placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="off"
        />
        
        {/* Dropdown arrow */}
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          onClick={() => {
            setIsOpen(!isOpen)
            if (!isOpen) {
              inputRef.current?.focus()
            }
          }}
        >
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCustomers.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              {searchTerm ? `No customers found matching "${searchTerm}"` : 'No customers available'}
            </div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className={`px-3 py-2 cursor-pointer transition-colors ${
                  index === highlightedIndex 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectCustomer(customer)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium">{customer.name}</div>
                {customer.phone && (
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                )}
                {customer.address && (
                  <div className="text-xs text-gray-400 truncate">{customer.address}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected customer info */}
      {selectedCustomer && !isOpen && (
        <div className="mt-1 text-xs text-gray-500">
          {selectedCustomer.address && `📍 ${selectedCustomer.address}`}
        </div>
      )}
    </div>
  )
}
