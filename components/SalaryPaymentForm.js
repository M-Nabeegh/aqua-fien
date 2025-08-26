'use client'
import { useState, useEffect } from 'react'

export default function SalaryPaymentForm({ employee, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    amount: employee?.salary || '',
    paymentDate: new Date().toISOString().split('T')[0],
    monthYear: new Date().toISOString().slice(0, 7), // YYYY-MM format
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate month-year from payment date
    if (field === 'paymentDate' && value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setFormData(prev => ({
          ...prev,
          monthYear: date.toISOString().slice(0, 7)
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.amount || !formData.paymentDate || !formData.monthYear) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        employeeId: employee.id,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        monthYear: formData.monthYear,
        notes: formData.notes
      }

      const response = await fetch('/api/salary-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        alert('Salary payment recorded successfully!')
        onSubmit(result)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error submitting salary payment:', error)
      alert('Failed to record salary payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            💰 Pay Salary: {employee?.name}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700">
            <p><strong>Employee:</strong> {employee?.name}</p>
            <p><strong>Type:</strong> {employee?.employeeType}</p>
            <p><strong>Monthly Salary:</strong> PKR {employee?.salary}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary Amount (PKR) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter salary amount"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Pre-filled from monthly salary. You can modify if needed.
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => handleChange('paymentDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Month-Year (Auto-generated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary Month *
            </label>
            <input
              type="month"
              value={formData.monthYear}
              onChange={(e) => handleChange('monthYear', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-set from payment date. Change if paying for a different month.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Recording...' : '💰 Record Payment'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
