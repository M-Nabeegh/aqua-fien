'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'

export default function SalaryPaymentsPage() {
  const [salaryPayments, setSalaryPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSalaryPayments()
  }, [])

  const fetchSalaryPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/salary-payments')
      if (response.ok) {
        const data = await response.json()
        setSalaryPayments(data)
      } else {
        console.error('Failed to fetch salary payments')
        setSalaryPayments([])
      }
    } catch (error) {
      console.error('Error fetching salary payments:', error)
      setSalaryPayments([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Transform data for table display
  const tableData = salaryPayments.map(payment => ({
    ...payment,
    amount: formatCurrency(payment.amount),
    paymentDate: formatDate(payment.paymentDate),
    monthYear: new Date(payment.monthYear + '-01').toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long'
    })
  }))

  // Calculate totals
  const totalPayments = salaryPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthPayments = salaryPayments.filter(p => p.monthYear === currentMonth)
  const thisMonthTotal = thisMonthPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">💰 Salary Payments</h1>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">💰 Salary Payments</h1>
        <button
          onClick={() => window.location.href = '/employees'}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          ➕ Pay Salary
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">💰</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Salary Payments</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayments)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">📅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">This Month Payments</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">👥</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Payments This Month</p>
              <p className="text-2xl font-bold text-gray-900">{thisMonthPayments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        {salaryPayments.length > 0 ? (
          <Table 
            columns={[
              'id',
              'employeeName', 
              'employeeType',
              'amount', 
              'paymentDate', 
              'monthYear',
              'notes'
            ]} 
            data={tableData}
            columnLabels={{
              id: 'ID',
              employeeName: 'Employee',
              employeeType: 'Type',
              amount: 'Amount',
              paymentDate: 'Payment Date',
              monthYear: 'Salary Month',
              notes: 'Notes'
            }}
          />
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No salary payments yet</h3>
            <p className="text-gray-500 mb-4">Start by paying employee salaries from the employees page.</p>
            <button
              onClick={() => window.location.href = '/employees'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Employees
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
