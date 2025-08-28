'use client'
import { useEffect, useState } from 'react'

export default function RiderActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [riders, setRiders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRider, setSelectedRider] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0])
  const [emptyBottlesReceived, setEmptyBottlesReceived] = useState('')
  const [filledBottlesSent, setFilledBottlesSent] = useState('')
  const [filledBottlesBroughtBack, setFilledBottlesBroughtBack] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ridersRes, productsRes, activitiesRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/products'),
        fetch('/api/rider-activities')
      ])

      if (ridersRes.ok) {
        const ridersData = await ridersRes.json()
        // Filter only riders/salesmen
        const riderEmployees = ridersData.filter(emp => emp.employeeType === 'rider')
        setRiders(riderEmployees)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.filter(p => p.isActive))
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json()
        setActivities(activitiesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedRider || !selectedProduct) {
      alert('Please select both rider and product')
      return
    }

    const activityData = {
      employeeId: parseInt(selectedRider),
      productId: parseInt(selectedProduct),
      activityDate: activityDate,
      emptyBottlesReceived: parseInt(emptyBottlesReceived || 0),
      filledBottlesSent: parseInt(filledBottlesSent || 0),
      filledProductBoughtBack: parseInt(filledBottlesBroughtBack || 0),
      notes: notes.trim() || null
    }

    try {
      const response = await fetch('/api/rider-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create rider activity')
      }

      const result = await response.json()
      console.log('Rider activity created successfully:', result)

      // Refresh activities list
      await fetchData()

      // Reset form
      setSelectedRider('')
      setSelectedProduct('')
      setActivityDate(new Date().toISOString().split('T')[0])
      setEmptyBottlesReceived('')
      setFilledBottlesSent('')
      setFilledBottlesBroughtBack('')
      setNotes('')

      alert('Rider activity added successfully!')
    } catch (error) {
      console.error('Error creating rider activity:', error)
      alert('Failed to create rider activity: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rider activities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🚛 Rider Activities Management</h1>
        <p className="text-gray-600">Track product-specific rider activities and bottle movements</p>
      </div>

      {/* Add New Activity Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          ➕ Add New Rider Activity
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Rider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Rider *
            </label>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a rider...</option>
              {riders.map(rider => (
                <option key={rider.id} value={rider.id}>
                  {rider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product *
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a product...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.category})
                </option>
              ))}
            </select>
          </div>

          {/* Activity Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Date *
            </label>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Empty Bottles Received */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📦 Empty Bottles Received
            </label>
            <input
              type="number"
              min="0"
              value={emptyBottlesReceived}
              onChange={(e) => setEmptyBottlesReceived(e.target.value)}
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filled Bottles Sent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🚛 Filled Bottles Sent
            </label>
            <input
              type="number"
              min="0"
              value={filledBottlesSent}
              onChange={(e) => setFilledBottlesSent(e.target.value)}
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filled Bottles Brought Back */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔄 Filled Bottles Brought Back
            </label>
            <input
              type="number"
              min="0"
              value={filledBottlesBroughtBack}
              onChange={(e) => setFilledBottlesBroughtBack(e.target.value)}
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this activity..."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              ✅ Add Rider Activity
            </button>
          </div>
        </form>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📋 Recent Activities
        </h2>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No activities recorded yet</p>
            <p className="text-gray-400">Add your first rider activity above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Rider</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Product</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Empty Received</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Filled Sent</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Filled Brought Back</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 10).map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">
                      {new Date(activity.date).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      {activity.salesmanRepresentative}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {activity.productName || 'N/A'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        📦 {activity.emptyBottlesReceived}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        🚛 {activity.filledBottlesSent}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        🔄 {activity.filledProductBoughtBack}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      {activity.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {activities.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-gray-500">
                  Showing latest 10 activities. <a href="/rider-accountability-ledger" className="text-blue-600 hover:underline">View all in ledger</a>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="text-center">
        <a
          href="/rider-accountability-ledger"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          📊 View Accountability Ledger
        </a>
      </div>
    </div>
  )
}
