'use client'
import { useState, useEffect } from 'react'

export default function TestPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching products...')
        const response = await fetch('/api/products')
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('Products data:', result)
        setData(result)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {data && (
        <div>
          <h2 className="text-xl mb-2">Products ({data.length})</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
