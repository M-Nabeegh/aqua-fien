'use client'
import { useEffect } from 'react'

export default function RiderLedgersPage() {
  useEffect(() => {
    // Redirect to the new accountability ledger page
    window.location.replace('/rider-accountability-ledger')
  }, [])

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to new accountability ledger...</p>
      </div>
    </div>
  )
}
