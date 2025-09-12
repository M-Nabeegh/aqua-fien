'use client'
import { useEffect, useState, useCallback } from 'react'
import Table from '../../components/Table'
import SearchableCustomerSelect from '../../components/SearchableCustomerSelect'

export default function CustomerLedgersPage() {
  const [customers, setCustomers] = useState([])
  const [advances, setAdvances] = useState([])
  const [sellOrders, setSellOrders] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedCustomerForInvoice, setSelectedCustomerForInvoice] = useState('')
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null)
  const [selectedCustomerObjForInvoice, setSelectedCustomerObjForInvoice] = useState(null)
  const [selectedProductForInvoice, setSelectedProductForInvoice] = useState(null)
  const [ledgerData, setLedgerData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM format

  useEffect(() => {
    // Fetch customers, advances, sell orders, and products with proper error handling
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(console.error)
    
    fetch('/api/customer-advances')
      .then(r => r.json())
      .then(data => setAdvances(Array.isArray(data) ? data : []))
      .catch(console.error)
    
    fetch('/api/sell-orders')
      .then(r => r.json())
      .then(data => setSellOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
    
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  const calculateLedger = useCallback(() => {
    // Ensure all data is arrays before processing
    const customersArray = Array.isArray(customers) ? customers : []
    const advancesArray = Array.isArray(advances) ? advances : []
    const sellOrdersArray = Array.isArray(sellOrders) ? sellOrders : []
    
    // Calculate ledger for each customer
    const ledger = customersArray.map(customer => {
      const customerAdvances = advancesArray.filter(adv => adv.customerName === customer.name)
      const customerSales = sellOrdersArray.filter(order => order.customerName === customer.name)
      
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
  }, [customers, advances, sellOrders])

  const printSingleCustomerLedger = (customerName) => {
    const customer = customers.find(cust => cust.name === customerName)
    if (!customer) return

    // Ensure arrays exist before filtering
    const advancesArray = Array.isArray(advances) ? advances : []
    const sellOrdersArray = Array.isArray(sellOrders) ? sellOrders : []
    
    const customerAdvances = advancesArray.filter(adv => adv.customerName === customerName)
    const customerSales = sellOrdersArray.filter(order => order.customerName === customerName)
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
    if (!selectedCustomerObjForInvoice || !fromDate || !toDate) {
      alert('Please select customer and date range')
      return
    }

    const customer = customers.find(cust => cust.name === selectedCustomerObjForInvoice.name)
    const sellOrdersArray = Array.isArray(sellOrders) ? sellOrders : []
    const customerSales = sellOrdersArray.filter(order => 
      order.customerName === selectedCustomerObjForInvoice.name &&
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
          <title>Bill Invoice - ${selectedCustomerObjForInvoice.name}</title>
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
                <p><strong>Customer:</strong> ${selectedCustomerObjForInvoice.name}</p>
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

  const printDailyBottleTrackingInvoice = async () => {
    if (!selectedCustomerObjForInvoice || !selectedProductForInvoice || !selectedMonth) {
      alert('Please select customer, product, and month')
      return
    }

    try {
      // Get the customer product bottle balance
      const bottleBalanceResponse = await fetch(`/api/customer-bottle-balance?customerId=${selectedCustomerObjForInvoice.id}&productId=${selectedProductForInvoice.id}`)
      const bottleBalanceData = await bottleBalanceResponse.json()
      const bottleBalance = bottleBalanceData[0] || { openingBottles: 0, totalDelivered: 0, totalEmptyCollected: 0, currentBottleBalance: 0 }

      // Get sell orders for the selected month
      const year = parseInt(selectedMonth.split('-')[0])
      const month = parseInt(selectedMonth.split('-')[1])
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0) // Last day of the month
      
      const sellOrdersArray = Array.isArray(sellOrders) ? sellOrders : []
      const monthlyOrders = sellOrdersArray.filter(order => {
        const orderDate = new Date(order.billDate)
        return order.customerName === selectedCustomerObjForInvoice.name &&
               order.productName === selectedProductForInvoice.name &&
               orderDate >= monthStart && orderDate <= monthEnd
      })

      // Get opening balance for the month (opening bottles + deliveries before this month - collections before this month)
      const ordersBeforeMonth = sellOrdersArray.filter(order => {
        const orderDate = new Date(order.billDate)
        return order.customerName === selectedCustomerObjForInvoice.name &&
               order.productName === selectedProductForInvoice.name &&
               orderDate < monthStart
      })

      const deliveredBeforeMonth = ordersBeforeMonth.reduce((sum, order) => sum + parseInt(order.quantity || 0), 0)
      const collectedBeforeMonth = ordersBeforeMonth.reduce((sum, order) => sum + parseInt(order.emptyBottlesCollected || 0), 0)
      const openingBalanceForMonth = bottleBalance.openingBottles + deliveredBeforeMonth - collectedBeforeMonth

      // Create daily breakdown
      const daysInMonth = monthEnd.getDate()
      const dailyData = []
      let runningBalance = openingBalanceForMonth

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day)
        
        // Find orders for this specific day
        const dayOrders = monthlyOrders.filter(order => {
          const orderDate = new Date(order.billDate)
          return orderDate.getDate() === day
        })

        const delivered = dayOrders.reduce((sum, order) => sum + parseInt(order.quantity || 0), 0)
        const collected = dayOrders.reduce((sum, order) => sum + parseInt(order.emptyBottlesCollected || 0), 0)
        const amount = dayOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0)

        // Update running balance
        runningBalance = runningBalance + delivered - collected

        dailyData.push({
          day,
          date: currentDate.toLocaleDateString(),
          delivered,
          collected,
          balance: runningBalance,
          amount: amount.toFixed(2)
        })
      }

      const totalDelivered = dailyData.reduce((sum, day) => sum + day.delivered, 0)
      const totalCollected = dailyData.reduce((sum, day) => sum + day.collected, 0)
      const totalAmount = dailyData.reduce((sum, day) => sum + parseFloat(day.amount), 0)

      // Calculate opening bottles cost (included in running balance but shown separately)
      const openingBottlesCost = openingBalanceForMonth > 0 ? openingBalanceForMonth * parseFloat(selectedProductForInvoice.basePrice || 0) : 0
      
      // For this invoice, we'll include opening bottles in the total
      // This ensures customers are charged for all bottles in their possession
      const grandTotalAmount = totalAmount + openingBottlesCost

      // Create printable invoice
      const printWindow = window.open('', '_blank')
      
      // Check if window was created successfully
      if (!printWindow || !printWindow.document) {
        alert('Pop-up blocked! Please allow pop-ups for this site and try again.')
        return
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Daily Bottle Tracking - ${selectedCustomerObjForInvoice.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .tracking-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
              .tracking-table th, .tracking-table td { border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 11px; }
              .tracking-table th { background-color: #f2f2f2; font-weight: bold; }
              .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; }
              .highlight { background-color: #e7f3ff; font-weight: bold; }
              .weekend { background-color: #fff2e6; }
              .has-activity { background-color: #e8f5e8; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🍾 DAILY BOTTLE TRACKING INVOICE</h1>
              <h2>AquaFine Water Supply</h2>
              <p>Month: ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div class="info-grid">
              <div>
                <h3>📋 Customer Details</h3>
                <p><strong>Name:</strong> ${selectedCustomerObjForInvoice.name}</p>
                <p><strong>Product:</strong> ${selectedProductForInvoice.name}</p>
                <p><strong>Opening Balance:</strong> ${openingBalanceForMonth} bottles</p>
              </div>
              <div>
                <h3>📊 Monthly Summary</h3>
                <p><strong>Total Delivered:</strong> ${totalDelivered} bottles</p>
                <p><strong>Total Collected:</strong> ${totalCollected} bottles</p>
                <p><strong>Net Change:</strong> ${totalDelivered - totalCollected} bottles</p>
                <p><strong>Total Amount:</strong> Rs. ${totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <h3>📅 Daily Breakdown</h3>
            <table class="tracking-table">
              <thead>
                <tr>
                  <th rowspan="2">Day</th>
                  <th rowspan="2">Date</th>
                  <th colspan="2">🍾 Bottles</th>
                  <th rowspan="2">Balance</th>
                  <th rowspan="2">Amount (Rs.)</th>
                </tr>
                <tr>
                  <th>Delivered</th>
                  <th>Collected</th>
                </tr>
              </thead>
              <tbody>
                ${dailyData.map(day => {
                  const dayOfWeek = new Date(year, month - 1, day.day).getDay()
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                  const hasActivity = day.delivered > 0 || day.collected > 0 || day.amount > 0
                  const rowClass = hasActivity ? 'has-activity' : (isWeekend ? 'weekend' : '')
                  
                  return `
                    <tr class="${rowClass}">
                      <td><strong>${day.day}</strong></td>
                      <td>${day.date}</td>
                      <td>${day.delivered > 0 ? day.delivered : '-'}</td>
                      <td>${day.collected > 0 ? day.collected : '-'}</td>
                      <td><strong>${day.balance}</strong></td>
                      <td>${day.amount > 0 ? day.amount : '-'}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>

            <div class="summary">
              <h3>💰 Invoice Summary</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <p><strong>Opening Balance:</strong> ${openingBalanceForMonth} bottles</p>
                  <p><strong>Total Delivered:</strong> ${totalDelivered} bottles</p>
                  <p><strong>Total Collected:</strong> ${totalCollected} bottles</p>
                  <p><strong>Closing Balance:</strong> ${runningBalance} bottles</p>
                </div>
                <div style="text-align: right;">
                  <p><strong>Opening Bottles Cost:</strong> Rs. ${openingBottlesCost.toFixed(2)}</p>
                  <p><strong>Monthly Deliveries:</strong> Rs. ${totalAmount.toFixed(2)}</p>
                  <hr style="margin: 10px 0; border: 1px solid #333;">
                  <p class="highlight" style="font-size: 16px;"><strong>TOTAL AMOUNT DUE: Rs. ${grandTotalAmount.toFixed(2)}</strong></p>
                  <p style="margin-top: 10px; color: #666; font-size: 10px;">
                    Generated on: ${new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div style="margin-top: 20px; text-align: center; color: #666; font-size: 10px;">
              <p>🍾 Product-wise bottle tracking ensures accurate inventory management</p>
              <p><strong>Note:</strong> Invoice includes opening bottles cost + monthly deliveries</p>
              <p>AquaFine - Premium Water Supply | Daily Bottle Accountability System</p>
            </div>
          </body>
        </html>
      `)
      
      try {
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
        }, 500) // Give the document time to load
      } catch (printError) {
        console.error('Error during print:', printError)
        alert('Error printing document: ' + printError.message)
      }

    } catch (error) {
      console.error('Error generating daily bottle tracking invoice:', error)
      alert('Error generating invoice: ' + error.message)
    }
  }

  useEffect(() => {
    calculateLedger()
  }, [calculateLedger])

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
            <SearchableCustomerSelect
              customers={customers}
              selectedCustomer={selectedCustomerObj}
              onCustomerSelect={(customer) => {
                setSelectedCustomerObj(customer)
                setSelectedCustomer(customer ? customer.name : '')
              }}
              placeholder="Search and select customer for ledger..."
              label="Select Customer"
            />
            {selectedCustomerObj && (
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
                <SearchableCustomerSelect
                  customers={customers}
                  selectedCustomer={selectedCustomerObjForInvoice}
                  onCustomerSelect={(customer) => {
                    setSelectedCustomerObjForInvoice(customer)
                    setSelectedCustomer(customer ? customer.name : '')
                  }}
                  placeholder="Search and select customer for invoice..."
                  label="Select Customer for Invoice"
                />
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

              {selectedCustomerObjForInvoice && fromDate && toDate && (
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">
                    📋 Invoice will include all bottles delivered to <strong>{selectedCustomerObjForInvoice.name}</strong> from <strong>{fromDate}</strong> to <strong>{toDate}</strong>
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

          {/* Generate Daily Bottle Tracking Invoice */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-green-700">🍾 Daily Bottle Tracking Invoice</h4>
            <div className="space-y-3">
              <div>
                <SearchableCustomerSelect
                  customers={customers}
                  selectedCustomer={selectedCustomerObjForInvoice}
                  onCustomerSelect={(customer) => {
                    setSelectedCustomerObjForInvoice(customer)
                  }}
                  placeholder="Search and select customer for bottle tracking..."
                  label="Select Customer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product
                </label>
                <select
                  value={selectedProductForInvoice ? selectedProductForInvoice.id : ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value)
                    setSelectedProductForInvoice(product || null)
                  }}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose a product...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {selectedCustomerObjForInvoice && selectedProductForInvoice && selectedMonth && (
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">
                    🍾 Daily bottle tracking for <strong>{selectedCustomerObjForInvoice.name}</strong> - <strong>{selectedProductForInvoice.name}</strong> in <strong>{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Shows day-by-day breakdown of delivered bottles, collected bottles, daily balance, and amounts
                  </p>
                  <button
                    onClick={printDailyBottleTrackingInvoice}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md transition-colors duration-200 font-medium"
                  >
                    🖨️ Generate Daily Bottle Tracking Invoice
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
