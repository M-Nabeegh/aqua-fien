'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'

export default function CustomerLedgersPage() {
  const [customers, setCustomers] = useState([])
  const [advances, setAdvances] = useState([])
  const [sellOrders, setSellOrders] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [ledgerData, setLedgerData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    // Fetch customers, advances, and sell orders
    fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => setCustomers([]))
    fetch('/api/customer-advances').then(r => r.json()).then(setAdvances).catch(() => setAdvances([]))
    fetch('/api/sell-orders').then(r => r.json()).then(setSellOrders).catch(() => setSellOrders([]))
  }, [])

  const calculateLedger = () => {
    // Calculate ledger for each customer
    const ledger = customers.map(customer => {
      const customerAdvances = advances.filter(adv => adv.customerName === customer.name)
      const customerSales = sellOrders.filter(order => order.customerName === customer.name)
      
      const totalAdvances = customerAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount || 0), 0)
      const totalSales = customerSales.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0)
      const remaining = totalAdvances - totalSales

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        totalAdvances: totalAdvances,
        totalSales: totalSales,
        remaining: remaining,
        status: remaining >= 0 ? 'Credit' : 'Debit'
      }
    })

    setLedgerData(ledger)
  }

  const printSingleCustomerLedger = (customerName) => {
    const customer = customers.find(cust => cust.name === customerName)
    if (!customer) return

    const customerAdvances = advances.filter(adv => adv.customerName === customerName)
    const customerSales = sellOrders.filter(order => order.customerName === customerName)
    const totalAdvances = customerAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount || 0), 0)
    const totalSales = customerSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0)
    const remaining = totalAdvances - totalSales

    // Create a printable window with same style as employee ledger
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Ledger - ${customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .customer-info { margin-bottom: 20px; }
            .advances-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .advances-table th, .advances-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .advances-table th { background-color: #f2f2f2; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
            .deficit { color: red; font-weight: bold; }
            .credit { color: green; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AquaFine - Customer Ledger</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="customer-info">
            <h2>Customer: ${customer.name}</h2>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            <p><strong>Address:</strong> ${customer.address}</p>
            <p><strong>Product:</strong> ${customer.productSelect}</p>
            <p><strong>Product Price:</strong> Rs. ${customer.productPrice}</p>
          </div>

          <h3>Advances Given</h3>
          <table class="advances-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${customerAdvances.map(adv => `
                <tr>
                  <td>${adv.date}</td>
                  <td>Rs. ${parseFloat(adv.amount).toFixed(2)}</td>
                  <td>${adv.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>Sales Made</h3>
          <table class="advances-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${customerSales.map(sale => `
                <tr>
                  <td>${sale.billDate}</td>
                  <td>${sale.productName}</td>
                  <td>${sale.quantity}</td>
                  <td>Rs. ${parseFloat(sale.bottleCost).toFixed(2)}</td>
                  <td>Rs. ${parseFloat(sale.totalAmount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Advances:</strong> Rs. ${totalAdvances.toFixed(2)}</p>
            <p><strong>Total Sales:</strong> Rs. ${totalSales.toFixed(2)}</p>
            <p><strong>Remaining Balance:</strong> <span class="${remaining >= 0 ? 'credit' : 'deficit'}">Rs. ${remaining.toFixed(2)}</span></p>
            <p><em>${remaining >= 0 ? 'Customer has credit balance' : 'Customer owes money'}</em></p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const printBillInvoice = () => {
    if (!selectedCustomer || !fromDate || !toDate) {
      alert('Please select customer and date range')
      return
    }

    const customer = customers.find(cust => cust.name === selectedCustomer)
    const customerSales = sellOrders.filter(order => 
      order.customerName === selectedCustomer &&
      order.billDate >= fromDate &&
      order.billDate <= toDate
    )

    if (customerSales.length === 0) {
      alert('No sales found for the selected customer and date range')
      return
    }

    const totalBottles = customerSales.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)
    const totalAmount = customerSales.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0)

    // Create a printable invoice with enhanced styling
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill Invoice - ${selectedCustomer}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .invoice-info { margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
            .advances-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .advances-table th, .advances-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .advances-table th { background-color: #f2f2f2; font-weight: bold; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; border: 2px solid #e9ecef; }
            .total { font-weight: bold; font-size: 1.2em; color: #007bff; }
            .bottles-highlight { background-color: #e7f3ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .invoice-number { color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AQUA FINE</h1>
            <p class="invoice-number">Invoice #WS-${Date.now()}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-info">
            <h2>📋 Invoice Details</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p><strong>Customer:</strong> ${selectedCustomer}</p>
                <p><strong>Phone:</strong> ${customer?.phone || 'N/A'}</p>
                <p><strong>Address:</strong> ${customer?.address || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Billing Period:</strong></p>
                <p><strong>From:</strong> ${fromDate}</p>
                <p><strong>To:</strong> ${toDate}</p>
              </div>
            </div>
          </div>

          <div class="bottles-highlight">
            <h3>🍾 Total Bottles Delivered: <span style="color: #007bff; font-size: 1.3em;">${totalBottles} Bottles</span></h3>
          </div>

          <h3>📦 Detailed Invoice Items</h3>
          <table class="advances-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Bottles Delivered</th>
                <th>Rate per Bottle</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${customerSales.map(item => `
                <tr>
                  <td>${new Date(item.billDate).toLocaleDateString()}</td>
                  <td>${item.productName}</td>
                  <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                  <td>Rs. ${parseFloat(item.bottleCost).toFixed(2)}</td>
                  <td style="font-weight: bold;">Rs. ${parseFloat(item.totalAmount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>💰 Invoice Summary</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center;">
              <div>
                <p><strong>Total Deliveries:</strong> ${customerSales.length} times</p>
                <p><strong>Total Bottles:</strong> ${totalBottles} bottles</p>
                <p><strong>Average per delivery:</strong> ${(totalBottles / customerSales.length).toFixed(1)} bottles</p>
              </div>
              <div style="text-align: right;">
                <p class="total">TOTAL AMOUNT DUE: Rs. ${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
            <p>Thank you for your purchase!</p>
            <p>AquaFine - Premium Water Supply</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  useEffect(() => {
    calculateLedger()
  }, [customers, advances, sellOrders])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Customer Ledgers</h1>
      </div>

      {/* Customer Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-6 text-lg">Customer Actions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Print Individual Ledger */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-green-700">📄 Print Customer Ledger</h4>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choose customer to print ledger...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.name}>
                  {customer.name} ({customer.phone})
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <button
                onClick={() => printSingleCustomerLedger(selectedCustomer)}
                className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium"
              >
                🖨️ Print Complete Ledger
              </button>
            )}
          </div>

          {/* Generate Bill Invoice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-blue-700">🧾 Generate Bill Invoice</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer for Invoice
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose customer for invoice...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Period
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {selectedCustomer && fromDate && toDate && (
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">
                    📋 Invoice will include all bottles delivered to <strong>{selectedCustomer}</strong> from <strong>{fromDate}</strong> to <strong>{toDate}</strong>
                  </p>
                  <button
                    onClick={printBillInvoice}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md transition-colors duration-200 font-medium"
                  >
                    🖨️ Generate & Print Bill Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Summary Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Customer Ledger Summary</h3>
        </div>
        <Table
          columns={['name', 'phone', 'totalAdvances', 'totalSales', 'remaining', 'status']}
          data={ledgerData.map(item => ({
            ...item,
            totalAdvances: `Rs. ${item.totalAdvances.toFixed(2)}`,
            totalSales: `Rs. ${item.totalSales.toFixed(2)}`,
            remaining: `Rs. ${item.remaining.toFixed(2)}`,
          }))}
        />
      </div>
    </div>
  )
}
