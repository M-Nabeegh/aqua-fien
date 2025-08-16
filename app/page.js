'use client'
import { useEffect, useState } from 'react'
import DashboardCard from '../components/DashboardCard'
import CircularProgress from '../components/CircularProgress'

export default function Dashboard() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [sellOrders, setSellOrders] = useState([])
  const [customerAdvances, setCustomerAdvances] = useState([])
  const [employeeAdvances, setEmployeeAdvances] = useState([])
  const [riderActivities, setRiderActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching dashboard data...')
        const [customersRes, productsRes, employeesRes, sellOrdersRes, customerAdvancesRes, employeeAdvancesRes, riderActivitiesRes] = await Promise.all([
          fetch('/api/customers').then(r => r.ok ? r.json() : []).catch(err => { console.error('Customers fetch error:', err); return [] }),
          fetch('/api/products').then(r => r.ok ? r.json() : []).catch(err => { console.error('Products fetch error:', err); return [] }),
          fetch('/api/employees').then(r => r.ok ? r.json() : []).catch(err => { console.error('Employees fetch error:', err); return [] }),
          fetch('/api/sell-orders').then(r => r.ok ? r.json() : []).catch(err => { console.error('Sell orders fetch error:', err); return [] }),
          fetch('/api/customer-advances').then(r => r.ok ? r.json() : []).catch(err => { console.error('Customer advances fetch error:', err); return [] }),
          fetch('/api/employee-advances').then(r => r.ok ? r.json() : []).catch(err => { console.error('Employee advances fetch error:', err); return [] }),
          fetch('/api/rider-activities').then(r => r.ok ? r.json() : []).catch(err => { console.error('Rider activities fetch error:', err); return [] })
        ])

        console.log('Fetched data:', {
          customers: Array.isArray(customersRes) ? customersRes.length : 'not array',
          products: Array.isArray(productsRes) ? productsRes.length : 'not array',
          employees: Array.isArray(employeesRes) ? employeesRes.length : 'not array',
          sellOrders: Array.isArray(sellOrdersRes) ? sellOrdersRes.length : 'not array',
          customerAdvances: Array.isArray(customerAdvancesRes) ? customerAdvancesRes.length : 'not array',
          employeeAdvances: Array.isArray(employeeAdvancesRes) ? employeeAdvancesRes.length : 'not array',
          riderActivities: Array.isArray(riderActivitiesRes) ? riderActivitiesRes.length : 'not array'
        })

        setCustomers(Array.isArray(customersRes) ? customersRes : [])
        setProducts(Array.isArray(productsRes) ? productsRes : [])
        setEmployees(Array.isArray(employeesRes) ? employeesRes : [])
        setSellOrders(Array.isArray(sellOrdersRes) ? sellOrdersRes : [])
        setCustomerAdvances(Array.isArray(customerAdvancesRes) ? customerAdvancesRes : [])
        setEmployeeAdvances(Array.isArray(employeeAdvancesRes) ? employeeAdvancesRes : [])
        setRiderActivities(Array.isArray(riderActivitiesRes) ? riderActivitiesRes : [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate metrics with safe array checks
  const totalRevenue = Array.isArray(sellOrders) ? sellOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0) : 0
  const totalCustomerAdvances = Array.isArray(customerAdvances) ? customerAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount || 0), 0) : 0
  const totalEmployeeAdvances = Array.isArray(employeeAdvances) ? employeeAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount || 0), 0) : 0
  const totalEmployeeSalaries = Array.isArray(employees) ? employees.reduce((sum, emp) => sum + parseFloat(emp.salary || 0), 0) : 0
  
  // Calculate customer outstanding balances
  const customerOutstanding = Array.isArray(customers) && Array.isArray(customerAdvances) && Array.isArray(sellOrders) ? customers.reduce((total, customer) => {
    const custAdvances = customerAdvances.filter(adv => adv.customerName === customer.name)
      .reduce((sum, adv) => sum + parseFloat(adv.amount || 0), 0)
    const custSales = sellOrders.filter(order => order.customerName === customer.name)
      .reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0)
    const balance = custAdvances - custSales
    return total + (balance > 0 ? balance : 0)
  }, 0) : 0

  // Calculate employee outstanding
  const employeeOutstanding = employees.reduce((total, employee) => {
    const empAdvances = employeeAdvances.filter(adv => adv.employeeName === employee.name)
      .reduce((sum, adv) => sum + parseFloat(adv.amount || 0), 0)
    const salary = parseFloat(employee.salary || 0)
    const deficit = empAdvances - salary
    return total + (deficit > 0 ? deficit : 0)
  }, 0)

  // Calculate rider analytics
  const riderStats = {
    totalEmptyReceived: riderActivities.reduce((sum, activity) => sum + activity.emptyBottlesReceived, 0),
    totalFilledSent: riderActivities.reduce((sum, activity) => sum + activity.filledBottlesSent, 0),
    totalBoughtBack: riderActivities.reduce((sum, activity) => sum + activity.filledProductBoughtBack, 0),
    totalAccountability: riderActivities.reduce((sum, activity) => sum + (activity.filledBottlesSent - activity.filledProductBoughtBack), 0),
    activitiesCount: riderActivities.length
  }
  riderStats.averageAccountability = riderStats.activitiesCount > 0 ? riderStats.totalAccountability / riderStats.activitiesCount : 0
  riderStats.efficiencyRate = riderStats.totalFilledSent > 0 ? (riderStats.totalAccountability / riderStats.totalFilledSent) * 100 : 0

  const formatCurrency = (amount) => `PKR ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <CircularProgress value={75} size={80} color="#3B82F6">
            <div className="text-blue-600 font-bold">Loading...</div>
          </CircularProgress>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AquaFine Dashboard</h1>
        <p className="text-gray-600">Real-time business insights and analytics</p>
        <div className="mt-4 text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard
          title="Total Revenue"
          subtitle="All-time sales"
          value={formatCurrency(totalRevenue)}
          change={12.5}
          changeType="positive"
          icon="💰"
          color="#10B981"
          showProgress={true}
          progressValue={totalRevenue}
          progressMax={Math.max(totalRevenue * 1.2, 1000)}
        />
        
        <DashboardCard
          title="Active Products"
          subtitle="Available products"
          value={products.length}
          change={0}
          changeType="neutral"
          icon="📦"
          color="#06B6D4"
          showProgress={true}
          progressValue={products.length}
          progressMax={Math.max(products.length + 5, 10)}
        />
        
        <DashboardCard
          title="Active Customers"
          subtitle="Registered customers"
          value={customers.length}
          change={8.2}
          changeType="positive"
          icon="👥"
          color="#3B82F6"
          showProgress={true}
          progressValue={customers.length}
          progressMax={Math.max(customers.length + 10, 20)}
        />
        
        <DashboardCard
          title="Team Members"
          subtitle="Active employees"
          value={employees.length}
          change={5.0}
          changeType="positive"
          icon="👷"
          color="#8B5CF6"
          showProgress={true}
          progressValue={employees.length}
          progressMax={Math.max(employees.length + 5, 10)}
        />
        
        <DashboardCard
          title="Outstanding Balance"
          subtitle="Customer + Employee"
          value={formatCurrency(customerOutstanding + employeeOutstanding)}
          change={-3.2}
          changeType="negative"
          icon="⚠️"
          color="#F59E0B"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Analytics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            👥 Customer Analytics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Advances Given</span>
              <span className="font-bold text-green-600">{formatCurrency(totalCustomerAdvances)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sales Made</span>
              <span className="font-bold text-blue-600">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Customer Credit Balance</span>
              <span className="font-bold text-orange-600">{formatCurrency(customerOutstanding)}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Order Value</span>
                <span className="font-bold">{formatCurrency(sellOrders.length > 0 ? totalRevenue / sellOrders.length : 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Analytics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            👷 Employee Analytics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Monthly Salaries</span>
              <span className="font-bold text-blue-600">{formatCurrency(totalEmployeeSalaries)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Advances Given</span>
              <span className="font-bold text-green-600">{formatCurrency(totalEmployeeAdvances)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Remaining to Pay</span>
              <span className="font-bold text-purple-600">{formatCurrency(Math.max(0, totalEmployeeSalaries - totalEmployeeAdvances))}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Salary</span>
                <span className="font-bold">{formatCurrency(employees.length > 0 ? totalEmployeeSalaries / employees.length : 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rider Analytics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🚚 Rider Analytics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Filled Bottles Sent</span>
              <span className="font-bold text-green-600">{riderStats.totalFilledSent}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bottles Bought Back</span>
              <span className="font-bold text-orange-600">{riderStats.totalBoughtBack}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Accountability</span>
              <span className={`font-bold ${riderStats.totalAccountability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {riderStats.totalAccountability}
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Efficiency Rate</span>
                <span className="font-bold text-indigo-600">{riderStats.efficiencyRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <a href="/customers" className="bg-white bg-opacity-20 rounded-lg p-4 text-center hover:bg-opacity-30 transition-all">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium">Add Customer</div>
          </a>
          <a href="/sell-order" className="bg-white bg-opacity-20 rounded-lg p-4 text-center hover:bg-opacity-30 transition-all">
            <div className="text-2xl mb-2">🛒</div>
            <div className="font-medium">Create Order</div>
          </a>
          <a href="/employees" className="bg-white bg-opacity-20 rounded-lg p-4 text-center hover:bg-opacity-30 transition-all">
            <div className="text-2xl mb-2">👷</div>
            <div className="font-medium">Add Employee</div>
          </a>
          <a href="/rider-inout" className="bg-white bg-opacity-20 rounded-lg p-4 text-center hover:bg-opacity-30 transition-all">
            <div className="text-2xl mb-2">🚚</div>
            <div className="font-medium">Rider Activity</div>
          </a>
          <a href="/expenditures" className="bg-white bg-opacity-20 rounded-lg p-4 text-center hover:bg-opacity-30 transition-all">
            <div className="text-2xl mb-2">💸</div>
            <div className="font-medium">Add Expense</div>
          </a>
          <a href="/reports" className="bg-white bg-opacity-20 rounded-lg p-4 text-center hover:bg-opacity-30 transition-all">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium">View Reports</div>
          </a>
        </div>
      </div>
    </div>
  )
}
