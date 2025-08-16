'use client'
import { useEffect, useState } from 'react'

export default function RiderInOutPage() {
  const [riderActivities, setRiderActivities] = useState([])
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Current date
    employeeId: '',
    salesmanRepresentative: '',
    emptyBottlesReceived: '',
    filledBottlesSent: '',
    filledProductBoughtBack: ''
  })

  useEffect(() => {
    fetchRiderActivities()
    fetchRiders()
  }, [])

  const fetchRiders = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        // Filter only rider type employees
        const riderEmployees = data.filter(emp => 
          emp.employeeType && emp.employeeType.toLowerCase() === 'rider'
        )
        setRiders(riderEmployees)
      }
    } catch (error) {
      console.error('Error fetching riders:', error)
    }
  }

  const fetchRiderActivities = async () => {
    try {
      const response = await fetch('/api/rider-activities')
      if (response.ok) {
        const data = await response.json()
        setRiderActivities(data)
      }
    } catch (error) {
      console.error('Error fetching rider activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAdding(true)

    try {
      const response = await fetch('/api/rider-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          employeeId: '',
          salesmanRepresentative: '',
          emptyBottlesReceived: '',
          filledBottlesSent: '',
          filledProductBoughtBack: ''
        })
        
        // Refresh the list
        fetchRiderActivities()
        alert('Rider activity added successfully!')
      } else {
        alert('Failed to add rider activity')
      }
    } catch (error) {
      console.error('Error adding rider activity:', error)
      alert('Error adding rider activity')
    } finally {
      setAdding(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Calculate accountability for each activity
  const calculateAccountability = (activity) => {
    return activity.filledBottlesSent - activity.filledProductBoughtBack
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🚚 Rider In/Out</h1>
        <p className="text-gray-600">Track bottle movements and salesman activities</p>
      </div>

      {/* Add New Activity Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          ➕ Add Rider Activity
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Rider/Salesman Representative */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👨‍💼 Rider/Salesman
              </label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={(e) => {
                  const selectedRider = riders.find(r => r.id === parseInt(e.target.value))
                  setFormData(prev => ({
                    ...prev,
                    employeeId: e.target.value,
                    salesmanRepresentative: selectedRider ? selectedRider.name : ''
                  }))
                }}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Rider</option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name} - {rider.phone || 'No phone'}
                  </option>
                ))}
              </select>
            </div>

            {/* Empty Bottles Received */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📦 Empty Bottles Received
              </label>
              <input
                type="number"
                name="emptyBottlesReceived"
                value={formData.emptyBottlesReceived}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of empty bottles"
              />
            </div>

            {/* Filled Bottles Sent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚛 Filled Bottles Sent
              </label>
              <input
                type="number"
                name="filledBottlesSent"
                value={formData.filledBottlesSent}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of filled bottles sent"
              />
            </div>

            {/* Filled Product Bought Back */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔄 Filled Product Bought Back
              </label>
              <input
                type="number"
                name="filledProductBoughtBack"
                value={formData.filledProductBoughtBack}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of filled bottles bought back"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  ➕ Add Activity
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📋 Recent Activities
        </h2>

        {riderActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No rider activities recorded yet</p>
            <p className="text-gray-400">Add your first activity using the form above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Salesman</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Empty Received</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Filled Sent</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Bought Back</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Accountability</th>
                </tr>
              </thead>
              <tbody>
                {riderActivities.map((activity) => {
                  const accountability = calculateAccountability(activity)
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3">
                        {new Date(activity.date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        {activity.salesmanRepresentative}
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
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-medium ${
                          accountability > 0 
                            ? 'bg-green-100 text-green-800' 
                            : accountability < 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {accountability > 0 ? '📈' : accountability < 0 ? '📉' : '⚖️'} {accountability}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {riderActivities.length > 0 && (
          <div className="mt-6 text-center">
            <a
              href="/rider-ledgers"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📊 View Detailed Ledger & Analytics
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
