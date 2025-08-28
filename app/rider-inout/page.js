'use client'
import { useEffect } from 'react'

export default function RiderInOutPage() {
  useEffect(() => {
    // Redirect to the new rider activities page
    window.location.replace('/rider-activities')
  }, [])

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to new rider activities system...</p>
      </div>
    </div>
  )
}
