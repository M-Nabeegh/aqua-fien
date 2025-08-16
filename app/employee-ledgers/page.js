'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'

export default function EmployeeLedgersPage() {
  const [employees, setEmployees] = useState([])
  const [advances, setAdvances] = useState([])
  const [selectedEmployeeType, setSelectedEmployeeType] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [ledgerData, setLedgerData] = useState([])

  const employeeTypes = ['worker', 'manager', 'rider'] // Use lowercase to match database

  useEffect(() => {
    // Fetch employees and advances
    fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => setEmployees([]))
    fetch('/api/employee-advances').then(r => r.json()).then(setAdvances).catch(() => setAdvances([]))
  }, [])

  const calculateLedger = () => {
    let filteredEmployees = employees

    // Filter by employee type if selected
    if (selectedEmployeeType) {
      filteredEmployees = employees.filter(emp => 
        emp.employeeType && emp.employeeType.toLowerCase() === selectedEmployeeType.toLowerCase()
      )
    }

    // Calculate ledger for each employee
    const ledger = filteredEmployees.map(employee => {
      let employeeAdvances = advances.filter(adv => adv.employeeName === employee.name)
      
      // Filter advances by date range if specified
      if (dateFrom || dateTo) {
        employeeAdvances = employeeAdvances.filter(adv => {
          if (!adv.advanceDate) return false
          const advanceDate = new Date(adv.advanceDate)
          
          if (dateFrom && advanceDate < new Date(dateFrom)) return false
          if (dateTo && advanceDate > new Date(dateTo)) return false
          
          return true
        })
      }
      
      const totalAdvances = employeeAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount || 0), 0)
      const salary = parseFloat(employee.monthlySalary || 0)
      const remaining = salary - totalAdvances

      return {
        id: employee.id,
        name: employee.name,
        employeeType: employee.employeeType,
        salary: salary,
        totalAdvances: totalAdvances,
        remaining: remaining,
        status: remaining >= 0 ? 'Positive' : 'Deficit'
      }
    })

    setLedgerData(ledger)
  }

  const printSingleEmployeeLedger = (employeeName) => {
    const employee = employees.find(emp => emp.name === employeeName)
    if (!employee) return

    const employeeAdvances = advances.filter(adv => adv.employeeName === employeeName)
    const totalAdvances = employeeAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount || 0), 0)
    const salary = parseFloat(employee.monthlySalary || 0)
    const remaining = salary - totalAdvances

    // Create a printable window
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee Ledger - ${employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .employee-info { margin-bottom: 20px; }
            .advances-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .advances-table th, .advances-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .advances-table th { background-color: #f2f2f2; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
            .deficit { color: red; font-weight: bold; }
            .positive { color: green; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AquaFine - Employee Ledger</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="employee-info">
            <h2>Employee: ${employee.name}</h2>
            <p><strong>Type:</strong> ${employee.employeeType}</p>
            <p><strong>CNIC:</strong> ${employee.cnic}</p>
            <p><strong>Phone:</strong> ${employee.phone}</p>
            <p><strong>Monthly Salary:</strong> Rs. ${salary.toFixed(2)}</p>
          </div>

          <h3>Advances Taken</h3>
          <table class="advances-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${employeeAdvances.map(adv => `
                <tr>
                  <td>${adv.date}</td>
                  <td>Rs. ${parseFloat(adv.amount).toFixed(2)}</td>
                  <td>${adv.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Monthly Salary:</strong> Rs. ${salary.toFixed(2)}</p>
            <p><strong>Total Advances:</strong> Rs. ${totalAdvances.toFixed(2)}</p>
            <p><strong>Remaining Amount:</strong> <span class="${remaining >= 0 ? 'positive' : 'deficit'}">Rs. ${remaining.toFixed(2)}</span></p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  useEffect(() => {
    calculateLedger()
  }, [employees, advances, selectedEmployeeType, dateFrom, dateTo])

  const filteredEmployees = selectedEmployeeType 
    ? employees.filter(emp => emp.employeeType && emp.employeeType.toLowerCase() === selectedEmployeeType.toLowerCase())
    : employees

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Employee Ledgers</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee Type
            </label>
            <select
              value={selectedEmployeeType}
              onChange={(e) => setSelectedEmployeeType(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {employeeTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Print Individual Ledger
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Employee to Print</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.employeeType ? emp.employeeType.charAt(0).toUpperCase() + emp.employeeType.slice(1) : 'Unknown'})
                </option>
              ))}
            </select>
            {selectedEmployee && (
              <button
                onClick={() => printSingleEmployeeLedger(selectedEmployee)}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Print Ledger
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Summary Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Employee Ledger Summary</h3>
        </div>
        <Table
          columns={['name', 'employeeType', 'salary', 'totalAdvances', 'remaining', 'status']}
          data={ledgerData.map(item => ({
            ...item,
            salary: `Rs. ${item.salary.toFixed(2)}`,
            totalAdvances: `Rs. ${item.totalAdvances.toFixed(2)}`,
            remaining: `Rs. ${item.remaining.toFixed(2)}`,
          }))}
        />
      </div>
    </div>
  )
}
