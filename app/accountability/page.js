'use client'
import { Suspense } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import RiderAccountability from '../../components/RiderAccountability'

export default function RiderAccountabilityPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          }>
            <RiderAccountability />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
