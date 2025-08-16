'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false)
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const [isRiderDropdownOpen, setIsRiderDropdownOpen] = useState(false)
  const [isExpenditureDropdownOpen, setIsExpenditureDropdownOpen] = useState(false)

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* AquaFine Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-2">
            {/* Custom Water Droplet SVG Logo */}
            <svg className="w-8 h-8 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.8L7.5 10.5c-1.4 2.4-1.4 5.4 0 7.8C8.9 20.1 10.4 21 12 21s3.1-.9 4.5-2.7c1.4-2.4 1.4-5.4 0-7.8L12 2.8zm0 16.2c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            <div>
              <div className="font-bold text-xl">AquaFine</div>
              <div className="text-xs text-blue-200">Premium Water Supply</div>
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-8 items-center">
          <Link href="/" className="hover:text-blue-200 transition-colors font-medium">
            🏠 Dashboard
          </Link>

          {/* Products Dropdown */}
          <div className="relative">
            <Link 
              href="/products" 
              className="hover:text-blue-200 transition-colors font-medium"
            >
              📦 Products
            </Link>
          </div>

          {/* Customer Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors font-medium focus:outline-none"
            >
              👥 Customers
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isCustomerDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl min-w-56 z-50 border border-gray-200">
                <Link 
                  href="/customers" 
                  className="block px-4 py-3 hover:bg-blue-50 rounded-t-lg transition-colors"
                  onClick={() => setIsCustomerDropdownOpen(false)}
                >
                  ➕ Add Customer
                </Link>
                <Link 
                  href="/customer-advance" 
                  className="block px-4 py-3 hover:bg-blue-50 transition-colors"
                  onClick={() => setIsCustomerDropdownOpen(false)}
                >
                  💰 Add Customer Advance
                </Link>
                <Link 
                  href="/sell-order" 
                  className="block px-4 py-3 hover:bg-blue-50 transition-colors"
                  onClick={() => setIsCustomerDropdownOpen(false)}
                >
                  🛒 Sell Order
                </Link>
                <Link 
                  href="/customer-ledgers" 
                  className="block px-4 py-3 hover:bg-blue-50 rounded-b-lg transition-colors"
                  onClick={() => setIsCustomerDropdownOpen(false)}
                >
                  📊 Customer Ledgers
                </Link>
              </div>
            )}
          </div>
          
          {/* Employee Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors font-medium focus:outline-none"
            >
              👷 Employees
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isEmployeeDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl min-w-56 z-50 border border-gray-200">
                <Link 
                  href="/employees" 
                  className="block px-4 py-3 hover:bg-blue-50 rounded-t-lg transition-colors"
                  onClick={() => setIsEmployeeDropdownOpen(false)}
                >
                  ➕ Add Employee
                </Link>
                <Link 
                  href="/employee-advance" 
                  className="block px-4 py-3 hover:bg-blue-50 transition-colors"
                  onClick={() => setIsEmployeeDropdownOpen(false)}
                >
                  💰 Add Employee Advance
                </Link>
                <Link 
                  href="/employee-ledgers" 
                  className="block px-4 py-3 hover:bg-blue-50 rounded-b-lg transition-colors"
                  onClick={() => setIsEmployeeDropdownOpen(false)}
                >
                  📊 Employee Ledgers
                </Link>
              </div>
            )}
          </div>

          {/* Rider Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRiderDropdownOpen(!isRiderDropdownOpen)}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors font-medium focus:outline-none"
            >
              🚚 Riders
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isRiderDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl min-w-56 z-50 border border-gray-200">
                <Link 
                  href="/rider-inout" 
                  className="block px-4 py-3 hover:bg-blue-50 rounded-t-lg transition-colors"
                  onClick={() => setIsRiderDropdownOpen(false)}
                >
                  📦 Add Rider Activity
                </Link>
                <Link 
                  href="/rider-ledgers" 
                  className="block px-4 py-3 hover:bg-blue-50 rounded-b-lg transition-colors"
                  onClick={() => setIsRiderDropdownOpen(false)}
                >
                  📊 Rider Ledgers
                </Link>
              </div>
            )}
          </div>

          {/* Expenditures Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExpenditureDropdownOpen(!isExpenditureDropdownOpen)}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors font-medium focus:outline-none"
            >
              💸 Expenditures
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isExpenditureDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl min-w-56 z-50 border border-gray-200">
                <Link 
                  href="/expenditures" 
                  className="block px-4 py-3 hover:bg-blue-50 rounded-t-lg transition-colors"
                  onClick={() => setIsExpenditureDropdownOpen(false)}
                >
                  ➕ Add Expenditure
                </Link>
                <Link 
                  href="/expenditure-ledgers" 
                  className="block px-4 py-3 hover:bg-blue-50 rounded-b-lg transition-colors"
                  onClick={() => setIsExpenditureDropdownOpen(false)}
                >
                  📊 Expenditure Ledgers
                </Link>
              </div>
            )}
          </div>
          
          <Link href="/reports" className="hover:text-blue-200 transition-colors font-medium">
            📈 Reports
          </Link>
        </div>
      </div>
      
      {/* Overlay to close dropdown when clicking outside */}
      {(isEmployeeDropdownOpen || isCustomerDropdownOpen || isRiderDropdownOpen || isExpenditureDropdownOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsEmployeeDropdownOpen(false)
            setIsCustomerDropdownOpen(false)
            setIsRiderDropdownOpen(false)
            setIsExpenditureDropdownOpen(false)
          }}
        ></div>
      )}
    </nav>
  )
}
